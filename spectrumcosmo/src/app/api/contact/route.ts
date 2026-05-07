import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { fullName, email, contactNumber, message } = await req.json();

    if (!fullName || !email || !contactNumber || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Configure your SMTP transporter (use environment variables)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Email to your business (admin)
    const adminMail = {
      from: `"Contact Form" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_EMAIL, // your business email, e.g., 'hello@spectrumcosmo.shop'
      subject: `New contact from ${fullName}`,
      html: `
        <h2>New Contact Message</h2>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${contactNumber}</p>
        <p><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>
      `,
    };

    // Optional: send a confirmation email to the user
    const userMail = {
      from: `"SpectrumCosmo" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'We received your message',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2>Thank you for contacting us, ${fullName}!</h2>
          <p>We have received your message and will get back to you within 24–48 hours.</p>
          <p>Here is a copy of your message:</p>
          <blockquote style="background:#f5f5f5; padding: 10px; border-left: 4px solid #F97316;">${message.replace(/\n/g, '<br/>')}</blockquote>
          <br/>
          <p>Best regards,<br/>SpectrumCosmo Team</p>
        </div>
      `,
    };

    // Send both emails concurrently
    await Promise.all([
      transporter.sendMail(adminMail),
      transporter.sendMail(userMail),
    ]);

    return NextResponse.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
