import { getDb } from '@/lib/db'
import { transporter } from '@/lib/mailer'

export async function POST(req: Request) {
  const sql = getDb()
  const { id } = await req.json()

  const [newsletter] = await sql`
    SELECT * FROM newsletter WHERE id = ${id}
  `

  let subscribers = []

  if (newsletter.audience === 'all') {
    subscribers = await sql`SELECT email FROM subscribers`
  }

  if (newsletter.audience === 'customers') {
    subscribers = await sql`
      SELECT DISTINCT customer_email as email FROM orders
    `
  }

  for (const sub of subscribers) {
    const alreadySent = await sql`
      SELECT * FROM newsletter_logs
      WHERE newsletter_id = ${id} AND email = ${sub.email}
    `

    if (alreadySent.length) continue

    await transporter.sendMail({
      from: `"SpectrumCosmo" <${process.env.EMAIL_USER}>`,
      to: sub.email,
      subject: newsletter.title,
      html: `
        <div>
          <h2>${newsletter.title}</h2>
          <p>${newsletter.content}</p>
        </div>
      `,
    })

    await sql`
      INSERT INTO newsletter_logs (newsletter_id, email)
      VALUES (${id}, ${sub.email})
    `
  }

  await sql`
    UPDATE newsletter
    SET status = 'sent'
    WHERE id = ${id}
  `

  return Response.json({ success: true })
}
