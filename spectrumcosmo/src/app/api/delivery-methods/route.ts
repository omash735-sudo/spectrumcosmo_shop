import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const sql = getDb();
  const methods = await sql`
    SELECT id, name, logo_url, price, is_active
    FROM delivery_methods
    WHERE is_active = true
    ORDER BY price ASC
  `;

  // Convert price to number (PostgreSQL often returns decimal as string)
  const formatted = methods.map((m: any) => ({
    ...m,
    price: Number(m.price),
  }));

  return NextResponse.json(formatted);
}
