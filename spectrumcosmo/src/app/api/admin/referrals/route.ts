// app/api/admin/referrals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { sendReferralRewardEmail } from '@/lib/email/promoCodes';

// Reward tiers: 5 referrals = 5%, 10 = 10%, 20 = 20%
function getRewardDiscount(totalReferrals: number): number {
  if (totalReferrals >= 20) return 20;
  if (totalReferrals >= 10) return 10;
  if (totalReferrals >= 5) return 5;
  return 0;
}

function generateRewardCode(userId: string, discount: number): string {
  const shortId = userId.substring(0, 6);
  return `REWARD${discount}-${shortId}`;
}

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const sql = getDb();
    
    const eligibleUsers = await sql`
      SELECT 
        ur.user_id,
        u.name,
        u.email,
        ur.total_referrals,
        ur.eligible_reward,
        ur.reward_approved,
        ur.reward_code_id,
        pc.code as reward_code
      FROM user_referrals ur
      JOIN users u ON ur.user_id = u.id
      LEFT JOIN promo_codes pc ON ur.reward_code_id = pc.id
      WHERE ur.eligible_reward = true
      ORDER BY ur.total_referrals DESC
    `;
    
    return NextResponse.json({ success: true, data: eligibleUsers });
  } catch (err: any) {
    console.error('Failed to fetch eligible users:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { userId, action } = await req.json();
    
    if (!userId || !action) {
      return NextResponse.json({ error: 'User ID and action required' }, { status: 400 });
    }
    
    const sql = getDb();
    
    if (action === 'approve_reward') {
      const [referrer] = await sql`
        SELECT total_referrals, eligible_reward, reward_approved 
        FROM user_referrals WHERE user_id = ${userId}
      `;
      
      if (!referrer) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      if (!referrer.eligible_reward) {
        return NextResponse.json({ error: 'User not eligible for reward' }, { status: 400 });
      }
      
      if (referrer.reward_approved) {
        return NextResponse.json({ error: 'Reward already approved' }, { status: 400 });
      }
      
      const discount = getRewardDiscount(referrer.total_referrals);
      const rewardCode = generateRewardCode(userId, discount);
      
      // Create promo code for reward
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 3);
      
      const [promoCode] = await sql`
        INSERT INTO promo_codes (code, discount_type, discount_value, min_order_amount, expires_at)
        VALUES (${rewardCode}, 'percentage', ${discount}, 0, ${expiresAt})
        RETURNING id
      `;
      
      // Update user referral record
      await sql`
        UPDATE user_referrals 
        SET reward_approved = true, reward_code_id = ${promoCode.id}
        WHERE user_id = ${userId}
      `;
      
      // Get user email
      const [user] = await sql`
        SELECT email FROM users WHERE id = ${userId}
      `;
      
      // Send email notification
      await sendReferralRewardEmail(user.email, rewardCode, discount);
      
      return NextResponse.json({ 
        success: true, 
        message: `Reward approved: ${discount}% off code ${rewardCode}` 
      });
    }
    
    if (action === 'reject_reward') {
      await sql`
        UPDATE user_referrals 
        SET eligible_reward = false
        WHERE user_id = ${userId}
      `;
      
      return NextResponse.json({ success: true, message: 'Reward rejected' });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Failed to process referral reward:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
