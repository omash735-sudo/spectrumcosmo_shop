import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(
  process.env.AUTH_GOOGLE_ID!,
  process.env.AUTH_GOOGLE_SECRET!,
  `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
);

export async function POST(req: NextRequest) {
  console.log('Google callback: Request received');

  try {
    const body = await req.json();
    console.log('Google callback: Body:', JSON.stringify(body, null, 2));

    const { code } = body;

    if (!code) {
      console.error('Google callback: No code provided');
      return NextResponse.json(
        { error: 'No authorization code provided' },
        { status: 400 }
      );
    }

    console.log('Google callback: Exchanging code for tokens...');

    const { tokens } = await client.getToken(code);
    console.log('Google callback: Tokens received');

    if (!tokens.id_token) {
      console.error('Google callback: No id_token received');
      return NextResponse.json(
        { error: 'Failed to get user info' },
        { status: 400 }
      );
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.AUTH_GOOGLE_ID!,
    });

    const payload = ticket.getPayload();
    console.log('Google callback: User payload received');

    if (!payload || !payload.email) {
      console.error('Google callback: Invalid payload');
      return NextResponse.json(
        { error: 'Invalid user data' },
        { status: 400 }
      );
    }

    const userEmail = payload.email;
    const userName = payload.name || userEmail;

    console.log('Google callback: Processing email:', userEmail);

    const sql = getDb();
    console.log('Google callback: Database connected');

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

    console.log('Google callback: Generating JWT with JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'MISSING');

    const token = jwt.sign(
      {
        id: userId,
        email: userEmail.toLowerCase(),
        name: displayName,
        role: 'customer'
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    console.log('Google callback: JWT generated');

    const response = NextResponse.json({
      success: true,
      user: { id: userId, email: userEmail, name: displayName }
    });

    console.log('Google callback: Setting cookie...');

    response.cookies.set('user_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? 'spectrumcosmo.vercel.app' : undefined,
    });

    console.log('Google callback: Success! Returning response');
    return response;

  } catch (error) {
    console.error('Google callback error:', error);
    return NextResponse.json(
      { error: 'Authentication failed: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
