import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAdmin, getAdminFromRequest } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError

  try {
    const adminReq = getAdminFromRequest(req)
    if (!adminReq || !adminReq.username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await req.json()
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Both passwords are required' }, { status: 400 })
    }

    const sql = getDb()
    const users = await sql`SELECT * FROM admins WHERE username = ${adminReq.username}`
    if (users.length === 0) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    const user = users[0]
    const valid = await bcrypt.compare(currentPassword, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    }

    const newHash = await bcrypt.hash(newPassword, 10)
    await sql`UPDATE admins SET password_hash = ${newHash} WHERE id = ${user.id}`

    return NextResponse.json({ success: true, message: 'Password updated successfully' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
