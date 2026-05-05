// apps/web/lib/auth.ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string }
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        })
        if (!user || !user.passwordHash || !user.isActive) return null
        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) return null
        return {
          id:             user.id,
          name:           user.name,
          email:          user.email,
          role:           user.role,
          organisationId: user.organisationId,
          userId:         user.id,
        }
      },
    }),
    MicrosoftEntraID({
      clientId:     process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId:     process.env.AZURE_AD_TENANT_ID ?? 'common',
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role           = (user as any).role
        token.organisationId = (user as any).organisationId
        token.userId         = (user as any).id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role           = token.role
        ;(session.user as any).organisationId = token.organisationId
        ;(session.user as any).userId         = token.userId
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
})