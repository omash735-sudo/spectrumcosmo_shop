import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'spectrumcosmo-secret-key-2024'

export interface UserPayload {
  id: string
  name: string
  email: string
  role: 'customer'
}

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

