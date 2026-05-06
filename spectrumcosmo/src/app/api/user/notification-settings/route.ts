import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { orderUpdates, promotions } = await req.json()
  
  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      notificationPreferences: {
        orderUpdates,
        promotions
      }
    }
  })

  return NextResponse.json({ success: true })
}
