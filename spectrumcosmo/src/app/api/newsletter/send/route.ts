// app/api/newsletter/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryOne } from '@/lib/db';
import { sendNewsletter } from '@/lib/newsletter/send';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      content,
      image_url,
      audience = 'all',
      status = 'draft',
      auto_send = false,
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content required' },
        { status: 400 }
      );
    }

    const newsletter = await queryOne<{
      id: number;
      title: string;
      content: string;
      image_url: string | null;
      audience: string;
      status: string;
      auto_send: boolean;
      created_at: Date;
    }>`
      INSERT INTO newsletter (
        title,
        content,
        image_url,
        audience,
        status,
        auto_send,
        created_at
      )
      VALUES (
        ${title},
        ${content},
        ${image_url || null},
        ${audience},
        ${status},
        ${auto_send},
        NOW()
      )
      RETURNING *
    `;

    if (!newsletter) {
      return NextResponse.json({ error: 'Failed to create newsletter' }, { status: 500 });
    }

    if (auto_send && status === 'sent') {
      await sendNewsletter(newsletter.id);
    }

    return NextResponse.json({ success: true, newsletter });
  } catch (err) {
    console.error('Newsletter creation error:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
