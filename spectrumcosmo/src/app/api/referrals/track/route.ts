// app/api/referrals/track/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { referralCode, referredUserId, orderId, ipAddress } = await req.json();
    
    if (!referralCode || !referredUserId) {
      return NextResponse.json({ error: 'Referral code and referred user ID required' }, { status: 400 });
    }
    
    const sql = getDb();
    
    // Get referrer
    const [referrer] = await sql`
      SELECT user_id FROM user_referrals WHERE referral_code = ${referralCode}
    `;
    
    if (!referrer) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    }
    
    // Prevent self-referral
    if (referrer.user_id === referredUserId) {
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 });
    }
    
    // Check if already referred by someone else
    const [existingReferral] = await sql`
      SELECT id FROM referral_tracking 
      WHERE referred_user_id = ${referredUserId}
    `;
    
    if (existingReferral) {
      return NextResponse.json({ error: 'User already referred by someone else' }, { status: 400 });
    }
    
    // Create referral tracking record
    const [tracking] = await sql`
      INSERT INTO referral_tracking (referrer_user_id, referred_user_id, order_id, status, ip_address)
      VALUES (${referrer.user_id}, ${referredUserId}, ${orderId || null}, ${orderId ? 'pending' : 'pending'}, ${ipAddress || null})
      RETURNING id
    `;
    
    return NextResponse.json({ success: true, trackingId: tracking.id });
  } catch (err: any) {
    console.error('Failed to track referral:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { orderId, status } = await req.json();
    
    if (!orderId || !status) {
      return NextResponse.json({ error: 'Order ID and status required' }, { status: 400 });
    }
    
    const sql = getDb();
    
    // Update referral status when order is completed/cancelled
    const [tracking] = await sql`
      UPDATE referral_tracking 
      SET status = ${status}, completed_at = ${status === 'completed' ? 'NOW()' : null}
      WHERE order_id = ${orderId}
      RETURNING referrer_user_id
    `;
    
    if (tracking && status === 'completed') {
      // Update referral count for referrer
      await sql`
        UPDATE user_referrals 
        SET total_referrals = total_referrals + 1
        WHERE user_id = ${tracking.referrer_user_id}
      `;
      
      // Check if user reached reward threshold (5, 10, 20)
      const [referrer] = await sql`
        SELECT total_referrals, eligible_reward FROM user_referrals 
        WHERE user_id = ${tracking.referrer_user_id}
      `;
      
      const rewardThresholds = [5, 10, 20];
      const reachedThreshold = rewardThresholds.includes(referrer.total_referrals);
      
      if (reachedThreshold && !referrer.eligible_reward) {
        await sql`
          UPDATE user_referrals 
          SET eligible_reward = true
          WHERE user_id = ${tracking.referrer_user_id}
        `;
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to update referral status:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
