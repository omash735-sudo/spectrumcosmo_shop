// auth.ts – root of project
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import AppleProvider from "next-auth/providers/apple";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // ----- Credentials (calls your existing /api/auth/login) -----
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        captchaToken: { label: "captchaToken", type: "text" },
        captchaAnswer: { label: "captchaAnswer", type: "text" },
      },
      async authorize(credentials) {
        const res = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
            captchaToken: credentials.captchaToken,
            captchaAnswer: credentials.captchaAnswer,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (res.status === 428) throw new Error("CAPTCHA_REQUIRED");
          if (res.status === 403 && data.needsVerification)
            throw new Error("VERIFICATION_REQUIRED");
          throw new Error(data.error || "Invalid credentials");
        }

        // Return user object – Auth.js will create the session
        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
        };
      },
    }),

    // ----- OAuth providers -----
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.AUTH_FACEBOOK_ID!,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET!,
    }),
    AppleProvider({
      clientId: process.env.AUTH_APPLE_ID!,
      clientSecret: process.env.AUTH_APPLE_SECRET!,
    }),
    // TikTok – we can add it later using a custom provider
  ],

  pages: {
    signIn: "/auth/login",   // use your existing login page
    error: "/auth/login",    // we'll handle errors there
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },

  session: { strategy: "jwt" },
  trustHost: true,
});
