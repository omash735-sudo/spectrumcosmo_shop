import { NextRequest, NextResponse } from 'next/server';
import { queryMany, queryOne } from '@/lib/db';
import { DEFAULT_STEPS } from '@/lib/onboarding/steps';

// Get all steps
export async function GET() {
  try {
    // Try to get from database first
    const steps = await queryMany`
      SELECT 
        id,
        title,
        description,
        target,
        placement,
        is_active as "isActive",
        "order",
        device_type as "deviceType"
      FROM onboarding_steps
      ORDER BY "order" ASC
    `;

    if (steps.length === 0) {
      // Return defaults if no steps in DB
      return NextResponse.json({ steps: DEFAULT_STEPS });
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

// Update steps (admin only)
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

    // Clear existing steps
    await queryOne`TRUNCATE onboarding_steps CASCADE`;

    // Insert new steps
    for (const step of steps) {
      await queryOne`
        INSERT INTO onboarding_steps (
          id, title, description, target, placement, is_active, "order", device_type
        ) VALUES (
          ${step.id}, ${step.title}, ${step.description}, ${step.target}, 
          ${step
