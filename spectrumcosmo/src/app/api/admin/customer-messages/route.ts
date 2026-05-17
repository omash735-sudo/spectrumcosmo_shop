import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authError = requireAdmin(req);
    if (authError) return authError;

    const sql = getDb();
    const messages = await sql`
      SELECT 
        cm.*,
        os.name as status_name,
        tc.name as category_name
      FROM customer_messages cm
      LEFT JOIN order_statuses os ON os.id = cm.status_id
      LEFT JOIN template_categories tc ON tc.id = cm.category_id
      ORDER BY cm.created_at DESC
    `;
    return NextResponse.json(messages);
  } catch (err: any) {
    console.error('GET customer messages error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authError = requireAdmin(req);
    if (authError) return authError;

    const { name, slug, status_id, category_id, title, message, instructions, button_text, button_link, html_content, progress_step, is_active } = await req.json();

    if (!name || !message) {
      return NextResponse.json({ error: 'Name and message are required' }, { status: 400 });
    }

    const sql = getDb();
    const [result] = await sql`
      INSERT INTO customer_messages (
        name, slug, status_id, category_id, title, message, instructions, 
        button_text, button_link, html_content, progress_step, is_active
      ) VALUES (
        ${name}, ${slug}, ${status_id || null}, ${category_id || null}, ${title || null}, ${message}, ${instructions || null},
        ${button_text || null}, ${button_link || null}, ${html_content || null}, ${progress_step || 0}, ${is_active ?? true}
      )
      RETURNING *
    `;
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('POST customer message error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authError = requireAdmin(req);
    if (authError) return authError;

    const { id, name, slug, status_id, category_id, title, message, instructions, button_text, button_link, html_content, progress_step, is_active } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const sql = getDb();
    const [result] = await sql`
      UPDATE customer_messages 
      SET name = COALESCE(${name}, name),
          slug = COALESCE(${slug}, slug),
          status_id = COALESCE(${status_id}, status_id),
          category_id = COALESCE(${category_id}, category_id),
          title = COALESCE(${title}, title),
          message = COALESCE(${message}, message),
          instructions = COALESCE(${instructions}, instructions),
          button_text = COALESCE(${button_text}, button_text),
          button_link = COALESCE(${button_link}, button_link),
          html_content = COALESCE(${html_content}, html_content),
          progress_step = COALESCE(${progress_step}, progress_step),
          is_active = COALESCE(${is_active}, is_active),
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('PATCH customer message error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authError = requireAdmin(req);
    if (authError) return authError;

    const id = new URL(req.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const sql = getDb();
    await sql`DELETE FROM customer_messages WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE customer message error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
