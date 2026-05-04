// apps/api/src/routes/leads.ts
import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

// GET /api/leads — filtered by role
router.get('/', async (req: AuthRequest, res) => {
  const { role, id: userId, organisationId } = req.user!
  const where =
    role === 'OFFICER'
      ? { officerId: userId, organisationId }
      : { organisationId }

  const leads = await prisma.lead.findMany({
    where,
    include: { officer: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  res.json({ data: leads })
})

// POST /api/leads — log a new lead
router.post('/', async (req: AuthRequest, res) => {
  const { prospectName, phone, email, productInterest, estimatedValue, notes, nextFollowUp } = req.body
  const lead = await prisma.lead.create({
    data: {
      officerId: req.user!.id,
      organisationId: req.user!.organisationId,
      prospectName, phone, email, productInterest,
      estimatedValue: estimatedValue ? Number(estimatedValue) : null,
      notes,
      nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : null,
    },
  })
  res.status(201).json({ data: lead })
})

// PATCH /api/leads/:id — update status
router.patch('/:id', async (req: AuthRequest, res) => {
  const { status, notes, nextFollowUp } = req.body
  const lead = await prisma.lead.update({
    where: { id: req.params.id },
    data: { status, notes, nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : undefined },
  })
  res.json({ data: lead })
})

export default router
