import { NextRequest, NextResponse } from 'next/server';
import { signAdminToken } from '@/lib/auth';
import { getDb } from '@/lib/db';
import bcrypt from 'bcryptjs';

interface AdminUser {
  id: string;
  name: string;
  username: string;
  email: string;
  password_hash: string;
  is_admin: boolean;
  account_status: string;
}

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    const sql = getDb();

    const usersResult = await sql`
      SELECT id, name, username, email, password_hash, is_admin, account_status 
      FROM users 
      WHERE username = ${username} AND is_admin = true
    `;

    // Cast to array to satisfy TypeScript
    const users = usersResult as AdminUser[];
    
    if (users.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
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

    const token = signAdminToken({
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: 'admin',
    });

    const res = NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        name: admin.name || admin.username,
        email: admin.email,
        username: admin.username,
      },
    });

    res.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return res;
  } catch (err) {
    console.error('Admin login error:', err);
    const message = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete('admin_token');
  return res;
}
