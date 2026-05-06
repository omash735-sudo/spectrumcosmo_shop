import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Delete related data (orders, ratings, etc.)
  await prisma.$transaction([
    prisma.rating.deleteMany({ where: { userId: user.id } }),
    prisma.order.deleteMany({ where: { userId: user.id } }),
    prisma.user.delete({ where: { id: user.id } })
  ])

  return NextResponse.json({ success: true })
}
