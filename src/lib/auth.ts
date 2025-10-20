import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('🔐 Authorize called with:', {
          email: credentials?.email,
          hasPassword: !!credentials?.password,
          passwordLength: credentials?.password?.length,
          timestamp: new Date().toISOString()
        })

        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })
          console.log('👤 User found:', !!user, user?.email)

          if (!user) {
            console.log('❌ User not found')
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )
          console.log('🔑 Password valid:', isPasswordValid)

          if (!isPasswordValid) {
            console.log('❌ Invalid password')
            return null
          }

          if (!user.isActive) {
            console.log('❌ User not active')
            return null
          }

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
          })

          const authUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
          console.log('✅ Returning auth user:', authUser)
          return authUser
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 15 * 60, // 15 minutes
  },
  jwt: {
    maxAge: 15 * 60, // 15 minutes
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log('🔑 JWT callback:', { hasUser: !!user, tokenId: token.id, userRole: user?.role })
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      console.log('📱 Session callback:', { hasToken: !!token, tokenId: token.id, sessionEmail: session.user?.email })
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Support multiple domains
      const allowedDomains = [
        'http://mgws4gw88co0s88k0kscgow4.31.220.17.127.sslip.io',
        'https://mgws4gw88co0s88k0kscgow4.31.220.17.127.sslip.io',
        'http://maestms.streamlinexperts.rw',
        'https://maestms.streamlinexperts.rw',
        'http://localhost:3000',
        'https://localhost:3000'
      ]

      console.log('NextAuth redirect:', { url, baseUrl, allowedDomains })

      // If URL is relative, use current baseUrl
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`
      }

      // Check if URL origin is in allowed domains
      try {
        const urlOrigin = new URL(url).origin
        console.log('Checking origin:', urlOrigin)

        if (allowedDomains.includes(urlOrigin)) {
          console.log('Origin allowed, returning:', url)
          return url
        }
      } catch (e) {
        console.error('Invalid URL in redirect:', url, e)
      }

      // Default redirect to dashboard on current domain
      const dashboardUrl = `${baseUrl}/dashboard`
      console.log('Default redirect to:', dashboardUrl)
      return dashboardUrl
    }
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  debug: process.env.NODE_ENV === 'development',
  // Use relative URLs to avoid domain issues
  useSecureCookies: process.env.NODE_ENV === 'production',
  trustHost: true,
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? `__Secure-next-auth.session-token` : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  }
}