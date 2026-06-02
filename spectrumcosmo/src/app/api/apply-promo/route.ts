// app/api/apply-promo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/userAuth';

export async function POST(req: NextRequest) {
  try {
    const { orderId, promoCodeId, discountAmount } = await req.json();
    const user = getUserFromRequest(req);
    
    if (!orderId || !promoCodeId) {
      return NextResponse.json({ error: 'Order ID and promo code ID required' }, { status: 400 });
    }
    
    const sql = getDb();
    
    // Update promo code usage count
    await sql`
      UPDATE promo_codes 
      SET uses_count = uses_count + 1
      WHERE id = ${promoCodeId}
    `;
    
    // Record usage
    await sql`
      INSERT INTO promo_code_usage (promo_code_id, order_id, user_id, discount_amount)
      VALUES (${promoCodeId}, ${orderId}, ${user?.id || null}, ${discountAmount})
    `;
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to apply promo code:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
