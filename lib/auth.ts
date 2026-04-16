import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const res = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        })

        if (!res.ok) return null

        const data = await res.json()
        if (!data.access_token) return null

        // Fetch user's API keys to get the first active one (stored server-side)
        const keysRes = await fetch(`${API_URL}/auth/keys`, {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        })

        let apiKey = null
        if (keysRes.ok) {
          const keysData = await keysRes.json()
          // Use first active key if available
          const activeKey = keysData.keys?.find((k: { is_active: boolean }) => k.is_active)
          if (activeKey) {
            // For now, we store the key prefix as a reference
            // The actual key is managed server-side
            apiKey = activeKey.id
          }
        }

        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.email,
          apiKeyId: apiKey,
          accessToken: data.access_token,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
        token.apiKeyId = (user as { apiKeyId?: string }).apiKeyId
        token.accessToken = (user as { accessToken?: string }).accessToken
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string
        session.user.apiKeyId = token.apiKeyId as string | null
        session.user.accessToken = token.accessToken as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
})
