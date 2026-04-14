import { getDb } from '@/lib/db'
import { transporter } from '@/lib/mailer'

export async function POST(req: Request) {
  try {
    const sql = getDb()
    const { id } = await req.json()

    const [newsletter] = await sql`
      SELECT * FROM newsletter WHERE id = ${id}
    `

    if (!newsletter) {
      return Response.json(
        { error: 'Newsletter not found' },
        { status: 404 }
      )
    }

    let recipients: { email: string }[] = []

    if (newsletter.audience === 'all') {
      recipients = await sql`
        SELECT email FROM subscribers
      `
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

      // Send email
      await transporter.sendMail({
        from: `"SpectrumCosmo" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: newsletter.title,
        html: `
          <div style="font-family: Arial;">
            <h2>${newsletter.title}</h2>
            ${newsletter.image_url ? `<img src="${newsletter.image_url}" style="max-width:100%;border-radius:10px;" />` : ''}
            <p>${newsletter.content}</p>
          </div>
        `,
      })
    }

    // Mark as sent
    await sql`
      UPDATE newsletter
      SET status = 'sent'
      WHERE id = ${id}
    `

    return Response.json({ success: true })
  } catch (err) {
    console.error('Newsletter send error:', err)

    return Response.json(
      { error: 'Failed to send newsletter' },
      { status: 500 }
    )
  }
}
