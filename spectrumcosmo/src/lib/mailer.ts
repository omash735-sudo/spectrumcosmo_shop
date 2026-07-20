import nodemailer from 'nodemailer'

type MailInput = {
  to: string
  subject: string
  text: string
  html?: string
}

type MailResult = {
  sent: boolean
  reason?: string
}

function getTransporter() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) return null

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

export async function sendMail(input: MailInput): Promise<MailResult> {
  try {
    const transporter = getTransporter()
    if (!transporter) {
      console.error('sendMail failed: SMTP not configured')
      return { sent: false, reason: 'SMTP not configured' }
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    })

    return { sent: true }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('sendMail failed:', errorMessage)
    return { sent: false, reason: errorMessage }
  }
}
