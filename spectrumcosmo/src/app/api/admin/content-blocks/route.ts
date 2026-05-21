import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const sql = getDb();
    const blocks = await sql`
      SELECT * FROM content_blocks
      ORDER BY display_order ASC
    `;
    return NextResponse.json(blocks);
  } catch (err) {
    console.error('Failed to fetch content blocks:', err);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { type, title, description, content, is_active } = await req.json();
    const sql = getDb();

    // Get current max display_order
    const [maxOrder] = await sql`SELECT MAX(display_order) as max FROM content_blocks`;
    const newOrder = (maxOrder?.max || 0) + 1;

    const [newBlock] = await sql`
      INSERT INTO content_blocks (type, title, description, content, display_order, is_active, created_at, updated_at)
      VALUES (${type}, ${title}, ${description || ''}, ${content}, ${newOrder}, ${is_active ?? true}, NOW(), NOW())
      RETURNING *
    `;
    return NextResponse.json(newBlock, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
