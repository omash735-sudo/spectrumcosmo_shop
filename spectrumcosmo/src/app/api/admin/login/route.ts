// src/app/api/admin/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { signAdminToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    
    console.log('=== ADMIN LOGIN ATTEMPT ===');
    console.log('Username:', username);
    
    if (!username || !password) {
      console.log('Missing username or password');
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }
    
    const sql = getDb();
    
    // Query by username from users table where is_admin = true
    const users = await sql`
      SELECT id, name, username, email, password_hash, is_admin, account_status 
      FROM users 
      WHERE username = ${username} AND is_admin = true
    `;
    
    console.log('Users found:', users.length);
    
    if (users.length === 0) {
      console.log('No admin user found with username:', username);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const admin = users[0];
    console.log('Admin found - ID:', admin.id, 'Username:', admin.username);
    
    // Check account status
    if (admin.account_status === 'frozen') {
      console.log('Account frozen');
      return NextResponse.json({ error: 'Account frozen. Contact support.' }, { status: 403 });
    }
    
    if (admin.account_status === 'banned') {
      console.log('Account banned');
      return NextResponse.json({ error: 'Account banned. Contact support.' }, { status: 403 });
    }
    
    // Verify password
    const valid = await bcrypt.compare(password, admin.password_hash);
    console.log('Password valid:', valid);
    
    if (!valid) {
      console.log('Invalid password');
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    // Generate admin token - ONLY use id and role (as defined in AdminPayload)
    const token = signAdminToken({ 
      id: admin.id, 
      role: 'admin'
    });
    
    console.log('Token generated successfully');
    
    // Create response
    const res = NextResponse.json({ 
      success: true,
      admin: {
        id: admin.id,
        name: admin.name || admin.username,
        email: admin.email,
        username: admin.username
      }
    });
    
    // Set cookie
    res.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
    
    console.log('Cookie set successfully');
    console.log('=== LOGIN SUCCESS ===');
    
    return res;
    
  } catch (err: any) {
    console.error('Admin login error:', err);
    return NextResponse.json({ error: 'Internal server error: ' + err.message }, { status: 500 });
  }
}

// Logout endpoint
export async function DELETE() {
  console.log('Admin logout');
  const res = NextResponse.json({ success: true });
  res.cookies.delete('admin_token');
  return res;
}
