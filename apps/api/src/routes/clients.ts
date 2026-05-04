// apps/api/src/routes/clients.ts
import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, type AuthRequest } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

router.get('/', async (req: AuthRequest, res) => {
  const { role, id: userId, organisationId } = req.user!
  const where = role === 'OFFICER'
    ? { officerId: userId, organisationId }
    : { organisationId }

  const clients = await prisma.client.findMany({
    where,
    include: {
      officer:         { select: { name: true } },
      servicingOfficer:{ select: { name: true } },
      transactions:    { include: { product: true }, orderBy: { confirmedAt: 'desc' }, take: 5 },
    },
    orderBy: { onboardedAt: 'desc' },
  })
  res.json({ data: clients })
})

router.get('/:id', async (req: AuthRequest, res) => {
  const client = await prisma.client.findUnique({
    where: { id: req.params.id },
    include: {
      officer:         { select: { name: true, staffId: true } },
      servicingOfficer:{ select: { name: true } },
      transactions: {
        include: { product: true, commission: true },
        orderBy: { confirmedAt: 'desc' },
      },
    },
  })
  if (!client) return res.status(404).json({ error: 'Client not found' })
  res.json({ data: client })
})

// POST /api/clients — create from converted lead
router.post('/', async (req: AuthRequest, res) => {
  const { name, phone, email, accountNumber, leadId } = req.body
  const client = await prisma.client.create({
    data: {
      officerId:      req.user!.id,
      organisationId: req.user!.organisationId,
      name, phone, email, accountNumber, leadId,
    },
  })
  if (leadId) {
    await prisma.lead.update({
      where: { id: leadId },
      data: { status: 'CONVERTED', convertedAt: new Date() },
    })
  }
  res.status(201).json({ data: client })
})

export default router
