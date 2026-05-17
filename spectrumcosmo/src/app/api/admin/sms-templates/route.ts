import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET all email templates
export async function GET(req: NextRequest) {
  try {
    const authError = requireAdmin(req);
    if (authError) return authError;

    const sql = getDb();
    const templates = await sql`
      SELECT 
        et.*,
        os.name as status_name,
        tc.name as category_name
      FROM email_templates et
      LEFT JOIN order_statuses os ON os.id = et.status_id
      LEFT JOIN template_categories tc ON tc.id = et.category_id
      ORDER BY et.created_at DESC
    `;
    return NextResponse.json(templates);
  } catch (err: any) {
    console.error('GET email templates error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST - create new email template
export async function POST(req: NextRequest) {
  try {
    const authError = requireAdmin(req);
    if (authError) return authError;

    const { name, slug, description, status_id, category_id, subject, html_content, text_content, is_active } = await req.json();

    if (!name || !subject || !html_content) {
      return NextResponse.json({ error: 'Name, subject, and HTML content are required' }, { status: 400 });
    }

    const sql = getDb();
    const [template] = await sql`
      INSERT INTO email_templates (
        name, slug, description, status_id, category_id, 
        subject, html_content, text_content, is_active
      ) VALUES (
        ${name}, ${slug}, ${description || null}, ${status_id || null}, ${category_id || null},
        ${subject}, ${html_content}, ${text_content || null}, ${is_active ?? true}
      )
      RETURNING *
    `;
    return NextResponse.json(template);
  } catch (err: any) {
    console.error('POST email template error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH - update email template
export async function PATCH(req: NextRequest) {
  try {
    const authError = requireAdmin(req);
    if (authError) return authError;

    const { id, name, slug, description, status_id, category_id, subject, html_content, text_content, is_active } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const sql = getDb();
    const [template] = await sql`
      UPDATE email_templates 
      SET name = COALESCE(${name}, name),
          slug = COALESCE(${slug}, slug),
          description = COALESCE(${description}, description),
          status_id = COALESCE(${status_id}, status_id),
          category_id = COALESCE(${category_id}, category_id),
          subject = COALESCE(${subject}, subject),
          html_content = COALESCE(${html_content}, html_content),
          text_content = COALESCE(${text_content}, text_content),
          is_active = COALESCE(${is_active}, is_active),
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    return NextResponse.json(template);
  } catch (err: any) {
    console.error('PATCH email template error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE - remove email template
export async function DELETE(req: NextRequest) {
  try {
    const authError = requireAdmin(req);
    if (authError) return authError;

    const id = new URL(req.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const sql = getDb();
    await sql`DELETE FROM email_templates WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE email template error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
