// app/api/admin/customers/[id]/resend-verification/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { sendVerificationEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authError = requireAdmin(req)
    if (authError) return authError

    const sql = getDb()
    const { id } = await params

    // Get user
    const [user] = await sql`
      SELECT id, name, email, email_verified
      FROM users 
      WHERE id = ${id} AND deleted_at IS NULL
    `

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if already verified
    if (user.email_verified) {
      return NextResponse.json({ 
        error: 'User is already verified' 
      }, { status: 400 })
    }

    // Generate new verification token
    const token = crypto.randomBytes(32).toString('hex')
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Check if email_verification_token column exists, if not add it
    try {
      // Update user with new token
      await sql`
        UPDATE users 
        SET 
          email_verification_token = ${token},
          email_verification_expiry = ${expiry.toISOString()},
          updated_at = NOW()
        WHERE id = ${id}
      `
    } catch (error) {
      // If columns don't exist, add them
      console.log('Adding missing verification columns...')
      await sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255) NULL,
        ADD COLUMN IF NOT EXISTS email_verification_expiry TIMESTAMP NULL
      `
      // Retry the update
      await sql`
        UPDATE users 
        SET 
          email_verification_token = ${token},
          email_verification_expiry = ${expiry.toISOString()},
          updated_at = NOW()
        WHERE id = ${id}
      `
    }

    // Send verification email using your existing function
    try {
      await sendVerificationEmail(user.email, user.name, token)
      
      return NextResponse.json({ 
        success: true, 
        message: 'Verification email sent successfully' 
      })
    } catch (error) {
      console.error('Failed to send verification email:', error)
      return NextResponse.json({ 
        error: 'Failed to send verification email. Please check email configuration.' 
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Error in resend verification:', error)
    return NextResponse.json(
      { error: 'Failed to resend verification email' },
      { status: 500 }
    )
  }
}
