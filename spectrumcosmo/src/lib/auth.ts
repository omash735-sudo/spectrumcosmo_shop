import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from './db'
import { AdminPayload, UserPayload } from './types'

const JWT_SECRET = process.env.JWT_SECRET || 'spectrumcosmo-secret-key-2024'

// ─── ADMIN AUTH ───────────────────────────────────────────
export function signAdminToken(payload: AdminPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
}

export function verifyToken(token: string): AdminPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminPayload
  } catch {
    return null
  }
}

export function getAdminFromRequest(req: NextRequest): AdminPayload | null {
  const token = req.cookies.get('admin_token')?.value
  if (!token) return null
  return verifyToken(token)
}

export function requireAdmin(req: NextRequest): NextResponse | null {
  const admin = getAdminFromRequest(req)
  if (!admin || admin.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

export async function getAdminFromCookies(): Promise<AdminPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token) return null
  return verifyToken(token)
}

// ─── CUSTOMER AUTH (with account status check) ───────────
export function signUserToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyUserToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload
  } catch {
    return null
  }
}

export function getUserFromRequest(req: NextRequest): UserPayload | null {
  const token = req.cookies.get('user_token')?.value
  if (!token) return null
  return verifyUserToken(token)
}

// Enhanced version that also checks account status
export async function getVerifiedUser(req: NextRequest): Promise<{ user: any; error: NextResponse | null }> {
  const payload = getUserFromRequest(req)
  if (!payload) {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const sql = getDb()
  const [user] = await sql`
    SELECT id, email, account_status, deleted_at
    FROM users
    WHERE id = ${payload.id}
  `
  if (!user) {
    return { user: null, error: NextResponse.json({ error: 'User not found' }, { status: 404 }) }
  }
  if (user.deleted_at) {
    return { user: null, error: NextResponse.json({ error: 'Account deleted' }, { status: 403 }) }
  }
  if (user.account_status === 'frozen') {
    return { user: null, error: NextResponse.json({ error: 'Account frozen. Contact support.' }, { status: 403 }) }
  }
  if (user.account_status === 'banned') {
    return { user: null, error: NextResponse.json({ error: 'Account banned. Contact support.' }, { status: 403 }) }
  }
  return { user, error: null }
}

export async function getUserFromCookies(): Promise<UserPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('user_token')?.value
  if (!token) return null
  return verifyUserToken(token)
}
