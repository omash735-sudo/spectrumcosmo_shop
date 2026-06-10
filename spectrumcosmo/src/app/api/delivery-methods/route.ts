import { NextResponse } from 'next/server';
import { getDb, queryAsArray } from '@/lib/db';

export async function GET() {
  try {
    const sql = getDb();
    const methods = await queryAsArray`
      SELECT 
        id, 
        name, 
        logo_url, 
        price, 
        type, 
        estimated_days,
        is_active
      FROM delivery_methods
      WHERE is_active = true
      ORDER BY sort_order ASC, price ASC
    `;

    const formatted = methods.map((method) => ({
      id: Number(method.id),
      name: method.name,
      logo_url: method.logo_url,
      price: Number(method.price),
      type: method.type || 'standard',
      estimated_days: method.estimated_days,
      is_active: method.is_active,
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error('Failed to fetch delivery methods:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
