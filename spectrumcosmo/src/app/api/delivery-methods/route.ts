// app/api/delivery-methods/route.ts
import { NextResponse } from 'next/server';
import { getDb, queryAsArray } from '@/lib/db';

interface DeliveryMethod {
  id: string;
  name: string;
  logo_url: string | null;
  price: number | string;
  is_active: boolean;
}

export async function GET() {
  try {
    const sql = getDb();
    const methods = await queryAsArray<DeliveryMethod>`
      SELECT id, name, logo_url, price, is_active
      FROM delivery_methods
      WHERE is_active = true
      ORDER BY price ASC
    `;

    const formatted = methods.map((method) => ({
      ...method,
      price: Number(method.price),
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error('Failed to fetch delivery methods:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
