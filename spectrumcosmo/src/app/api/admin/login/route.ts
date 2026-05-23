import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { signAdminToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }
    
    const sql = getDb();
    
    // Query users table - using correct column names from your schema
    const users = await sql`
      SELECT id, name, email, password_hash, is_admin, account_status
      FROM users 
      WHERE email = ${email}
    `;
    
    // Check if user exists
    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    const user = users[0];
    
    // Check if user is admin
    if (!user.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access only' },
        { status: 403 }
      );
    }
    
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
    
    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Generate admin token
    const token = signAdminToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'admin'
    });
    
    // Create response
    const response = NextResponse.json({
      success: true,
      admin: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    });
    
    // Set cookie
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
    
    return response;
    
  } catch (err: any) {
    console.error('Admin login error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
