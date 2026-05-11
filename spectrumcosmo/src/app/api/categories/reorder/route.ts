import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { categories } = await req.json();
  const db = getDb();
  for (const cat of categories) {
    await db`
      UPDATE categories SET sort_order = ${cat.sort_order} WHERE id = ${cat.id}
    `;
  }
  return NextResponse.json({ success: true });
}
