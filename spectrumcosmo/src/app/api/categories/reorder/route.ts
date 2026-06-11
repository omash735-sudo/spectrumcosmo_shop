import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { categories } = await req.json();
  const db = getDb();
  for (const cat of categories) {
    await db`
      UPDATE categories SET sort_order = ${cat.sort_order} WHERE id = ${cat.id}
    `;
  }
  return NextResponse.json({ success: true });
}
