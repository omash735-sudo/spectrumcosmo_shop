// app/api/referrals/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

function generateReferralCode(userId: string, name: string): string {
  const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
  const shortId = userId.substring(0, 6);
  return `${prefix || 'USER'}${shortId}`;
}

export async function POST(req: NextRequest) {
  try {
    const { userId, name } = await req.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    
    const sql = getDb();
    
    const [existing] = await sql`
      SELECT id FROM user_referrals WHERE user_id = ${userId}
    `;
    
    if (existing) {
      return NextResponse.json({ success: true, exists: true });
    }
    
    const referralCode = generateReferralCode(userId, name || 'USER');
    
    await sql`
      INSERT INTO user_referrals (user_id, referral_code)
      VALUES (${userId}, ${referralCode})
    `;
    
    return NextResponse.json({ success: true, referralCode });
  } catch (err: any) {
    console.error('Failed to create referral code:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
