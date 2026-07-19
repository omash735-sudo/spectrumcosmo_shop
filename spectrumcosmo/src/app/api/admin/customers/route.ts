// app/api/admin/customers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const authError = requireAdmin(req)
    if (authError) return authError

    const sql = getDb()
    
    // First, check if email_verified column exists
    const columnCheck = await sql`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'email_verified'
      ) as exists
    `
    
    const hasEmailVerified = columnCheck[0]?.exists || false
    
    // If email_verified doesn't exist, add it
    if (!hasEmailVerified) {
      await sql`
        ALTER TABLE users 
        ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
        ADD COLUMN email_verified_at TIMESTAMP NULL
      `
    }

    // Now fetch customers with verification status
    const customers = await sql`
      SELECT
        u.id,
        u.name,
        u.email,
        u.phone,
        u.account_status,
        COALESCE(u.email_verified, FALSE) AS email_verified,
        u.email_verified_at,
        u.created_at,
        u.deleted_at,
        COUNT(o.id) AS total_orders,
        COALESCE(SUM(o.total_amount), 0) AS total_spent,
        MAX(o.created_at) AS last_order_date,
        CASE 
          WHEN COALESCE(u.email_verified, FALSE) = TRUE THEN 'verified'
          WHEN COALESCE(u.email_verified, FALSE) = FALSE THEN 'pending'
          ELSE 'unknown'
        END as verification_status
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      WHERE u.deleted_at IS NULL
      GROUP BY u.id, u.name, u.email, u.phone, u.account_status, u.email_verified, u.email_verified_at, u.created_at, u.deleted_at
      ORDER BY u.created_at DESC
    `
    
    return NextResponse.json(customers)
    
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}
