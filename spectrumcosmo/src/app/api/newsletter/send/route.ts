import { getDb } from '@/lib/db'
import { sendNewsletter } from '@/lib/newsletter/send'

export async function POST(req: Request) {
  const sql = getDb()

  const {
    title,
    content,
    image_url,
    audience = 'all',
    status = 'draft',
    auto_send = false,
  } = await req.json()

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
      ${image_url},
      ${audience},
      ${status},
      ${auto_send},
      NOW()
    )
    RETURNING *
  `

  const newsletter = result[0]

  // AUTO SEND TRIGGER
  if (auto_send && image_url) {
    await sendNewsletter(newsletter.id)
  }

  return Response.json(newsletter)
}
