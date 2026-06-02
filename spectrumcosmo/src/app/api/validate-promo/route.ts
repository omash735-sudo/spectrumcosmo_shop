// app/api/validate-promo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/userAuth';

export async function POST(req: NextRequest) {
  try {
    const { code, cartTotal, productIds } = await req.json();
    const user = getUserFromRequest(req);
    
    if (!code) {
      return NextResponse.json({ error: 'Promo code required' }, { status: 400 });
    }
    
    const sql = getDb();
    
    const [promo] = await sql`
      SELECT * FROM promo_codes 
      WHERE code = ${code.toUpperCase()} 
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (start_date IS NULL OR start_date <= NOW())
    `;
    
    if (!promo) {
      return NextResponse.json({ error: 'Invalid or expired promo code' }, { status: 400 });
    }
    
    // Check max uses
    if (promo.max_uses && promo.uses_count >= promo.max_uses) {
      return NextResponse.json({ error: 'Promo code has reached maximum uses' }, { status: 400 });
    }
    
    // Check per-user limit
    if (user && promo.per_user_limit > 0) {
      const [userUsage] = await sql`
        SELECT COUNT(*) as count FROM promo_code_usage 
        WHERE promo_code_id = ${promo.id} AND user_id = ${user.id}
      `;
      
      if (userUsage.count >= promo.per_user_limit) {
        return NextResponse.json({ error: 'You have already used this promo code' }, { status: 400 });
      }
    }
    
    // Check excluded products
    if (promo.excluded_product_ids && promo.excluded_product_ids.length > 0) {
      const hasExcludedProduct = productIds?.some((id: string) => 
        promo.excluded_product_ids.includes(id)
      );
      
      if (hasExcludedProduct) {
        return NextResponse.json({ error: 'This promo code cannot be applied to items in your cart' }, { status: 400 });
      }
    }
    
    // Check minimum order amount
    if (cartTotal < promo.min_order_amount) {
      return NextResponse.json({ 
        error: `Minimum order amount of ${promo.min_order_amount} required`,
        requiredAmount: promo.min_order_amount,
        currentAmount: cartTotal
      }, { status: 400 });
    }
    
    // Calculate discount
    let discountAmount = 0;
    if (promo.discount_type === 'percentage') {
      discountAmount = (cartTotal * promo.discount_value) / 100;
    } else {
      discountAmount = promo.discount_value;
    }
    
    const finalTotal = Math.max(0, cartTotal - discountAmount);
    
    return NextResponse.json({
      valid: true,
      discountAmount,
      finalTotal,
      promoCode: {
        id: promo.id,
        code: promo.code,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
      }
    });
  } catch (err: any) {
    console.error('Promo validation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
