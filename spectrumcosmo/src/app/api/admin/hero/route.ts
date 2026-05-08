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
      page,
      // existing fields (keep as is)
      type, images, title, subtitle, text_color, text_size,
      text_alignment, vertical_position, button_label, button_link,
      button_placement, overlay_opacity, active,
      // new home page fields
      badge_text, badge_link, heading_prefix, highlighted_word,
      description, button1_text, button1_link, button2_text, button2_link,
      feature1, feature2, feature3,
      cat_image1_url, cat_image1_alt,
      cat_image2_url, cat_image2_alt,
      cat_image3_url, cat_image3_alt,
      cat_image4_url, cat_image4_alt
    } = body;

    const sql = getDb();
    await sql`
      INSERT INTO hero_sections (
        page, type, images, title, subtitle, text_color, text_size,
        text_alignment, vertical_position, button_label, button_link,
        button_placement, overlay_opacity, active,
        badge_text, badge_link, heading_prefix, highlighted_word,
        description, button1_text, button1_link, button2_text, button2_link,
        feature1, feature2, feature3,
        cat_image1_url, cat_image1_alt,
        cat_image2_url, cat_image2_alt,
        cat_image3_url, cat_image3_alt,
        cat_image4_url, cat_image4_alt,
        updated_at
      )
      VALUES (
        ${page}, ${type}, ${images}, ${title}, ${subtitle}, ${text_color}, ${text_size},
        ${text_alignment}, ${vertical_position}, ${button_label}, ${button_link},
        ${button_placement}, ${overlay_opacity}, ${active},
        ${badge_text}, ${badge_link}, ${heading_prefix}, ${highlighted_word},
        ${description}, ${button1_text}, ${button1_link}, ${button2_text}, ${button2_link},
        ${feature1}, ${feature2}, ${feature3},
        ${cat_image1_url}, ${cat_image1_alt},
        ${cat_image2_url}, ${cat_image2_alt},
        ${cat_image3_url}, ${cat_image3_alt},
        ${cat_image4_url}, ${cat_image4_alt},
        NOW()
      )
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
        badge_text = EXCLUDED.badge_text,
        badge_link = EXCLUDED.badge_link,
        heading_prefix = EXCLUDED.heading_prefix,
        highlighted_word = EXCLUDED.highlighted_word,
        description = EXCLUDED.description,
        button1_text = EXCLUDED.button1_text,
        button1_link = EXCLUDED.button1_link,
        button2_text = EXCLUDED.button2_text,
        button2_link = EXCLUDED.button2_link,
        feature1 = EXCLUDED.feature1,
        feature2 = EXCLUDED.feature2,
        feature3 = EXCLUDED.feature3,
        cat_image1_url = EXCLUDED.cat_image1_url,
        cat_image1_alt = EXCLUDED.cat_image1_alt,
        cat_image2_url = EXCLUDED.cat_image2_url,
        cat_image2_alt = EXCLUDED.cat_image2_alt,
        cat_image3_url = EXCLUDED.cat_image3_url,
        cat_image3_alt = EXCLUDED.cat_image3_alt,
        cat_image4_url = EXCLUDED.cat_image4_url,
        cat_image4_alt = EXCLUDED.cat_image4_alt,
        updated_at = NOW()
    `;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
