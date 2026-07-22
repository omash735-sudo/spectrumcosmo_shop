import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

console.log("Auth init - NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
console.log("Auth init - NEXTAUTH_SECRET:", process.env.NEXTAUTH_SECRET ? "SET" : "MISSING");
console.log("Auth init - AUTH_GOOGLE_ID:", process.env.AUTH_GOOGLE_ID ? "SET" : "MISSING");

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  debug: true,
});
