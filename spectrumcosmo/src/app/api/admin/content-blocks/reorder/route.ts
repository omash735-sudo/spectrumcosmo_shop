import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const { orderedIds } = await req.json();
  const sql = getDb();

  for (let i = 0; i < orderedIds.length; i++) {
    await sql`
      UPDATE content_blocks SET display_order = ${i} WHERE id = ${orderedIds[i]}
    `;
  }
  return NextResponse.json({ success: true });
}
