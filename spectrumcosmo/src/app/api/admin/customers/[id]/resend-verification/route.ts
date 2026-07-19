// app/api/admin/customers/[id]/resend-verification/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getDb } from '@/lib/db'
import crypto from 'crypto'

// You'll need to implement this - I'll show the structure
async function sendVerificationEmail(email: string, name: string, token: string) {
  // Your email sending logic here
  // This should match what your registration uses
  console.log(`Sending verification email to ${email} with token ${token}`)
  // Example: await sendEmail({ to: email, subject: 'Verify your email', html: `Click here: /verify?token=${token}` })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  // Update user with new token
  await sql`
    UPDATE users 
    SET 
      email_verification_token = ${token},
      email_verification_expiry = ${expiry.toISOString()},
      updated_at = NOW()
    WHERE id = ${id}
  `

  // Send verification email
  try {
    await sendVerificationEmail(user.email, user.name, token)

    return NextResponse.json({ 
      success: true, 
      message: 'Verification email sent successfully' 
    })
  } catch (error) {
    console.error('Failed to send verification email:', error)
    return NextResponse.json({ 
      error: 'Failed to send verification email' 
    }, { status: 500 })
  }
}
