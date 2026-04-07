import { NextRequest, NextResponse } from 'next/server'
import { signAdminToken } from '@/lib/auth'

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'spectrumcosmo2024'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
    }

    const token = signAdminToken({
      id: 'admin',
      username: ADMIN_USERNAME,
      role: 'admin'
    })

    const response = NextResponse.json({ message: 'Login successful' })
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24
    })
    return response

  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ message: 'Logged out' })
  response.cookies.delete('admin_token')
  return response
}
