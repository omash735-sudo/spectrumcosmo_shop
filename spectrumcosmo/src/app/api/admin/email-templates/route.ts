import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  const sql = getDb();
  const templates = await sql`SELECT * FROM email_templates ORDER BY name`;
  return NextResponse.json(templates);
}

export async function PATCH(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const { id, html_template } = await req.json();
  const sql = getDb();
  await sql`
    UPDATE email_templates 
    SET html_template = ${html_template}, updated_at = NOW()
    WHERE id = ${id}
  `;
  return NextResponse.json({ success: true });
}
