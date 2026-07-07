// app/api/admin/subscribers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const sql = getDb();
    const result = await sql.query(`
      SELECT 
        id, 
        email, 
        name, 
        status, 
        preferences,
        confirmed_at, 
        unsubscribed_at, 
        created_at
      FROM subscribers
      ORDER BY created_at DESC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscribers' },
      { status: 500 }
    );
  }
}
