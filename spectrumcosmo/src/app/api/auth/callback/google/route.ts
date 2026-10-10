// app/api/auth/callback/google/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(
  process.env.AUTH_GOOGLE_ID!,
  process.env.AUTH_GOOGLE_SECRET!,
  `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
);

const COOKIE_DOMAIN =
  process.env.NODE_ENV === 'production' ? 'spectrumcosmo.vercel.app' : undefined;

// Google client IDs this server accepts tokens for. AUTH_GOOGLE_ID is the
// main one. If your website button or Android app uses a different client ID,
// list it in AUTH_GOOGLE_EXTRA_CLIENT_IDS (comma separated).
function allowedAudiences(): string[] {
  return [
    process.env.AUTH_GOOGLE_ID,
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    ...(process.env.AUTH_GOOGLE_EXTRA_CLIENT_IDS || '').split(','),
  ]
    .map((s) => (s || '').trim())
    .filter(Boolean);
}

class GoogleAuthError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

interface GoogleProfile {
  email: string;
  name: string;
}

// ------------------------------------------------------------------
// Turning something Google gave us into a verified profile.
// The email and name ALWAYS come from Google, never from the request body.
// ------------------------------------------------------------------

async function profileFromIdToken(idToken: string): Promise<GoogleProfile> {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: allowedAudiences(),
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new GoogleAuthError('Invalid Google account data', 401);
  }
  if (payload.email_verified !== true) {
    throw new GoogleAuthError('Google email is not verified', 401);
  }
  return { email: payload.email, name: payload.name || payload.email };
}

async function profileFromAccessToken(accessToken: string): Promise<GoogleProfile> {
  const signal = () => AbortSignal.timeout(8000);

  // 1. Was this token issued to OUR app? Without this check a token minted
  //    for any other app could be replayed here.
  const infoRes = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
    { signal: signal() }
  );
  if (!infoRes.ok) throw new GoogleAuthError('Invalid Google token', 401);
  const info = await infoRes.json();
  const audience = info.aud || info.azp;
  if (!audience || !allowedAudiences().includes(audience)) {
    throw new GoogleAuthError('Google token was not issued for this app', 401);
  }

  // 2. Who is it? (also gives us the display name)
  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: signal(),
  });
  if (!userRes.ok) throw new GoogleAuthError('Invalid Google token', 401);
  const u = await userRes.json();

  if (!u.email) throw new GoogleAuthError('Invalid Google account data', 401);
  const verified = u.email_verified === true || u.email_verified === 'true';
  if (!verified) throw new GoogleAuthError('Google email is not verified', 401);
  if (info.email && String(info.email).toLowerCase() !== String(u.email).toLowerCase()) {
    throw new GoogleAuthError('Invalid Google token', 401);
  }

  return { email: u.email, name: u.name || u.email };
}

// ------------------------------------------------------------------
// Find or create the account, then build the session cookie.
// ------------------------------------------------------------------

async function findOrCreateUser(profile: GoogleProfile): Promise<{ id: string; name: string; email: string }> {
  const sql = getDb();
  const email = profile.email.trim().toLowerCase();

  const [existing] = await sql`
    SELECT id, name, account_status
    FROM users
    WHERE email = ${email}
      AND (deleted_at IS NULL OR deleted_at > NOW())
  `;

  if (existing) {
    // Same rule the password login applies. Google sign-in must not be a
    // way around a frozen or banned account.
    if (existing.account_status === 'frozen' || existing.account_status === 'banned') {
      throw new GoogleAuthError(`Account ${existing.account_status}`, 403);
    }
    // Google has just proven this person owns the address.
    await sql`UPDATE users SET email_verified = true WHERE id = ${existing.id} AND email_verified IS NOT TRUE`;
    return { id: existing.id, name: existing.name, email };
  }

  const [created] = await sql`
    INSERT INTO users (email, name, email_verified, created_at, account_status)
    VALUES (${email}, ${profile.name}, true, NOW(), 'active')
    RETURNING id, name
  `;
  return { id: created.id, name: created.name, email };
}

function signSession(user: { id: string; name: string; email: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: 'customer' },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
}

function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set('user_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    domain: COOKIE_DOMAIN,
  });
}

// ------------------------------------------------------------------
// GET: browser redirect flow (Google sends the visitor back with ?code=)
// ------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const base = process.env.NEXTAUTH_URL;
  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/auth/login?error=${reason}`, base));

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');

    if (url.searchParams.get('error')) {
      console.error('Google OAuth error:', url.searchParams.get('error'));
      return fail('google_auth_failed');
    }
    if (!code) {
      console.error('Google callback: No code provided');
      return fail('no_code');
    }

    const { tokens } = await client.getToken(code);
    if (!tokens.id_token) {
      console.error('Google callback: No id_token received');
      return fail('callback_failed');
    }

    const profile = await profileFromIdToken(tokens.id_token);
    const user = await findOrCreateUser(profile);

    const response = NextResponse.redirect(new URL('/account', base));
    setSessionCookie(response, signSession(user));
    return response;
  } catch (error) {
    if (error instanceof GoogleAuthError) {
      console.error('Google callback rejected:', error.message);
      return fail(error.status === 403 ? 'google_auth_failed' : 'callback_failed');
    }
    console.error('Google callback error:', error);
    return fail('callback_failed');
  }
}

// ------------------------------------------------------------------
// POST: client-side Google sign-in (button or app sends us a Google token)
// ------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const idToken = typeof body?.idToken === 'string' ? body.idToken : '';
    const accessToken = typeof body?.accessToken === 'string' ? body.accessToken : '';

    // The request body is untrusted. Without a token that Google itself
    // vouches for, there is nothing to sign anyone in with. (Previously any
    // caller could post { user: { email } } and receive a session cookie for
    // that account.)
    if (!idToken && !accessToken) {
      return NextResponse.json({ error: 'Invalid sign-in request' }, { status: 400 });
    }

    let profile: GoogleProfile;
    try {
      profile = idToken
        ? await profileFromIdToken(idToken)
        : await profileFromAccessToken(accessToken);
    } catch (e) {
      if (e instanceof GoogleAuthError) throw e;
      // google-auth-library throws plain errors for bad or expired tokens.
      console.error('Google token verification failed:', e instanceof Error ? e.message : e);
      throw new GoogleAuthError('Google sign-in failed', 401);
    }

    const user = await findOrCreateUser(profile);

    const response = NextResponse.json(
      { success: true, user: { id: user.id, email: user.email, name: user.name } },
      { status: 200 }
    );
    setSessionCookie(response, signSession(user));
    return response;
  } catch (error) {
    if (error instanceof GoogleAuthError) {
      return NextResponse.json(
        { error: error.status === 403 ? `${error.message}. Please contact support.` : 'Google sign-in failed' },
        { status: error.status }
      );
    }
    console.error('Google callback POST error:', error);
    return NextResponse.json({ error: 'Google sign-in failed. Please try again.' }, { status: 500 });
  }
}
