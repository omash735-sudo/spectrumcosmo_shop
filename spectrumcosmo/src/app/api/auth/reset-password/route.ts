import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';

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

    // Step 1: Find the reset token
    const [reset] = await sql`
      SELECT user_id, expires_at FROM password_reset_tokens
      WHERE token = ${token} AND expires_at > NOW()
    `;

    if (!reset) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Step 2: Get the user before update (for debugging)
    const [userBefore] = await sql`
      SELECT id, email, LEFT(password_hash, 20) as hash_prefix
      FROM users WHERE id = ${reset.user_id}
    `;

    if (!userBefore) {
      return NextResponse.json(
        { error: 'User not found for this reset token' },
        { status: 400 }
      );
    }

    // Step 3: Hash the new password
    const hashed = await bcrypt.hash(newPassword, 10);

    // Step 4: Update the password
    const updateResult = await sql`
      UPDATE users 
      SET password_hash = ${hashed} 
      WHERE id = ${reset.user_id}
      RETURNING id, email
    `;

    if (updateResult.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

    // Step 5: Delete the used token
    await sql`DELETE FROM password_reset_tokens WHERE user_id = ${reset.user_id}`;

    // Step 6: Verify the update worked by fetching the user again
    const [userAfter] = await sql`
      SELECT id, email, LEFT(password_hash, 20) as hash_prefix
      FROM users WHERE id = ${reset.user_id}
    `;

    // Return success with debug info
    return NextResponse.json({
      success: true,
      message: 'Password reset successful',
      debug: {
        userId: updateResult[0].id,
        userEmail: updateResult[0].email,
        oldHashPrefix: userBefore.hash_prefix,
        newHashPrefix: userAfter.hash_prefix,
        hashChanged: userBefore.hash_prefix !== userAfter.hash_prefix
      }
    });
  } catch (err: any) {
    console.error('Reset password error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
