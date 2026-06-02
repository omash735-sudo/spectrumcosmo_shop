import { betterAuth } from "better-auth";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL!,
});

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET, // add this line
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  emailVerification: {
    enabled: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  rateLimit: {
    window: 10,
    max: 5,
  },
});
