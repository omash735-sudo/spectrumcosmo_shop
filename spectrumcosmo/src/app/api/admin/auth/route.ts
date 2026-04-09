import { NextRequest, NextResponse } from 'next/server'
import { signToken } from '@/lib/auth'

import { getDb } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    const sql = getDb()
    
    const users = await sql`SELECT * FROM admins WHERE username = ${username}`
    if (users.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const user = users[0]
    const valid = await bcrypt.compare(password, user.password_hash)
    
    if (valid) {
      const token = signToken({ id: user.id, username: user.username, role: 'admin' })
      const res = NextResponse.json({ success: true })
      res.cookies.set('admin_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/',
      })
      return res
    }
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.delete('admin_token')
  return res
}
