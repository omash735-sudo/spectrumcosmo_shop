import { NextResponse } from 'next/server'
import { getUserFromCookies } from '@/lib/auth'

export async function GET() {
  const user = await getUserFromCookies()
  if (!user) return NextResponse.json({ user: null })
  return NextResponse.json({ user: { name: user.name, email: user.email } })
}
