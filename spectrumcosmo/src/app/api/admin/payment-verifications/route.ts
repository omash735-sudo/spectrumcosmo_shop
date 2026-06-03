// app/api/admin/payment-verifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const sql = getDb();
    const verifications = await sql`
      SELECT 
        pc.id,
        pc.order_id,
        pc.proof_image_url,
        pc.transaction_reference,
        pc.notes,
        pc.submitted_at,
        pc.status,
        pc.rejection_reason,
        o.customer_name,
        o.phone_number,
        o.total_amount
      FROM payment_confirmations pc
      JOIN orders o ON o.id = pc.order_id
      ORDER BY pc.submitted_at DESC
    `;
    
    // Sanitize total_amount to proper number
    const sanitizedVerifications = verifications.map(v => {
      let totalAmount = 0;
      if (typeof v.total_amount === 'number') {
        totalAmount = v.total_amount;
      } else if (typeof v.total_amount === 'string') {
        const cleaned = v.total_amount.replace(/[^0-9.-]/g, '');
        const num = parseFloat(cleaned);
        totalAmount = isNaN(num) ? 0 : num;
      } else {
        totalAmount = 0;
      }
      
      return {
        ...v,
        total_amount: totalAmount
      };
    });
    
    return NextResponse.json(sanitizedVerifications);
  } catch (err: any) {
    console.error('Verifications fetch error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { verificationId, orderId, action, rejectionReason } = await req.json();
    
    if (!verificationId || !orderId || !action) {
      return NextResponse.json({ error: 'verificationId, orderId, and action required' }, { status: 400 });
    }

    const sql = getDb();

    if (action === 'approve') {
      await sql`
        UPDATE payment_confirmations
        SET status = 'approved', reviewed_at = NOW()
        WHERE id = ${verificationId}
      `;

      await sql`
        UPDATE orders
        SET payment_status = 'paid', status = 'processing', updated_at = NOW()
        WHERE id = ${orderId}
      `;

      // Referral completion
      const [referral] = await sql`
        UPDATE referral_tracking 
        SET status = 'completed', completed_at = NOW()
        WHERE order_id = ${orderId} AND status = 'pending'
        RETURNING referrer_user_id
      `;

      if (referral && referral.referrer_user_id) {
        await sql`
          UPDATE user_referrals 
          SET total_referrals = total_referrals + 1
          WHERE user_id = ${referral.referrer_user_id}
        `;
        
        const [referrer] = await sql`
          SELECT total_referrals, eligible_reward FROM user_referrals 
          WHERE user_id = ${referral.referrer_user_id}
        `;
        
        if (referrer) {
          const rewardThresholds = [5, 10, 20];
          const reachedThreshold = rewardThresholds.includes(referrer.total_referrals);
          
          if (reachedThreshold && !referrer.eligible_reward) {
            await sql`
              UPDATE user_referrals 
              SET eligible_reward = true
              WHERE user_id = ${referral.referrer_user_id}
            `;
          }
        }
      }

      return NextResponse.json({ success: true, message: 'Payment approved. Referral credited.' });
    } 
    else if (action === 'reject') {
      await sql`
        UPDATE payment_confirmations
        SET status = 'rejected', rejection_reason = ${rejectionReason || null}, reviewed_at = NOW()
        WHERE id = ${verificationId}
      `;
      return NextResponse.json({ success: true, message: 'Payment rejected.' });
    }
    else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('Payment verification error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
