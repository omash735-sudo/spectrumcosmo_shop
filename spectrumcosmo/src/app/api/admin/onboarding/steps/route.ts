import { NextRequest, NextResponse } from 'next/server';
import { queryMany, queryOne } from '@/lib/db';
import { INTELLIGENT_STEPS } from '@/lib/onboarding/intelligent-steps';

export async function GET() {
  try {
    const steps = await queryMany`
      SELECT 
        id,
        title,
        description,
        target,
        placement,
        is_active as "isActive",
        "order",
        device_type as "deviceType",
        condition,
        navigate_to as "navigateTo",
        scroll_to as "scrollTo",
        fallback_selector as "fallbackSelector",
        context_targets as "contextTargets"
      FROM onboarding_steps
      ORDER BY "order" ASC
    `;

    if (steps.length === 0) {
      return NextResponse.json({ steps: INTELLIGENT_STEPS });
    }

    return NextResponse.json({ steps });
  } catch (error) {
    console.error('Failed to fetch onboarding steps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch onboarding steps' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { steps } = body;

    if (!steps || !Array.isArray(steps)) {
      return NextResponse.json(
        { error: 'Steps array required' },
        { status: 400 }
      );
    }

    await queryOne`TRUNCATE onboarding_steps CASCADE`;

    for (const step of steps) {
      await queryOne`
        INSERT INTO onboarding_steps (
          id, 
          title, 
          description, 
          target, 
          placement, 
          is_active, 
          "order", 
          device_type,
          condition,
          navigate_to,
          scroll_to,
          fallback_selector,
          context_targets
        ) VALUES (
          ${step.id}, 
          ${step.title}, 
          ${step.description}, 
          ${step.target}, 
          ${step.placement}, 
          ${step.isActive}, 
          ${step.order}, 
          ${step.deviceType || 'both'},
          ${step.condition ? JSON.stringify(step.condition) : null},
          ${step.navigateTo || null},
          ${step.scrollTo || false},
          ${step.fallbackSelector || null},
          ${step.contextTargets ? JSON.stringify(step.contextTargets) : null}
        )
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update onboarding steps:', error);
    return NextResponse.json(
      { error: 'Failed to update onboarding steps' },
      { status: 500 }
    );
  }
}
