import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  const authError = requireAdmin(new NextRequest(''));
  if (authError) return authError;

  const sql = getDb();
  const statuses = await sql`
    SELECT * FROM order_status_messages 
    ORDER BY display_order ASC, id ASC
  `;
  return NextResponse.json(statuses);
}

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const body = await req.json();
  const { status, customer_message, admin_instructions, email_subject, email_template, estimated_days, display_order, is_active } = body;

  if (!status || !customer_message) {
    return NextResponse.json({ error: 'Status and customer message required' }, { status: 400 });
  }

  const sql = getDb();

  // Check if status already exists
  const existing = await sql`SELECT id FROM order_status_messages WHERE status = ${status}`;
  if (existing.length) {
    return NextResponse.json({ error: 'Status already exists' }, { status: 400 });
  }

  await sql`
    INSERT INTO order_status_messages (status, customer_message, admin_instructions, email_subject, email_template, estimated_days, display_order, is_active)
    VALUES (${status}, ${customer_message}, ${admin_instructions || null}, ${email_subject || null}, ${email_template || null}, ${estimated_days || 0}, ${display_order || 0}, ${is_active ?? true})
  `;
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const body = await req.json();
  const { id, status, customer_message, admin_instructions, email_subject, email_template, estimated_days, display_order, is_active } = body;

  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  const sql = getDb();
  await sql`
    UPDATE order_status_messages 
    SET 
      status = COALESCE(${status}, status),
      customer_message = COALESCE(${customer_message}, customer_message),
      admin_instructions = COALESCE(${admin_instructions}, admin_instructions),
      email_subject = COALESCE(${email_subject}, email_subject),
      email_template = COALESCE(${email_template}, email_template),
      estimated_days = COALESCE(${estimated_days}, estimated_days),
      display_order = COALESCE(${display_order}, display_order),
      is_active = COALESCE(${is_active}, is_active),
      updated_at = NOW()
    WHERE id = ${id}
  `;
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const id = new URL(req.url).searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  const sql = getDb();
  await sql`DELETE FROM order_status_messages WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}
