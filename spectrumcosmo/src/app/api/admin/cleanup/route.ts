import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function POST(req: NextRequest) {
  // Allow both admin cookie and cron secret
  const authError = requireAdmin(req)
  if (authError) {
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return authError
    }
  }

  const sql = getDb()
  const [retention] = await sql`SELECT value FROM site_settings WHERE key = 'data_retention_days'`
  const retentionDays = parseInt(retention?.value || '2555')
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

  // Delete soft-deleted users older than cutoff
  const result = await sql`
    DELETE FROM users
    WHERE deleted_at IS NOT NULL AND deleted_at < ${cutoffDate}
    RETURNING id
  `
  const deletedCount = result.length

  // Also delete orphaned orders without user_id older than cutoff
  await sql`
    DELETE FROM orders
    WHERE user_id IS NULL AND created_at < ${cutoffDate}
  `

  return NextResponse.json({ message: `Permanently deleted ${deletedCount} users` })
}
