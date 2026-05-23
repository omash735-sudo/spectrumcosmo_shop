import { NextRequest, NextResponse } from 'next/server';
import { signAdminToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';

export async function POST(req: NextRequest) {
  try {
    const { username, password, twoFactorCode } = await req.json();
    const sql = getDb();
    
    // Query by username from users table where is_admin = true
    const users = await sql`
      SELECT id, name, username, email, password_hash, is_admin, account_status, two_factor_enabled, two_factor_secret 
      FROM users 
      WHERE username = ${username} AND is_admin = true
    `;
    
    if (users.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials or not an admin account' }, { status: 401 });
    }

    const admin = users[0];
    
    // Check account status
    if (admin.account_status === 'frozen') {
      return NextResponse.json({ error: 'Account frozen. Contact support.' }, { status: 403 });
    }
    
    if (admin.account_status === 'banned') {
      return NextResponse.json({ error: 'Account banned. Contact support.' }, { status: 403 });
    }
    
    // Verify password
    const valid = await bcrypt.compare(password, admin.password_hash);
    
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check 2FA if enabled
    if (admin.two_factor_enabled === true) {
      if (!twoFactorCode) {
        return NextResponse.json({ 
          error: '2FA code required', 
          requiresTwoFactor: true 
        }, { status: 401 });
      }
      
      const isValid = authenticator.verify({
        token: twoFactorCode,
        secret: admin.two_factor_secret
      });
      
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid 2FA code' }, { status: 401 });
      }
    }
    
    // Generate admin token
    const token = signAdminToken({ 
      id: admin.id, 
      name: admin.name || admin.username,
      email: admin.email,
      role: 'admin'
    });
    
    const res = NextResponse.json({ 
      success: true,
      admin: {
        id: admin.id,
        name: admin.name || admin.username,
        email: admin.email,
        username: admin.username
      }
    });
    
    res.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });
    
    return res;
    
  } catch (err: any) {
    console.error('Admin login error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
