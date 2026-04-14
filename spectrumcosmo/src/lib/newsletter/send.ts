import { getDb } from '@/lib/db'
import { transporter } from '@/lib/mailer'

export async function sendNewsletter(id: number) {
  const sql = getDb()

  const [newsletter] = await sql`
    SELECT * FROM newsletter WHERE id = ${id}
  `

  let recipients: { email: string }[] = []

  if (newsletter.audience === 'all') {
    recipients = await sql`SELECT email FROM subscribers`
  }

  if (newsletter.audience === 'customers') {
    recipients = await sql`
      SELECT DISTINCT customer_email as email
      FROM orders
      WHERE customer_email IS NOT NULL
    `
  }

  for (const user of recipients) {
    if (!user.email) continue

    await transporter.sendMail({
      from: `"SpectrumCosmo" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: newsletter.title,
      html: `
        <div>
          <h2>${newsletter.title}</h2>
          ${newsletter.image_url ? `<img src="${newsletter.image_url}" style="width:100%;border-radius:10px;" />` : ''}
          <p>${newsletter.content}</p>
        </div>
      `,
    })
  }

  await sql`
    UPDATE newsletter
    SET status = 'sent'
    WHERE id = ${id}
  `
}
