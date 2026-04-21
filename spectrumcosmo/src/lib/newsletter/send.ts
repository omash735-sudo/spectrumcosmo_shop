import { getDb } from '@/lib/db'
import { transporter } from '@/lib/mailer'

export async function sendNewsletter(id: number) {
  const sql = getDb()

  const result = await sql`
    SELECT * FROM newsletter WHERE id = ${id}
  `

  const newsletter = result[0]

  if (!newsletter) {
    throw new Error('Newsletter not found')
  }

  const recipients = await sql`
    SELECT email FROM subscribers
  `

  if (!recipients.length) return

  for (const user of recipients) {
    try {
      await transporter.sendMail({
        from: `"SpectrumCosmo" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: newsletter.title,
        html: `
          <div style="font-family:Arial;max-width:600px;margin:auto">
            ${newsletter.image_url ? `<img src="${newsletter.image_url}" style="width:100%;border-radius:10px;margin-bottom:20px"/>` : ''}

            <h2>${newsletter.title}</h2>

            <p style="line-height:1.6;color:#444">
              ${newsletter.content}
            </p>

            <hr style="margin:30px 0"/>

            <p style="font-size:12px;color:#888">
              SpectrumCosmo updates
            </p>
          </div>
        `,
      })
    } catch (err) {
      console.error(`Failed: ${user.email}`, err)
    }
  }
}
