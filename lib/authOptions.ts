import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const validUser = process.env.APP_USERNAME
        const validPass = process.env.APP_PASSWORD

        if (!validUser || !validPass) {
          throw new Error('APP_USERNAME and APP_PASSWORD env vars are not set')
        }

        if (
          credentials?.username === validUser &&
          credentials?.password === validPass
        ) {
          return { id: '1', name: validUser, email: `${validUser}@local` }
        }
        return null
      },
    }),
  ],
  pages: {
    signIn: '/keeppushing/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async redirect({ url, baseUrl }) {
      // After sign in, go to KP dashboard
      if (url.startsWith(baseUrl)) return url
      if (url.startsWith('/')) return `${baseUrl}${url}`
      return `${baseUrl}/keeppushing/dashboard`
    },
  },
}
