import { NextResponse } from 'next/server'
import { getCustomerFromCookies } from '@/lib/auth'

export async function GET() {
  const user = await getCustomerFromCookies()
  if (!user) {
    return NextResponse.json({ user: null })
  }
  return NextResponse.json({ user })
}
