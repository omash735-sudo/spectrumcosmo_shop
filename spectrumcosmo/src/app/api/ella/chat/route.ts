import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { EllaService } from '@/lib/ella/EllaService';
import { detectCurrencyFromLocale, COUNTRY_CURRENCY_MAP, CurrencyCode } from '@/lib/ella/types/currency';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.error('[API] GROQ_API_KEY is not set in environment variables');
  throw new Error('GROQ_API_KEY is not set in environment variables');
}

const ellaService = new EllaService(GROQ_API_KEY);

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  console.log('[API] POST /api/ella/chat - Request started');

  try {
    console.log('[API] Step 1: Parsing request body');
    const body = await req.json();
    console.log('[API] Step 2: Body received:', JSON.stringify(body, null, 2));

    const { message, sessionId, customerEmail, customerName, countryCode } = body;

    if (!message || !sessionId) {
      console.log('[API] Step 3: Validation failed - missing required fields');
      console.log('[API] message present:', !!message);
      console.log('[API] sessionId present:', !!sessionId);
      return NextResponse.json(
        { error: 'Message and sessionId are required' },
        { status: 400 }
      );
    }
    console.log('[API] Step 3: Validation passed');

    console.log('[API] Step 4: Processing headers');
    const acceptLanguage = req.headers.get('accept-language') || '';
    const locale = acceptLanguage.split(',')[0] || 'en-US';
    console.log('[API] Step 4: Locale detected:', locale);
    
    console.log('[API] Step 5: Detecting currency');
    let currency: CurrencyCode | undefined = undefined;
    
    if (countryCode) {
      const upper = countryCode.toUpperCase();
      console.log('[API] Step 5a: Country code provided:', countryCode, 'uppercase:', upper);
      if (COUNTRY_CURRENCY_MAP[upper]) {
        currency = COUNTRY_CURRENCY_MAP[upper].currency as CurrencyCode;
        console.log('[API] Step 5b: Currency from country code:', currency);
      } else {
        console.log('[API] Step 5b: No currency mapping found for country code:', upper);
      }
    }
    
    if (!currency) {
      currency = detectCurrencyFromLocale(locale);
      console.log('[API] Step 5c: Currency from locale:', currency);
    }

    console.log('[API] Step 6: Calling EllaService.processMessage with params:', {
      message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
      sessionId,
      customerEmail: customerEmail || 'not provided',
      customerName: customerName || 'not provided',
      currency,
      locale,
      countryCode: countryCode || 'not provided'
    });

    console.log('[API] Step 7: Waiting for EllaService response...');
    const response = await ellaService.processMessage({
      message,
      sessionId,
      customerEmail,
      customerName,
      currency,
      locale,
      countryCode,
    });
    console.log('[API] Step 8: EllaService response received');

    const duration = Date.now() - startTime;
    console.log('[API] Step 9: Response prepared, duration:', duration, 'ms');
    console.log('[API] Response data:', JSON.stringify(response, null, 2));

    return NextResponse.json(response);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[API] ERROR at Step 10: Exception caught');
    console.error('[API] Error details:', error);
    console.error('[API] Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
    console.error('[API] Request failed after:', duration, 'ms');
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  console.log('[API] GET /api/ella/chat - Request started');
  
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId');
    console.log('[API] GET - SessionId:', sessionId);

    if (!sessionId) {
      console.log('[API] GET - Validation failed: missing sessionId');
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    console.log('[API] GET - Fetching conversation from database');
    const sql = getDb();
    const conversation = await sql`
      SELECT id FROM ella_conversations 
      WHERE session_id = ${sessionId}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    console.log('[API] GET - Conversation found:', conversation.length > 0);

    if (conversation.length === 0) {
      console.log('[API] GET - No conversation found, returning empty messages');
      return NextResponse.json({ messages: [] });
    }

    console.log('[API] GET - Fetching messages for conversation:', conversation[0].id);
    const messages = await sql`
      SELECT role, content, created_at 
      FROM ella_messages 
      WHERE conversation_id = ${conversation[0].id}
      ORDER BY created_at ASC
    `;

    console.log('[API] GET - Messages fetched:', messages.length);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('[API] GET - ERROR:', error);
    console.error('[API] GET - Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to fetch conversation history' },
      { status: 500 }
    );
  }
}
