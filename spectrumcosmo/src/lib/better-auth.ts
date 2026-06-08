// lib/auth.ts
import { betterAuth } from "better-auth";
import { Pool } from "pg";
import nodemailer from "nodemailer";

// Validate required environment variables
const requiredEnvVars = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "POSTGRES_URL",
  "BETTER_AUTH_SECRET",
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing environment variable: ${envVar}`);
  }
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
});

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL!,
});

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET!,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    sendResetPassword: async ({ user, url }) => {
      await transporter.sendMail({
        from: `"SpectrumCosmo" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: "Reset Your Password",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2>Reset Your Password</h2>
            <p>Hello ${user.name || user.email},</p>
            <p>Click the link below to reset your password. This link expires in 1 hour.</p>
            <a href="${url}" style="background: #F97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });
    },
  },
  // emailVerification is omitted – it is disabled by default
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,     // 1 day
  },
  rateLimit: {
    window: 10, // seconds
    max: 5,     // requests per window
  },
});
