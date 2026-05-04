// apps/api/src/routes/users.ts
import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

// GET /api/users — team members
router.get('/', requireRole('MANAGER', 'DIRECTOR', 'ADMIN', 'FINANCE'), async (req: AuthRequest, res) => {
  const users = await prisma.user.findMany({
    where: { organisationId: req.user!.organisationId },
    select: {
      id: true, name: true, email: true, staffId: true,
      role: true, branchId: true, isActive: true, lastLoginAt: true,
      _count: { select: { originalClients: true, commissions: true } },
    },
    orderBy: { name: 'asc' },
  })
  res.json({ data: users })
})

// GET /api/users/me/dashboard — officer's own dashboard data
// Returns different payload depending on the org's compensationModel:
//
//  SALARY_ONLY:
//    compensationModel, activeleads, totalClients, rank,
//    clientsThisMonth, productsThisMonth, projectedCommission
//
//  All others:
//    compensationModel, activeleads, totalClients, rank,
//    commissionThisMonth
//
router.get('/me/dashboard', async (req: AuthRequest, res) => {
  const userId = req.user!.id
  const orgId  = req.user!.organisationId
  const now    = new Date()
  const month  = now.getMonth() + 1
  const year   = now.getFullYear()

  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth   = new Date(year, month, 0, 23, 59, 59, 999)

  // Fetch org compensation model — drives entire response shape
  const org = await prisma.organisation.findUniqueOrThrow({
    where: { id: orgId },
    select: { compensationModel: true, defaultCommissionRate: true },
  })

  const isSalaryOnly = org.compensationModel === 'SALARY_ONLY'

  // ── Queries common to all models ───────────────────────────────────────────
  const [leadCount, clientCount] = await Promise.all([
    prisma.lead.count({
      where: { officerId: userId, status: { notIn: ['CONVERTED', 'LOST'] } },
    }),
    prisma.client.count({ where: { officerId: userId } }),
  ])

  if (isSalaryOnly) {
    // ── SALARY_ONLY path ─────────────────────────────────────────────────────
    const [clientsThisMonth, transactionsThisMonth, allOfficerScores] = await Promise.all([
      // Clients this officer onboarded this month
      prisma.client.count({
        where: { officerId: userId, onboardedAt: { gte: startOfMonth, lte: endOfMonth } },
      }),
      // Transactions on this officer's clients this month (products sold)
      prisma.transaction.findMany({
        where: {
          client: { officerId: userId },
          confirmedAt: { gte: startOfMonth, lte: endOfMonth },
        },
        include: { product: true },
      }),
      // All officers' scores this month for ranking (clients × 10 + transactions)
      prisma.user.findMany({
        where: { organisationId: orgId, role: 'OFFICER', isActive: true },
        select: {
          id: true,
          originalClients: {
            where: { onboardedAt: { gte: startOfMonth, lte: endOfMonth } },
            select: { id: true },
          },
          servicingClients: {
            select: {
              transactions: {
                where: { confirmedAt: { gte: startOfMonth, lte: endOfMonth } },
                select: { id: true },
              },
            },
          },
        },
      }),
    ])

    // Projected commission — run engine in simulation mode over all transactions
    // We use a simplified flat-rate projection here; the full engine requires
    // richer context (volume, remapping) that is not worth fetching for a preview.
    // For orgs with product-level rules we use those; fall back to org default rate.
    let projectedCommission = 0
    const defaultRate = org.defaultCommissionRate ? Number(org.defaultCommissionRate) : 0

    for (const tx of transactionsThisMonth) {
      const rule = tx.product.commissionRule as any
      if (rule?.type === 'FLAT' && rule.rate) {
        projectedCommission += Number(tx.value) * Number(rule.rate)
      } else if (rule?.type === 'FLAT_PER_UNIT' && rule.amountPerUnit) {
        projectedCommission += (tx.quantity ?? 1) * Number(rule.amountPerUnit)
      } else if (defaultRate > 0) {
        projectedCommission += Number(tx.value) * defaultRate
      }
    }

    // Rank by performance score (same formula as overview page)
    const scoredOfficers = allOfficerScores
      .map((o) => ({
        id:    o.id,
        score: o.originalClients.length * 10 +
               o.servicingClients.reduce((s, c) => s + c.transactions.length, 0),
      }))
      .sort((a, b) => b.score - a.score)

    const rank = scoredOfficers.findIndex((o) => o.id === userId) + 1

    return res.json({
      data: {
        compensationModel:  org.compensationModel,
        activeleads:        leadCount,
        totalClients:       clientCount,
        rank,
        clientsThisMonth,
        productsThisMonth:  transactionsThisMonth.length,
        projectedCommission: Math.round(projectedCommission),
      },
    })

  } else {
    // ── Commission-based path ─────────────────────────────────────────────────
    const [commissionTotal, allOfficers] = await Promise.all([
      prisma.commission.aggregate({
        where: { officerId: userId, periodMonth: month, periodYear: year },
        _sum: { amount: true },
      }),
      prisma.commission.groupBy({
        by: ['officerId'],
        where: { organisationId: orgId, periodMonth: month, periodYear: year },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
    ])

    const rank = allOfficers.findIndex((o) => o.officerId === userId) + 1

    return res.json({
      data: {
        compensationModel:    org.compensationModel,
        commissionThisMonth:  commissionTotal._sum.amount ?? 0,
        activeleads:          leadCount,
        totalClients:         clientCount,
        rank,
      },
    })
  }
})

export default router
