// app/api/homepage/popup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryAsArray, queryOne } from '@/lib/db';

interface PopupSettings {
  popup_enabled: boolean;
  popup_title: string;
  popup_message: string;
  popup_image_url: string;
  popup_button_text: string;
  popup_button_link: string;
}

const DEFAULT_POPUP_SETTINGS: PopupSettings = {
  popup_enabled: false,
  popup_title: '',
  popup_message: '',
  popup_image_url: '',
  popup_button_text: '',
  popup_button_link: '',
};

export async function GET() {
  try {
    const rows = await queryAsArray<PopupSettings>`
      SELECT 
        popup_enabled,
        popup_title,
        popup_message,
        popup_image_url,
        popup_button_text,
        popup_button_link
      FROM homepage_settings 
      LIMIT 1
    `;

    const settings = rows[0] || DEFAULT_POPUP_SETTINGS;
    return NextResponse.json(settings);
  } catch (err) {
    console.error('Failed to fetch popup settings:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: PopupSettings = await req.json();
    const sql = getDb();

    await sql`
      UPDATE homepage_settings SET
        popup_enabled = ${body.popup_enabled},
        popup_title = ${body.popup_title},
        popup_message = ${body.popup_message},
        popup_image_url = ${body.popup_image_url},
        popup_button_text = ${body.popup_button_text},
        popup_button_link = ${body.popup_button_link},
        updated_at = NOW()
      WHERE id = 1
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to save popup settings:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
