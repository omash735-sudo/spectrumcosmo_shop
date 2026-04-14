import { getDb } from '@/lib/db'
import { transporter } from '@/lib/mailer'

export async function POST(req: Request) {
  const sql = getDb()
  const { id } = await req.json()

  const [newsletter] = await sql`
    SELECT * FROM newsletter WHERE id = ${id}
  `

  const subscribers = await sql`
    SELECT email FROM subscribers
  `

  for (const sub of subscribers) {

    const alreadySent = await sql`
      SELECT * FROM newsletter_logs
      WHERE newsletter_id = ${id} AND email = ${sub.email}
    `

    if (alreadySent.length > 0) continue

    await transporter.sendMail({
      from: `"SpectrumCosmo" <${process.env.EMAIL_USER}>`,
      to: sub.email,
      subject: newsletter.title,
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2>${newsletter.title}</h2>
          <p>${newsletter.content}</p>

          ${
            newsletter.image_url
              ? `<img src="${newsletter.image_url}" style="width:100%;max-width:400px;border-radius:10px;" />`
              : ''
          }

          ${
            newsletter.product_link
              ? `<p><a href="${newsletter.product_link}" style="color:#F97316;">Shop Now</a></p>`
              : ''
          }
        </div>
      `,
    })

    await sql`
      INSERT INTO newsletter_logs (newsletter_id, email)
      VALUES (${id}, ${sub.email})
    `
  }

  return Response.json({ success: true })
}
