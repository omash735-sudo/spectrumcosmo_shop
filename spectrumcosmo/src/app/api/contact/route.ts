import nodemailer from 'nodemailer'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      type, // collaboration | support | influencer | business
      name,
      email,
      message,
      extra
    } = body

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    const subjectMap: Record<string, string> = {
      collaboration: 'New Collaboration Request',
      support: 'New Support Request',
      influencer: 'New Influencer Application',
      business: 'New Business Partnership Request'
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: subjectMap[type] || 'New Contact Form',
      text: `
TYPE: ${type}

NAME: ${name}
EMAIL: ${email}

MESSAGE:
${message}

EXTRA:
${JSON.stringify(extra, null, 2)}
      `
    })

    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ success: false, error: err })
  }
}
