import { getDb } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const sql = getDb()
    const { id } = await req.json()

    if (!id) {
      return Response.json({ error: 'ID required' }, { status: 400 })
    }

    const result = await sql`
      SELECT id, title, content, image_url, audience, status, created_at
      FROM newsletter
      WHERE id = ${id}
    `

    const newsletter = result[0]

    if (!newsletter) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    return Response.json({
      success: true,
      preview: newsletter,
    })
  } catch (err) {
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
