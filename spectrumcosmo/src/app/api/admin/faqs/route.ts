import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET all FAQs (admin view)
export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const sql = getDb();
    const faqs = await sql`
      SELECT * FROM faqs ORDER BY created_at DESC
    `;
    return NextResponse.json(faqs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST - admin adds or answers FAQ
export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { id, question, answer, is_published } = await req.json();
    const sql = getDb();

    if (id) {
      // Update existing FAQ
      await sql`
        UPDATE faqs 
        SET answer = ${answer}, is_answered = true, answered_at = NOW(), is_published = ${is_published}, updated_at = NOW()
        WHERE id = ${id}
      `;
    } else {
      // Add new FAQ directly
      await sql`
        INSERT INTO faqs (question, answer, is_published, is_answered, answered_at)
        VALUES (${question}, ${answer}, true, true, NOW())
      `;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE - remove FAQ
export async function DELETE(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const sql = getDb();
    await sql`DELETE FROM faqs WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
