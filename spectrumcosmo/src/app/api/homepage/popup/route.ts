import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const result = await db`SELECT * FROM homepage_settings LIMIT 1`;
  const settings = result[0] || {};
  return NextResponse.json({
    enabled: settings.popup_enabled || false,
    title: settings.popup_title || '',
    message: settings.popup_message || '',
    image_url: settings.popup_image_url || '',
    button_text: settings.popup_button_text || '',
    button_link: settings.popup_button_link || '',
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = getDb();
  await db`
    UPDATE homepage_settings SET
      popup_enabled = ${body.enabled},
      popup_title = ${body.title},
      popup_message = ${body.message},
      popup_image_url = ${body.image_url},
      popup_button_text = ${body.button_text},
      popup_button_link = ${body.button_link},
      updated_at = NOW()
    WHERE id = 1
  `;
  return NextResponse.json({ success: true });
}
