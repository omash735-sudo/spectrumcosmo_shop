// app/api/requests/categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const categories = await sql`
      SELECT 
        c.id, 
        c.name, 
        COUNT(r.id) as request_count
      FROM categories c
      LEFT JOIN product_requests r ON r.category_id = c.id AND r.status = 'approved'
      WHERE c.is_active = true
      GROUP BY c.id
      ORDER BY c.sort_order ASC
    `;
    return NextResponse.json({ success: true, data: categories });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, data: [] }, { status: 500 });
  }
}
