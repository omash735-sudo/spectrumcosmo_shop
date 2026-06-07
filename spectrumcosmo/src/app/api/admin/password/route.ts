import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryAsArray } from '@/lib/db';
import { requireAdmin, getAdminFromRequest } from '@/lib/auth';
import bcrypt from 'bcryptjs';

interface Admin {
  id: string;
  username: string;
  password_hash: string;
  // other fields...
}

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const adminReq = getAdminFromRequest(req);
    if (!adminReq?.username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Both passwords are required' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
    }

    const sql = getDb();
    const users = await queryAsArray<Admin>`
      SELECT * FROM admins WHERE username = ${adminReq.username}
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    const admin = users[0];
    const isCurrentValid = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!isCurrentValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await sql`UPDATE admins SET password_hash = ${newHash} WHERE id = ${admin.id}`;

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
