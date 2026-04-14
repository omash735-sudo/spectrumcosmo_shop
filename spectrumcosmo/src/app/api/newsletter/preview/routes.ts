import { getDb } from '@/lib/db'

export async function POST(req: Request) {
  const sql = getDb()
  const { id } = await req.json()

  const [newsletter] = await sql`
    SELECT * FROM newsletter WHERE id = ${id}
  `

  return Response.json(newsletter)
}
