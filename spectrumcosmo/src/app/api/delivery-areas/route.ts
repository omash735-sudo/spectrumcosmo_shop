import { NextResponse } from 'next/server';
import { getDb, queryAsArray } from '@/lib/db';

export async function GET() {
  try {
    const sql = getDb();
    const areas = await queryAsArray`
      SELECT 
        id, 
        area_name, 
        city, 
        base_fee, 
        express_multiplier,
        estimated_days_standard,
        estimated_days_express,
        is_active,
        sort_order
      FROM delivery_areas
      WHERE is_active = true
      ORDER BY sort_order ASC, city ASC, area_name ASC
    `;

    const formatted = areas.map((area) => ({
      id: area.id,
      area_name: area.area_name,
      city: area.city,
      base_fee: Number(area.base_fee),
      express_multiplier: Number(area.express_multiplier),
      estimated_days_standard: area.estimated_days_standard,
      estimated_days_express: area.estimated_days_express,
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error('Failed to fetch delivery areas:', err);
    return NextResponse.json({ error: 'Failed to fetch delivery areas' }, { status: 500 });
  }
}
