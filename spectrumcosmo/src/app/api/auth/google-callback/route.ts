import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  console.log('Google callback: Request received');

  try {
    const body = await req.json();
    console.log('Google callback: Body:', JSON.stringify(body, null, 2));

    const { user } = body;

    if (!user || !user.email) {
      console.error('Google callback: Invalid user data - missing email');
      return NextResponse.json(
        { error: 'Invalid user data' },
        { status: 400 }
      );
    }

    console.log('Google callback: Processing email:', user.email);

    const sql = getDb();
    console.log('Google callback: Database connected');

    const [existingUser] = await sql`
      SELECT id, email, name FROM users WHERE email = ${user.email.toLowerCase()}
    `;

    console.log('Google callback: Existing user:', existingUser ? existingUser.id : 'none');

    let userId;
    let userName;

    if (existingUser) {
      userId = existingUser.id;
      userName = existingUser.name;
      console.log('Google callback: Using existing user:', userId);
    } else {
      console.log('Google callback: Creating new user...');
      const [newUser] = await sql`
        INSERT INTO users (email, name, email_verified, created_at, account_status)
        VALUES (${user.email.toLowerCase()}, ${user.name || user.email}, true, NOW(), 'active')
        RETURNING id, name
      `;
      userId = newUser.id;
      userName = newUser.name;
      console.log('Google callback: New user created:', userId);
    }

    console.log('Google callback: Generating JWT with JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'MISSING');

    const token = jwt.sign(
      {
        id: userId,
        email: user.email.toLowerCase(),
        name: userName,
        role: 'customer'
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    console.log('Google callback: JWT generated');

    const response = NextResponse.json({
      success: true,
      user: { id: userId, email: user.email, name: userName }
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
