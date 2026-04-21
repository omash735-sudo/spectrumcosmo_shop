import { getDb } from '@/lib/db'
import { sendNewsletter } from '@/lib/newsletter/send'

export async function POST(req: Request) {
  try {
    const sql = getDb()

    const {
      title,
      content,
      image_url,
      audience = 'all',
      status = 'draft',
      auto_send = false,
    } = await req.json()

    if (!title || !content) {
      return Response.json(
        { error: 'Title and content required' },
        { status: 400 }
      )
    }

    const result = await sql`
      INSERT INTO newsletter (
        title,
        content,
        image_url,
        audience,
        status,
        auto_send,
        created_at
      )
      VALUES (
        ${title},
        ${content},
        ${image_url || null},
        ${audience},
        ${status},
        ${auto_send},
        NOW()
      )
      RETURNING *
    `

    const newsletter = result[0]

    if (auto_send && status === 'sent') {
      await sendNewsletter(newsletter.id)
    }

    return Response.json({
      success: true,
      newsletter,
    })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed' }, { status: 500 })
  }
}
