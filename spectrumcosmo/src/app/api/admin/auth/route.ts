import { NextRequest, NextResponse } from 'next/server'
import { signAdminToken } from '@/lib/auth'
import { getDb } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { authenticator } from 'otplib'

export async function POST(req: NextRequest) {
  try {
    const { username, password, twoFactorCode } = await req.json()
    const sql = getDb()
    
    const users = await sql`SELECT * FROM admins WHERE username = ${username}`
    if (users.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const user = users[0]
    const valid = await bcrypt.compare(password, user.password_hash)
    
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Check if 2FA is enabled for this admin
    // Note: Assuming admins table has 2FA columns or you're using users table
    // If admins table doesn't have 2FA columns, you'll need to add them or query users table
    const [admin] = await sql`
      SELECT id, email, two_factor_enabled, two_factor_secret 
      FROM admins WHERE id = ${user.id}
    `
    
    // If 2FA is enabled, verify the code
    if (admin?.two_factor_enabled === true) {
      if (!twoFactorCode) {
        return NextResponse.json({ 
          error: '2FA code required', 
          requiresTwoFactor: true 
        }, { status: 401 })
      }
      
      const isValid = authenticator.verify({
        token: twoFactorCode,
        secret: admin.two_factor_secret
      })
      
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid 2FA code' }, { status: 401 })
      }
    }
    
    // Proceed with login - 2FA passed or not enabled
    const token = signAdminToken({ 
      id: user.id, 
      username: user.username, 
      role: 'admin',
      twoFactorVerified: true 
    })
    
    const res = NextResponse.json({ 
      success: true,
      requiresTwoFactor: false
    })
    
    res.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    })
    
    return res
    
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.delete('admin_token')
  return res
}
