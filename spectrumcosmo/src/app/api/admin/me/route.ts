import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error || !user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const sql = getDb();
    const [admin] = await sql`
      SELECT id, name, email, two_factor_enabled, avatar_url
      FROM users
      WHERE id = ${user.id}
    `;
    
    return NextResponse.json({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      twoFactorEnabled: admin.two_factor_enabled || false,
      avatarUrl: admin.avatar_url,
    });
  } catch (err) {
    console.error('Failed to get admin info:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
