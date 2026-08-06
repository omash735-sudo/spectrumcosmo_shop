import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { EllaService } from '@/lib/ella/EllaService';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY is not set in environment variables');
}

const ellaService = new EllaService(GROQ_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, sessionId, customerEmail, customerName } = body;

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: 'Message and sessionId are required' },
        { status: 400 }
      );
    }

    const response = await ellaService.processMessage({
      message,
      sessionId,
      customerEmail,
      customerName,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Ella chat error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'sessionId is required' },
      { status: 400 }
    );
  }

  try {
    const sql = getDb();
    const conversation = await sql`
      SELECT id FROM ella_conversations 
      WHERE session_id = ${sessionId}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (conversation.length === 0) {
      return NextResponse.json({ messages: [] });
    }

    const messages = await sql`
      SELECT role, content, created_at 
      FROM ella_messages 
      WHERE conversation_id = ${conversation[0].id}
      ORDER BY created_at ASC
    `;

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation history' },
      { status: 500 }
    );
  }
}
