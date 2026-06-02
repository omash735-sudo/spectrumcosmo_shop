// lib/email/promoCodes.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPromoCodeEmail(to: string, code: string, discountType: string, discountValue: number, expiresAt: Date | null) {
  const discountText = discountType === 'percentage' ? `${discountValue}% off` : `MWK ${discountValue.toLocaleString()} off`;
  const expiryText = expiresAt ? `This code expires on ${expiresAt.toLocaleDateString()}.` : 'No expiry date.';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #f97316;">Your Promo Code</h2>
      </div>
      <p>You have received a promo code for SpectrumCosmo!</p>
      <div style="text-align: center; margin: 20px 0;">
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
          ${code}
        </div>
      </div>
      <p><strong>Discount:</strong> ${discountText}</p>
      <p><strong>${expiryText}</strong></p>
      <div style="margin: 20px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/products" style="background: #f97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Shop Now</a>
      </div>
    </div>
  `;
  
  await transporter.sendMail({
    from: `"SpectrumCosmo" <${process.env.SMTP_USER}>`,
    to,
    subject: `Your ${discountText} Promo Code`,
    html,
  });
}

export async function sendReferralRewardEmail(to: string, rewardCode: string, discountValue: number) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #f97316;">Referral Reward Unlocked!</h2>
      </div>
      <p>Congratulations! You have successfully referred friends to SpectrumCosmo.</p>
      <p>Your reward code for ${discountValue}% off is:</p>
      <div style="text-align: center; margin: 20px 0;">
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
          ${rewardCode}
        </div>
      </div>
      <div style="margin: 20px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/products" style="background: #f97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Shop Now</a>
      </div>
    </div>
  `;
  
  await transporter.sendMail({
    from: `"SpectrumCosmo Rewards" <${process.env.SMTP_USER}>`,
    to,
    subject: 'You earned a referral reward!',
    html,
  });
}
