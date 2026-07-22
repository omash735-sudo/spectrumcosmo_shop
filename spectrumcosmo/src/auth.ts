import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import AppleProvider from "next-auth/providers/apple";

console.log('Auth initialization started');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING');
console.log('AUTH_GOOGLE_ID:', process.env.AUTH_GOOGLE_ID ? 'SET' : 'MISSING');
console.log('AUTH_GOOGLE_SECRET:', process.env.AUTH_GOOGLE_SECRET ? 'SET' : 'MISSING');

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: true,
  logger: {
    error: (code, metadata) => {
      console.error('AUTH ERROR:', code, metadata);
    },
    warn: (code) => {
      console.warn('AUTH WARN:', code);
    },
    debug: (code, metadata) => {
      console.log('AUTH DEBUG:', code, metadata);
    },
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        captchaToken: { label: "captchaToken", type: "text" },
        captchaAnswer: { label: "captchaAnswer", type: "text" },
      },
      async authorize(credentials) {
        console.log('Authorize called for:', credentials?.email);
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }
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
        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
        };
      },
    }),
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
  ],
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email ?? undefined;
        token.name = user.name ?? undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email ?? undefined;
        session.user.name = token.name ?? undefined;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
});
