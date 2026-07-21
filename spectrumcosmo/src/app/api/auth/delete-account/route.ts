// app/api/auth/delete-account/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getVerifiedUser } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function DELETE(req: NextRequest) {
  // Authenticate using the standard user_token cookie
  const { user, error } = await getVerifiedUser(req)
  if (error) return error

  const sql = getDb()
  const userId = user.id

  // Generate an anonymous, unique placeholder email so the original email is freed
  const anonymousEmail = `deleted-${userId}@anonymous.spectrumcosmo.com`

  // 1. Soft‑delete the user and anonymize personal data
  await sql`
    UPDATE users
    SET
      deleted_at = NOW(),
      name = 'Deleted User',
      email = ${anonymousEmail},
      phone = NULL,
      password_hash = NULL,
      profile_image = NULL,
      updated_at = NOW()
    WHERE id = ${userId}
  `

  // 2. Anonymize all past orders associated with this user
  await sql`
    UPDATE orders
    SET
      customer_name = 'Deleted User',
      customer_email = ${anonymousEmail},
      phone_number = NULL
    WHERE user_id = ${userId}
  `

  // 3. Clean up verification tokens and subscriptions
  await sql`DELETE FROM email_verifications WHERE user_id = ${userId}`
  await sql`DELETE FROM newsletter_subscriptions WHERE user_id = ${userId}`
  await sql`DELETE FROM password_reset_tokens WHERE user_id = ${userId}`

  // Clear the auth cookie
  const response = NextResponse.json({ success: true, message: 'Account deleted' })
  response.cookies.set('user_token', '', { maxAge: 0, path: '/' })

  return response
}
