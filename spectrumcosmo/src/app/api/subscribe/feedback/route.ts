import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { email, reason, details } = await req.json()
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }
    const sql = getDb()
    await sql`
      INSERT INTO unsubscribe_feedback (email, reason, details, created_at)
      VALUES (${email}, ${reason || null}, ${details || null}, NOW())
    `
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Feedback error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
