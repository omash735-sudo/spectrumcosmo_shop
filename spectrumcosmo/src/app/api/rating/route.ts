import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { stars, comment } = await req.json()
  if (!stars || stars < 1 || stars > 5) {
    return NextResponse.json({ error: 'Invalid rating' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  await prisma.rating.create({
    data: {
      userId: user.id,
      stars,
      comment: comment || null
    }
  })

  return NextResponse.json({ success: true })
}

export async function GET() {
  // For admin view - add role check in production
  const ratings = await prisma.rating.findMany({
    include: { user: { select: { email: true, name: true } } },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(ratings)
}
