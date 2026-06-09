import { NextResponse } from 'next/server';
import { getDb, queryAsArray } from '@/lib/db';

export async function GET() {
  try {
    const sql = getDb();
    const areas = await queryAsArray<{
      id: number;
      area_name: string;
      city: string;
      delivery_fee: number;
      estimated_days: string;
      is_active: boolean;
    }>`
      SELECT id, area_name, city, delivery_fee, estimated_days, is_active
      FROM delivery_areas
      WHERE is_active = true
      ORDER BY city ASC, area_name ASC
    `;

    return NextResponse.json(areas);
  } catch (err) {
    console.error('Failed to fetch delivery areas:', err);
    return NextResponse.json({ error: 'Failed to fetch delivery areas' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  // Admin only - will implement in admin route
  return NextResponse.json({ error: 'Use admin endpoint' }, { status: 403 });
}
