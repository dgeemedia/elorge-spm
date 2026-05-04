// apps/web/lib/auth.ts
import NextAuth            from 'next-auth'
import MicrosoftEntraID   from 'next-auth/providers/microsoft-entra-id'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt              from 'bcryptjs'
import { prisma }          from './prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // ── SSO: Microsoft Azure Entra ID (Windows credentials) ─────────────────
    MicrosoftEntraID({
      clientId:     process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId:     process.env.AZURE_AD_TENANT_ID!,
    }),

    // ── Standard email + password ────────────────────────────────────────────
    CredentialsProvider({
      name: 'Email & Password',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({ where: { email: credentials.email as string } })
        if (!user || !user.passwordHash || !user.isActive) return null
        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash)
        if (!valid) return null
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
        return { id: user.id, name: user.name, email: user.email,
                 role: user.role, organisationId: user.organisationId }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === 'microsoft-entra-id') {
          // SSO login — look up or create user in database
          const dbUser = await prisma.user.upsert({
            where:  { email: token.email! },
            update: { lastLoginAt: new Date(), loginMethod: 'SSO' },
            create: {
              email:          token.email!,
              name:           token.name!,
              role:           'OFFICER',
              loginMethod:    'SSO',
              organisationId: 'PENDING', // Super Admin assigns org after first login
            },
          })
          token.userId         = dbUser.id
          token.role           = dbUser.role
          token.organisationId = dbUser.organisationId
        } else {
          token.userId         = (user as any).id
          token.role           = (user as any).role
          token.organisationId = (user as any).organisationId
        }
      }
      return token
    },
    async session({ session, token }) {
      session.user.userId         = token.userId as string
      session.user.role           = token.role   as string
      session.user.organisationId = token.organisationId as string
      return session
    },
  },

  pages: {
    signIn: '/login',
    error:  '/login',
  },
})
