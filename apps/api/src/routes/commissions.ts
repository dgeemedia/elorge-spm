// apps/api/src/routes/commissions.ts
import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

// GET /api/commissions
router.get('/', async (req: AuthRequest, res) => {
  const { role, id: userId, organisationId } = req.user!
  const { month, year, status } = req.query

  const now = new Date()
  const where: any = {
    organisationId,
    ...(status ? { status } : {}),
    ...(month ? { periodMonth: Number(month) } : { periodMonth: now.getMonth() + 1 }),
    ...(year  ? { periodYear:  Number(year)  } : { periodYear:  now.getFullYear() }),
    ...(role === 'OFFICER' ? { officerId: userId } : {}),
  }

  const commissions = await prisma.commission.findMany({
    where,
    include: {
      officer:     { select: { name: true, staffId: true } },
      transaction: { include: { product: true, client: { select: { name: true } } } },
      dispute:     true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const total = await prisma.commission.aggregate({
    where, _sum: { amount: true },
  })

  res.json({ data: commissions, total: total._sum.amount ?? 0 })
})

// PATCH /api/commissions/:id/approve
router.patch('/:id/approve', requireRole('MANAGER', 'ADMIN'), async (req: AuthRequest, res) => {
  const commission = await prisma.commission.update({
    where: { id: req.params.id },
    data: { status: 'APPROVED', approvedBy: req.user!.id, approvedAt: new Date() },
  })
  await prisma.auditLog.create({
    data: { userId: req.user!.id, action: 'COMMISSION_APPROVED',
            entityType: 'Commission', entityId: commission.id,
            newValue: { status: 'APPROVED' } },
  })
  res.json({ data: commission })
})

// POST /api/commissions/:id/dispute
router.post('/:id/dispute', requireRole('OFFICER'), async (req: AuthRequest, res) => {
  const { reason } = req.body
  const dispute = await prisma.dispute.create({
    data: { commissionId: req.params.id, raisedBy: req.user!.id, reason },
  })
  await prisma.commission.update({
    where: { id: req.params.id }, data: { status: 'DISPUTED' },
  })
  res.status(201).json({ data: dispute })
})

export default router
