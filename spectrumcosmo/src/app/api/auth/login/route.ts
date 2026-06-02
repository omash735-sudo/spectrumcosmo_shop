import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { signUserToken } from '@/lib/userAuth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const sql = getDb();

    // Fetch user by email
    const users = await sql`
      SELECT id, name, email, password_hash, account_status, email_verified
      FROM users
      WHERE email = ${email.toLowerCase()}
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const user = users[0];

    // Check account status
    if (user.account_status === 'frozen') {
      return NextResponse.json(
        { error: 'Account frozen. Contact support.' },
        { status: 403 }
      );
    }
    if (user.account_status === 'banned') {
      return NextResponse.json(
        { error: 'Account banned. Contact support.' },
        { status: 403 }
      );
    }

    // Verify email (optional – remove if you don't require verification)
    if (!user.email_verified) {
      return NextResponse.json(
        { error: 'Please verify your email before logging in', needsVerification: true },
        { status: 403 }
      );
    }

    // Compare password with stored hash
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = signUserToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'customer',
    });

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

    // Set cookie
    response.cookies.set('user_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
