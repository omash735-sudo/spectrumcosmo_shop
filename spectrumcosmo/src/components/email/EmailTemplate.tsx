interface EmailTemplateProps {
  title: string;
  greeting: string;
  children: React.ReactNode;
  buttonText?: string;
  buttonUrl?: string;
  discountBanner?: string;
  footerNote?: string;
}

export function EmailTemplate({
  title,
  greeting,
  children,
  buttonText,
  buttonUrl,
  discountBanner = "Get 25% off your next order with code: WELCOME25",
  footerNote = "If you didn't create an account using this email address, please ignore this email or unsubscribe.",
}: EmailTemplateProps) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f5f5f5;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .header {
          background: linear-gradient(135deg, #F97316 0%, #ea6c0f 100%);
          padding: 32px 24px;
          text-align: center;
        }
        .logo {
          max-width: 180px;
          margin-bottom: 16px;
        }
        .content {
          padding: 32px 24px;
        }
        .button {
          display: inline-block;
          background-color: #F97316;
          color: white;
          text-decoration: none;
          padding: 12px 28px;
          border-radius: 30px;
          font-weight: 600;
          margin: 20px 0;
        }
        .order-summary {
          background-color: #f9fafb;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
        }
        .order-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          font-weight: bold;
          font-size: 18px;
          color: #F97316;
        }
        .discount-banner {
          background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          margin: 24px 0;
        }
        .footer {
          background-color: #f9fafb;
          padding: 24px;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
        }
        hr {
          border: none;
          border-top: 1px solid #e5e7eb;
          margin: 20px 0;
        }
      </style>
    </head>
    <body style="background-color:#f5f5f5; padding:20px;">
      <div class="container">
        <div class="header">
          <img src="https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png" alt="SpectrumCosmo" class="logo" />
          <h1 style="color:white; margin:0; font-size:24px;">${title}</h1>
        </div>
        <div class="content">
          <p style="font-size:16px; line-height:1.5;">${greeting}</p>
          ${children}
          ${buttonText && buttonUrl ? `<div style="text-align:center;"><a href="${buttonUrl}" class="button">${buttonText}</a></div>` : ''}
          ${discountBanner ? `
            <div class="discount-banner">
              <p style="margin:0; font-size:14px; color:#92400E;">🎉 ${discountBanner} 🎉</p>
            </div>
          ` : ''}
        </div>
        <div class="footer">
          <p>SpectrumCosmo – Wear your excitement with pride.</p>
          <p>${footerNote}</p>
          <p style="margin-top:16px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe" style="color:#F97316;">Unsubscribe</a> | 
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/contact" style="color:#F97316;">Contact Support</a>
          </p>
          <p>© ${new Date().getFullYear()} SpectrumCosmo. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
