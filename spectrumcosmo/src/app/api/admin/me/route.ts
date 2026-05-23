import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth'; // Change this

export async function GET(req: NextRequest) {
  // Use getAdminFromRequest instead of getVerifiedUser
  const admin = getAdminFromRequest(req);
  
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const sql = getDb();
    const [adminUser] = await sql`
      SELECT id, name, email, two_factor_enabled, avatar_url
      FROM users
      WHERE id = ${admin.id} AND is_admin = true
    `;
    
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 401 });
    }
    
    return NextResponse.json({
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      twoFactorEnabled: adminUser.two_factor_enabled || false,
      avatarUrl: adminUser.avatar_url,
    });
  } catch (err) {
    console.error('Failed to get admin info:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
