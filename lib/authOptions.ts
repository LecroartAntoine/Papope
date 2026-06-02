import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        try {
          const sql = neon(process.env.POSTGRES_URL!)

          // Find user in database
          const result = await sql`
            SELECT id, username, password_hash, is_admin FROM users 
            WHERE username = ${credentials.username}
          `

          if (!result || result.length === 0) {
            return null
          }

          const user = result[0] as any
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password_hash
          )

          if (!isPasswordValid) {
            return null
          }

          // Fetch user's allowed sections
          const accessResult = await sql`
            SELECT section FROM user_access 
            WHERE user_id = ${user.id}
          `

          const sections = (accessResult || []).map((row: any) => row.section)

          return {
            id: String(user.id),
            name: user.username,
            email: `${user.username}@local`,
            isAdmin: user.is_admin,
            sections,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.isAdmin = (user as any).isAdmin
        token.sections = (user as any).sections
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.isAdmin = token.isAdmin as boolean
        session.user.sections = token.sections as string[]
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url
      if (url.startsWith('/')) return `${baseUrl}${url}`
      return `${baseUrl}/`
    },
  },
}
