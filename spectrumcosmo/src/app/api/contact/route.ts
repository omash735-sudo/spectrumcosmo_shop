import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    let body;
    
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = await req.json();
    } else {
      const formData = await req.formData();
      body = {
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        contactNumber: formData.get('contactNumber'),
        subject: formData.get('subject'),
        message: formData.get('message'),
      };
    }

    const { fullName, email, contactNumber, subject, message } = body;

    if (!fullName || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('SMTP not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const adminMail = {
      from: `"Contact Form" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_EMAIL || 'spectrumcosmo01@gmail.com',
      subject: subject ? `New contact: ${subject}` : `New contact from ${fullName}`,
      html: `
        <h2>New Contact Message</h2>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${contactNumber || 'Not provided'}</p>
        ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
        <p><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>
      `,
    };

    const userMail = {
      from: `"SpectrumCosmo" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'We received your message',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #C96712;">Thank you for contacting us, ${fullName}!</h2>
          <p>We have received your message and will get back to you within 24–48 hours.</p>
          <p>Here is a copy of your message:</p>
          <blockquote style="background:#1B1B1B; padding: 10px; border-left: 4px solid #C96712; color: #F5F5F5;">
            ${message.replace(/\n/g, '<br/>')}
          </blockquote>
          <br/>
          <p>Best regards,<br/>SpectrumCosmo Team</p>
        </div>
      `,
    };

    await Promise.all([
      transporter.sendMail(adminMail),
      transporter.sendMail(userMail),
    ]);

    return NextResponse.json({ 
      success: true, 
      message: 'Message sent successfully' 
    });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
