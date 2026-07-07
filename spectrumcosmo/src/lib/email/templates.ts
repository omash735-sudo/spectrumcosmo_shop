// lib/email/templates.ts

export function renderWelcomeEmail(name: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to SpectrumCosmo</title>
</head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#F97316,#ea580c);padding:40px 30px;text-align:center;">
              <h1 style="color:#ffffff;font-size:28px;font-weight:800;margin:0;">SpectrumCosmo</h1>
              <p style="color:#ffedd5;font-size:16px;margin:8px 0 0;">Wear your excitement with pride</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px 30px;">
              <h2 style="color:#1a1a2e;font-size:24px;font-weight:700;margin:0 0 12px;">Welcome, ${name || 'Anime Fan'}! 🎉</h2>
              <p style="color:#4a4a6a;font-size:16px;line-height:1.6;margin:0 0 20px;">
                You've successfully joined the SpectrumCosmo community! Get ready for exclusive anime merch drops, special offers, and community updates.
              </p>
              <div style="background:#f8f9fa;border-radius:12px;padding:20px;margin:0 0 24px;">
                <p style="color:#4a4a6a;font-size:14px;line-height:1.6;margin:0;">
                  <strong style="color:#1a1a2e;">What's next?</strong><br>
                  • Be the first to know about new drops<br>
                  • Get subscriber-only discounts<br>
                  • Receive weekly anime updates
                </p>
              </div>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background:#F97316;border-radius:50px;padding:12px 32px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/products" style="color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;display:inline-block;">
                      Start Shopping →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#8a8aa8;font-size:13px;line-height:1.6;margin:24px 0 0;text-align:center;">
                You can change your preferences anytime.<br>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/newsletter/preferences" style="color:#F97316;text-decoration:none;">Manage preferences</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8f9fa;padding:24px 30px;text-align:center;border-top:1px solid #e9ecef;">
              <p style="color:#8a8aa8;font-size:12px;margin:0;">
                SpectrumCosmo · Wear your excitement with pride<br>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email={{email}}" style="color:#8a8aa8;text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export function renderConfirmationEmail(name: string, confirmUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Subscription</title>
</head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
          <tr>
            <td style="background:linear-gradient(135deg,#F97316,#ea580c);padding:30px;text-align:center;">
              <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0;">Confirm Your Subscription</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px;">
              <p style="color:#1a1a2e;font-size:16px;line-height:1.6;margin:0 0 20px;">
                Hey ${name || 'there'}! 👋
              </p>
              <p style="color:#4a4a6a;font-size:16px;line-height:1.6;margin:0 0 24px;">
                Please confirm your email address to start receiving SpectrumCosmo newsletters.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background:#F97316;border-radius:50px;padding:14px 36px;">
                    <a href="${confirmUrl}" style="color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;display:inline-block;">
                      Confirm Email →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#8a8aa8;font-size:13px;line-height:1.6;margin:24px 0 0;text-align:center;">
                This link expires in 24 hours. If you didn't sign up, ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8f9fa;padding:20px;text-align:center;border-top:1px solid #e9ecef;">
              <p style="color:#8a8aa8;font-size:12px;margin:0;">SpectrumCosmo</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export function renderNewsletterEmail(
  title: string,
  content: string,
  imageUrl: string | null,
  campaignId: number,
  subscriberId: number
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const unsubscribeUrl = `${appUrl}/api/subscribe/unsubscribe?email={{email}}`;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#F97316,#ea580c);padding:24px 30px;text-align:center;">
              <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:0;">SpectrumCosmo</h1>
              <p style="color:#ffedd5;font-size:13px;margin:4px 0 0;">Wear your excitement with pride</p>
            </td>
          </tr>
          <!-- Image -->
          ${imageUrl ? `
          <tr>
            <td style="padding:0;">
              <img src="${imageUrl}" alt="Newsletter header" style="width:100%;height:auto;display:block;max-height:300px;object-fit:cover;" />
            </td>
          </tr>
          ` : ''}
          <!-- Content -->
          <tr>
            <td style="padding:30px 30px 20px;">
              <h2 style="color:#1a1a2e;font-size:22px;font-weight:700;margin:0 0 16px;">${title}</h2>
              <div style="color:#4a4a6a;font-size:15px;line-height:1.8;">
                ${content}
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8f9fa;padding:20px 30px;text-align:center;border-top:1px solid #e9ecef;">
              <p style="color:#8a8aa8;font-size:12px;margin:0 0 8px;">
                You're receiving this because you subscribed to SpectrumCosmo.
              </p>
              <p style="color:#8a8aa8;font-size:12px;margin:0;">
                <a href="${unsubscribeUrl}" style="color:#F97316;text-decoration:underline;">Unsubscribe</a>
                ·
                <a href="${appUrl}/newsletter/preferences" style="color:#F97316;text-decoration:underline;">Preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
