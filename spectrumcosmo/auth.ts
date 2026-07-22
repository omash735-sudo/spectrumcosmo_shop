// auth.ts – root of project
import NextAuth from "@auth/next"
import Credentials from "@auth/core/providers/credentials"
import Google from "@auth/core/providers/google"
import Facebook from "@auth/core/providers/facebook"
import Apple from "@auth/core/providers/apple"
import { OAuth2 } from "@auth/core/providers/oauth2"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // 1. Credentials – delegates to your existing /api/auth/login
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        captchaToken: { label: "captchaToken", type: "text" }, // optional
        captchaAnswer: { label: "captchaAnswer", type: "text" }, // optional
      },
      async authorize(credentials) {
        // Forward to your existing login API
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
          // If CAPTCHA required, throw a special error so the client can handle it
          if (res.status === 428) {
            throw new Error("CAPTCHA_REQUIRED");
          }
          // If verification required
          if (res.status === 403 && data.needsVerification) {
            throw new Error("VERIFICATION_REQUIRED");
          }
          throw new Error(data.error || "Invalid credentials");
        }

        // Return user object – Auth.js will create session
        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          // store any extra fields in token via callbacks
        };
      },
    }),
    // 2. OAuth providers – keep as is
    Google,
    Facebook,
    Apple,
    // Custom TikTok – keep as before
    OAuth2({
      id: "tiktok",
      name: "TikTok",
      type: "oauth",
      clientId: process.env.TIKTOK_CLIENT_ID,
      clientSecret: process.env.TIKTOK_CLIENT_SECRET,
      authorization: {
        url: "https://www.tiktok.com/v2/auth/authorize/",
        params: { scope: "user.info.basic", response_type: "code" },
      },
      token: "https://open-api.tiktok.com/oauth/v2/token/",
      userinfo: {
        url: "https://open-api.tiktok.com/v2/user/info/",
        async request({ tokens }) {
          const res = await fetch("https://open-api.tiktok.com/v2/user/info/", {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          const data = await res.json();
          return data.data.user;
        },
      },
      profile(profile) {
        return {
          id: profile.id,
          name: profile.display_name,
          email: profile.email || null,
          image: profile.avatar_url || null,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",      // use your existing login page
    error: "/auth/login",       // we'll handle errors on the same page
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
  session: {
    strategy: "jwt",
  },
  trustHost: true,
});
