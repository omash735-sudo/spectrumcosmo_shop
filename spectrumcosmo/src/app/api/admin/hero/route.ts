import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const adminError = requireAdmin(req);
  if (adminError) return adminError;

  const sql = getDb();
  const data = await sql`SELECT * FROM hero_sections ORDER BY page`;
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const adminError = requireAdmin(req);
  if (adminError) return adminError;

  try {
    const body = await req.json();
    const {
      page, type, images, title, subtitle, text_color, text_size,
      text_alignment, vertical_position, button_label, button_link,
      button_placement, overlay_opacity, active
    } = body;

    const sql = getDb();
    await sql`
      INSERT INTO hero_sections (page, type, images, title, subtitle, text_color, text_size, text_alignment, vertical_position, button_label, button_link, button_placement, overlay_opacity, active, updated_at)
      VALUES (${page}, ${type}, ${images}, ${title}, ${subtitle}, ${text_color}, ${text_size}, ${text_alignment}, ${vertical_position}, ${button_label}, ${button_link}, ${button_placement}, ${overlay_opacity}, ${active}, NOW())
      ON CONFLICT (page) DO UPDATE SET
        type = EXCLUDED.type,
        images = EXCLUDED.images,
        title = EXCLUDED.title,
        subtitle = EXCLUDED.subtitle,
        text_color = EXCLUDED.text_color,
        text_size = EXCLUDED.text_size,
        text_alignment = EXCLUDED.text_alignment,
        vertical_position = EXCLUDED.vertical_position,
        button_label = EXCLUDED.button_label,
        button_link = EXCLUDED.button_link,
        button_placement = EXCLUDED.button_placement,
        overlay_opacity = EXCLUDED.overlay_opacity,
        active = EXCLUDED.active,
        updated_at = NOW()
    `;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
