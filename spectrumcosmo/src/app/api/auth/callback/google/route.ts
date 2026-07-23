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

async function handleGoogleCallback(code: string) {
  console.log('Google callback: Exchanging code for tokens...');

  const { tokens } = await client.getToken(code);
  console.log('Google callback: Tokens received');

  if (!tokens.id_token) {
    console.error('Google callback: No id_token received');
    throw new Error('No id_token received');
  }

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.AUTH_GOOGLE_ID!,
  });

  const payload = ticket.getPayload();
  console.log('Google callback: User payload received');

  if (!payload || !payload.email) {
    console.error('Google callback: Invalid payload');
    throw new Error('Invalid user data');
  }

  const userEmail = payload.email;
  const userName = payload.name || userEmail;

  console.log('Google callback: Processing email:', userEmail);

  const sql = getDb();

  const [existingUser] = await sql`
    SELECT id, email, name FROM users WHERE email = ${userEmail.toLowerCase()}
  `;

  console.log('Google callback: Existing user:', existingUser ? existingUser.id : 'none');

  let userId;
  let displayName;

  if (existingUser) {
    userId = existingUser.id;
    displayName = existingUser.name;
    console.log('Google callback: Using existing user:', userId);
  } else {
    console.log('Google callback: Creating new user...');
    const [newUser] = await sql`
      INSERT INTO users (email, name, email_verified, created_at, account_status)
      VALUES (${userEmail.toLowerCase()}, ${userName}, true, NOW(), 'active')
      RETURNING id, name
    `;
    userId = newUser.id;
    displayName = newUser.name;
    console.log('Google callback: New user created:', userId);
  }

  const token = jwt.sign(
    {
      id: userId,
      email: userEmail.toLowerCase(),
      name: displayName,
      role: 'customer',
    },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  const response = NextResponse.redirect(new URL('/account', process.env.NEXTAUTH_URL));

  response.cookies.set('user_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    domain: process.env.NODE_ENV === 'production' ? 'spectrumcosmo.vercel.app' : undefined,
  });

  console.log('Google callback: Cookie set, redirecting to /account');
  return response;
}

export async function GET(req: NextRequest) {
  console.log('Google callback: GET request received');

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(new URL('/auth/login?error=google_auth_failed', process.env.NEXTAUTH_URL));
    }

    if (!code) {
      console.error('Google callback: No code provided');
      return NextResponse.redirect(new URL('/auth/login?error=no_code', process.env.NEXTAUTH_URL));
    }

    const response = await handleGoogleCallback(code);
    return response;
  } catch (error) {
    console.error('Google callback error:', error);
    return NextResponse.redirect(new URL('/auth/login?error=callback_failed', process.env.NEXTAUTH_URL));
  }
}

export async function POST(req: NextRequest) {
  try {
    const { accessToken, user } = await req.json();

    console.log('Google callback POST: Processing user:', user?.email);

    if (!user?.email) {
      console.error('Google callback POST: No user email provided');
      return NextResponse.json(
        { error: 'Invalid user data' },
        { status: 400 }
      );
    }

    const sql = getDb();

    const [existingUser] = await sql`
      SELECT id, email, name FROM users WHERE email = ${user.email.toLowerCase()}
    `;

    console.log('Google callback POST: Existing user:', existingUser ? existingUser.id : 'none');

    let userId;
    let displayName;

    if (existingUser) {
      userId = existingUser.id;
      displayName = existingUser.name;
      console.log('Google callback POST: Using existing user:', userId);
    } else {
      console.log('Google callback POST: Creating new user...');
      const [newUser] = await sql`
        INSERT INTO users (email, name, email_verified, created_at, account_status)
        VALUES (${user.email.toLowerCase()}, ${user.name || user.email}, true, NOW(), 'active')
        RETURNING id, name
      `;
      userId = newUser.id;
      displayName = newUser.name;
      console.log('Google callback POST: New user created:', userId);
    }

    const token = jwt.sign(
      {
        id: userId,
        email: user.email.toLowerCase(),
        name: displayName,
        role: 'customer',
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json(
      { success: true, user: { id: userId, email: user.email, name: displayName } },
      { status: 200 }
    );

    response.cookies.set('user_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? 'spectrumcosmo.vercel.app' : undefined,
    });

    console.log('Google callback POST: Cookie set, returning success');
    return response;

  } catch (error) {
    console.error('Google callback POST error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
