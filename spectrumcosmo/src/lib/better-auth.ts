// lib/better-auth.ts
import { betterAuth } from "better-auth";
import { postgresAdapter } from "better-auth/adapters/postgres";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.POSTGRES_URL!);

export const auth = betterAuth({
  database: postgresAdapter(sql),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  // Disable built-in email verification (keep your custom one)
  emailVerification: {
    enabled: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,     // 1 day
  },
  rateLimit: {
    window: 10, // seconds
    max: 5,     // attempts per window
  },
  // (Optional later: socialProviders)
});
