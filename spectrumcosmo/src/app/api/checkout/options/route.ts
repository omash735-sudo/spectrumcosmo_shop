import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const sql = getDb();
  
  const [payments, deliveries] = await Promise.all([
    sql`
      SELECT * FROM payment_options 
      WHERE is_active = true 
      ORDER BY type, sort_order
    `,
    sql`
      SELECT 
        id, 
        name, 
        logo_url, 
        price, 
        is_active, 
        sort_order,
        confirmation_days,
        auto_archive
      FROM delivery_methods 
      WHERE is_active = true 
      ORDER BY sort_order ASC, price ASC
    `,
  ]);
  
  return NextResponse.json({ 
    payments, 
    deliveries,
    // Include default confirmation days for frontend use
    defaultConfirmationDays: 3
  });
}
