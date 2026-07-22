import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    const { user } = await req.json();
    
    if (!user || !user.email) {
      return NextResponse.json(
        { error: 'Invalid user data' },
        { status: 400 }
      );
    }

    const sql = getDb();
    
    // Check if user exists
    const [existingUser] = await sql`
      SELECT id, email, name FROM users WHERE email = ${user.email}
    `;
    
    let userId;
    let userName;
    
    if (existingUser) {
      userId = existingUser.id;
      userName = existingUser.name;
    } else {
      // Create new user
      const [newUser] = await sql`
        INSERT INTO users (email, name, email_verified, created_at)
        VALUES (${user.email}, ${user.name || user.email}, true, NOW())
        RETURNING id, name
      `;
      userId = newUser.id;
      userName = newUser.name;
    }
    
    // Create JWT token
    const token = jwt.sign(
      { 
        id: userId, 
        email: user.email, 
        name: userName,
        role: 'customer' 
      },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: '7d' }
    );
    
    // Create response with redirect URL
    const redirectUrl = new URL('/account', process.env.NEXTAUTH_URL);
    
    // Set cookie and return response
    const response = NextResponse.json({ 
      success: true,
      user: { id: userId, email: user.email, name: userName },
      redirectUrl: redirectUrl.toString()
    });
    
    response.cookies.set('user_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    
    return response;
    
  } catch (error) {
    console.error('Google callback error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
