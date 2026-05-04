// apps/api/src/routes/products.ts
import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

// GET /api/products — all products for this org (used by Finance confirm modal + mobile)
router.get('/', async (req: AuthRequest, res) => {
  const products = await prisma.product.findMany({
    where: { organisationId: req.user!.organisationId, isActive: true },
    orderBy: { name: 'asc' },
  })
  res.json({ data: products })
})

// GET /api/products/all — including inactive (Admin only)
router.get('/all', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  const products = await prisma.product.findMany({
    where: { organisationId: req.user!.organisationId },
    orderBy: { createdAt: 'asc' },
  })
  res.json({ data: products })
})

// POST /api/products — Super Admin creates a new product
router.post('/', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  const { name, code, category, unit, description, commissionRule } = req.body

  // Validate code uniqueness within org
  const existing = await prisma.product.findFirst({
    where: { organisationId: req.user!.organisationId, code: code.toUpperCase() },
  })
  if (existing) {
    return res.status(400).json({ error: `Product code ${code.toUpperCase()} already exists in your organisation` })
  }

  const product = await prisma.product.create({
    data: {
      organisationId: req.user!.organisationId,
      name, code: code.toUpperCase(),
      category, unit: unit ?? 'UNIT',
      description: description || null,
      commissionRule,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id, action: 'PRODUCT_CREATED',
      entityType: 'Product', entityId: product.id,
      newValue: { name, code, commissionRule },
    },
  })

  res.status(201).json({ data: product })
})

// PATCH /api/products/:id — Super Admin updates product or commission rule
router.patch('/:id', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  const { name, code, category, unit, description, commissionRule, isActive } = req.body

  const existing = await prisma.product.findFirst({
    where: { id: req.params.id, organisationId: req.user!.organisationId },
  })
  if (!existing) return res.status(404).json({ error: 'Product not found' })

  // IMPORTANT: changing commission rule only affects FUTURE transactions
  // Past commissions have ruleSnapshot — they are never retroactively changed
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      ...(name           !== undefined && { name }),
      ...(code           !== undefined && { code: code.toUpperCase() }),
      ...(category       !== undefined && { category }),
      ...(unit           !== undefined && { unit }),
      ...(description    !== undefined && { description }),
      ...(commissionRule !== undefined && { commissionRule }),
      ...(isActive       !== undefined && { isActive }),
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id, action: 'PRODUCT_UPDATED',
      entityType: 'Product', entityId: product.id,
      oldValue: { commissionRule: existing.commissionRule },
      newValue: { commissionRule: product.commissionRule },
    },
  })

  res.json({ data: product })
})

export default router
