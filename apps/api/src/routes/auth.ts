// apps/api/src/routes/auth.ts
// Mobile app login — returns a JWT token on success

import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'

const router = Router()

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true, name: true, email: true, role: true,
      organisationId: true, passwordHash: true,
      isActive: true, loginMethod: true,
      staffId: true, branchId: true, expoPushToken: true,
    },
  })

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  if (!user.isActive) {
    return res.status(403).json({ error: 'Your account has been deactivated. Please contact your administrator.' })
  }

  if (user.loginMethod === 'SSO' || !user.passwordHash) {
    return res.status(401).json({
      error: 'This account uses organisation SSO login. Please use the web portal or contact your IT team.',
    })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  // Sign JWT
  const token = jwt.sign(
    {
      id:             user.id,
      role:           user.role,
      organisationId: user.organisationId,
    },
    process.env.API_SECRET_KEY!,
    { expiresIn: '30d' }
  )

  const { passwordHash: _, ...safeUser } = user

  return res.json({
    token,
    data: safeUser,
    message: `Welcome back, ${user.name}`,
  })
})

// POST /api/auth/logout  (client just discards the token — but useful for audit)
router.post('/logout', async (req, res) => {
  res.json({ message: 'Logged out successfully' })
})

// POST /api/auth/register-push-token
// Called by mobile app after login to register Expo push token
router.post('/register-push-token', async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'No token' })

  try {
    const decoded = jwt.verify(
      authHeader.replace('Bearer ', ''),
      process.env.API_SECRET_KEY!
    ) as { id: string }

    const { expoPushToken } = req.body
    await prisma.user.update({
      where: { id: decoded.id },
      data: { expoPushToken },
    })
    res.json({ message: 'Push token registered' })
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
})

export default router
