// app/api/admin/payment-verifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// Types
interface VerificationRecord {
  id: number;
  order_id: string;
  proof_image_url: string;
  transaction_reference: string;
  notes: string;
  submitted_at: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  customer_name: string;
  phone_number: string;
  total_amount: number | string;
}

interface SanitizedVerification extends Omit<VerificationRecord, 'total_amount'> {
  total_amount: number;
}

interface ReferralRecord {
  referrer_user_id: string | null;
}

interface ReferrerReward {
  total_referrals: number;
  eligible_reward: boolean;
}

// Helper function to sanitize total_amount
function sanitizeTotalAmount(amount: number | string | null | undefined): number {
  if (typeof amount === 'number') return amount;
  if (typeof amount === 'string') {
    const cleaned = amount.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

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
    ` as VerificationRecord[];
    
    // Sanitize total_amount to proper number
    const sanitizedVerifications: SanitizedVerification[] = verifications.map((verification: VerificationRecord) => ({
      ...verification,
      total_amount: sanitizeTotalAmount(verification.total_amount),
    }));
    
    return NextResponse.json(sanitizedVerifications);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    console.error('Verifications fetch error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
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
      // Start a transaction for approve action
      await sql`BEGIN`;
      
      try {
        // Update payment confirmation
        await sql`
          UPDATE payment_confirmations
          SET status = 'approved', reviewed_at = NOW()
          WHERE id = ${verificationId}
        `;

        // Update order
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
        ` as ReferralRecord[];

        if (referral?.referrer_user_id) {
          await sql`
            UPDATE user_referrals 
            SET total_referrals = total_referrals + 1
            WHERE user_id = ${referral.referrer_user_id}
          `;
          
          const [referrer] = await sql`
            SELECT total_referrals, eligible_reward FROM user_referrals 
            WHERE user_id = ${referral.referrer_user_id}
          ` as ReferrerReward[];
          
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
        
        await sql`COMMIT`;
        return NextResponse.json({ success: true, message: 'Payment approved. Referral credited.' });
      } catch (err) {
        await sql`ROLLBACK`;
        throw err;
      }
    } 
    else if (action === 'reject') {
      if (!rejectionReason || rejectionReason.trim() === '') {
        return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
      }
      
      await sql`
        UPDATE payment_confirmations
        SET status = 'rejected', rejection_reason = ${rejectionReason}, reviewed_at = NOW()
        WHERE id = ${verificationId}
      `;
      return NextResponse.json({ success: true, message: 'Payment rejected.' });
    }
    else {
      return NextResponse.json({ error: 'Invalid action. Must be "approve" or "reject"' }, { status: 400 });
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    console.error('Payment verification error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
