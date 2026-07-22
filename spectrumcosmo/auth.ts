import NextAuth from "@auth/next"
import Google from "@auth/core/providers/google"
import Facebook from "@auth/core/providers/facebook"
import Apple from "@auth/core/providers/apple"
import { OAuth2 } from "@auth/core/providers/oauth2" // for custom TikTok

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google,
    Facebook,
    Apple,
    // Custom TikTok (OAuth 2.0)
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
          })
          const data = await res.json()
          // TikTok returns { data: { user: { ... } } }
          return data.data.user
        },
      },
      profile(profile) {
        return {
          id: profile.id,
          name: profile.display_name,
          email: profile.email || null,
          image: profile.avatar_url || null,
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",   // optional custom page
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  session: {
    strategy: "jwt", // no database sessions
  },
  trustHost: true,
})
