import { NextRequest, NextResponse } from 'next/server';
import { queryOne, queryMany } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    const userId = request.nextUrl.searchParams.get('userId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    let status = null;

    if (userId) {
      status = await queryOne`
        SELECT 
          user_id as "userId",
          session_id as "sessionId",
          has_completed as "hasCompleted",
          current_step as "currentStep",
          last_updated as "lastUpdated"
        FROM user_onboarding 
        WHERE user_id = ${userId}::uuid
        ORDER BY last_updated DESC 
        LIMIT 1
      `;
    }

    return NextResponse.json({ status });
  } catch (error) {
    console.error('Failed to fetch onboarding status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch onboarding status' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, sessionId, hasCompleted, currentStep } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    if (userId) {
      await queryOne`
        INSERT INTO user_onboarding (user_id, session_id, has_completed, current_step, last_updated)
        VALUES (${userId}::uuid, ${sessionId}, ${hasCompleted}, ${currentStep}, NOW())
        ON CONFLICT (user_id, session_id) 
        DO UPDATE SET 
          has_completed = EXCLUDED.has_completed,
          current_step = EXCLUDED.current_step,
          last_updated = NOW()
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save onboarding status:', error);
    return NextResponse.json(
      { error: 'Failed to save onboarding status' },
      { status: 500 }
    );
  }
}
