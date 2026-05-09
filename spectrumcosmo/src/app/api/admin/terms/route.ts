import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  const sql = getDb();
  const [row] = await sql`SELECT content FROM page_contents WHERE page = 'terms'`;
  return NextResponse.json(row?.content || {});
}

export async function PUT(req: NextRequest) {
  const adminError = requireAdmin(req);
  if (adminError) return adminError;
  const content = await req.json();
  const sql = getDb();
  await sql`
    INSERT INTO page_contents (page, content, updated_at)
    VALUES ('terms', ${content}::jsonb, NOW())
    ON CONFLICT (page) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()
  `;
  return NextResponse.json({ success: true });
}
