// app/api/newsletter/preview/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryOne } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const newsletter = await queryOne<{
      id: number;
      title: string;
      content: string;
      image_url: string | null;
      audience: string;
      status: string;
      created_at: Date;
    }>`
      SELECT id, title, content, image_url, audience, status, created_at
      FROM newsletter
      WHERE id = ${id}
    `;

    if (!newsletter) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, preview: newsletter });
  } catch (err) {
    console.error('Preview error:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
