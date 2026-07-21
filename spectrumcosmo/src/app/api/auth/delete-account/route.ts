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

  // Delete all related records in correct order
  await sql`DELETE FROM email_verifications WHERE user_id = ${userId}`
  await sql`DELETE FROM newsletter_subscriptions WHERE user_id = ${userId}`
  await sql`DELETE FROM password_reset_tokens WHERE user_id = ${userId}`
  await sql`DELETE FROM checkout_attempts WHERE user_id = ${userId}`
  await sql`DELETE FROM security_alerts WHERE user_id = ${userId}`

  // Delete orders and order items
  await sql`DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = ${userId})`
  await sql`DELETE FROM orders WHERE user_id = ${userId}`

  // Finally, permanently delete the user
  await sql`DELETE FROM users WHERE id = ${userId}`

  // Clear the auth cookie
  const response = NextResponse.json({ success: true, message: 'Account permanently deleted' })
  response.cookies.set('user_token', '', { maxAge: 0, path: '/' })

  return response
}
