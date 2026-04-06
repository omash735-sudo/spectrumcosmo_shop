import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { signCustomerToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    const sql = getDb()
    const result = await sql`SELECT * FROM customers WHERE email = ${email}`
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const user = result[0]
    const activeMatch = await bcrypt.compare(password, user.password_hash)

    if (!activeMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = signCustomerToken({ id: user.id, name: user.name, email: user.email, role: 'customer' })

    const res = NextResponse.json({ success: true })
    res.cookies.set({
      name: 'customer_token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    })

    return res
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
