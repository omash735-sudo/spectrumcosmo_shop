// app/api/admin/promo-codes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';

function generateRandomCode(): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function generateBatchCodes(count: number, prefix: string = ''): string[] {
  const codes: string[] = [];
  const uniqueSet = new Set<string>();
  
  while (codes.length < count) {
    let code = generateRandomCode();
    if (prefix) {
      code = `${prefix}-${code}`;
    }
    if (!uniqueSet.has(code)) {
      uniqueSet.add(code);
      codes.push(code);
    }
  }
  
  return codes;
}

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const sql = getDb();
    const promoCodes = await sql`
      SELECT 
        pc.*,
        COUNT(pcu.id) as current_uses,
        COUNT(DISTINCT pcu.user_id) as unique_users
      FROM promo_codes pc
      LEFT JOIN promo_code_usage pcu ON pc.id = pcu.promo_code_id
      GROUP BY pc.id
      ORDER BY pc.created_at DESC
    `;
    
    return NextResponse.json({ success: true, data: promoCodes });
  } catch (err: any) {
    console.error('Failed to fetch promo codes:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { action, ...data } = body;
    
    const sql = getDb();
    
    // Auto-generate batch of codes
    if (action === 'generate_batch') {
      const { count, prefix, discountType, discountValue, minOrderAmount, maxUses, perUserLimit, excludedProductIds, expiresAt } = data;
      
      const batchCount = count || 10;
      const codes = generateBatchCodes(batchCount, prefix);
      
      const insertedCodes = [];
      for (const code of codes) {
        const [result] = await sql`
          INSERT INTO promo_codes (
            code, discount_type, discount_value, min_order_amount, 
            max_uses, per_user_limit, excluded_product_ids, expires_at
          )
          VALUES (${code}, ${discountType}, ${discountValue}, ${minOrderAmount || 0}, 
                  ${maxUses || null}, ${perUserLimit || 1}, ${excludedProductIds || '{}'}, ${expiresAt || null})
          RETURNING id, code
        `;
        insertedCodes.push(result);
      }
      
      return NextResponse.json({ success: true, data: insertedCodes });
    }
    
    // Create single promo code
    if (action === 'create') {
      const { code, discountType, discountValue, minOrderAmount, maxUses, perUserLimit, excludedProductIds, expiresAt } = data;
      
      if (!code || !discountType || discountValue === undefined) {
        return NextResponse.json({ error: 'Code, discount type, and discount value required' }, { status: 400 });
      }
      
      const [existing] = await sql`
        SELECT id FROM promo_codes WHERE code = ${code.toUpperCase()}
      `;
      
      if (existing) {
        return NextResponse.json({ error: 'Promo code already exists' }, { status: 409 });
      }
      
      const [result] = await sql`
        INSERT INTO promo_codes (
          code, discount_type, discount_value, min_order_amount, 
          max_uses, per_user_limit, excluded_product_ids, expires_at
        )
        VALUES (${code.toUpperCase()}, ${discountType}, ${discountValue}, ${minOrderAmount || 0}, 
                ${maxUses || null}, ${perUserLimit || 1}, ${excludedProductIds || '{}'}, ${expiresAt || null})
        RETURNING *
      `;
      
      return NextResponse.json({ success: true, data: result });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Failed to create promo codes:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { id, is_active } = await req.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Promo code ID required' }, { status: 400 });
    }
    
    const sql = getDb();
    const [result] = await sql`
      UPDATE promo_codes 
      SET is_active = ${is_active}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Failed to update promo code:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Promo code ID required' }, { status: 400 });
    }
    
    const sql = getDb();
    await sql`DELETE FROM promo_codes WHERE id = ${id}`;
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete promo code:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
