// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb, queryOne, queryAsArray } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const sql = getDb();

    // 1. Find the reset token
    const reset = await queryOne<{ user_id: string; expires_at: Date }>`
      SELECT user_id, expires_at FROM password_reset_tokens
      WHERE token = ${token} AND expires_at > NOW()
    `;

    if (!reset) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // 2. Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);

    // 3. Update the password – use queryAsArray to get a real array
    const updatedUsers = await queryAsArray<{ id: string; email: string }>`
      UPDATE users 
      SET password_hash = ${hashed} 
      WHERE id = ${reset.user_id}
      RETURNING id, email
    `;

    if (updatedUsers.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 4. Delete the used token
    await sql`DELETE FROM password_reset_tokens WHERE user_id = ${reset.user_id}`;

    return NextResponse.json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (err) {
    console.error('Reset password error:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
