// apps/api/src/routes/transactions.ts
// Finance manually confirms a transaction — triggers commission calculation

import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth'
import { calculateCommission } from '@elorge/engine'
import { sendCommissionAlert } from '@elorge/notifications/push'

const router = Router()
router.use(requireAuth)

// POST /api/transactions — Finance confirms a transaction
router.post('/', requireRole('FINANCE', 'ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
  const { clientId, productId, value, externalRef } = req.body

  // 1. Get client (for officer mapping and remapping status)
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      officer: true,
      servicingOfficer: true,
      transactions: { include: { product: true } },
    },
  })
  if (!client) return res.status(404).json({ error: 'Client not found' })

  // 2. Get product (for commission rules)
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) return res.status(404).json({ error: 'Product not found' })

  // 3. Check if this is an existing client / new product for this client
  const isExistingClient = client.transactions.length > 0
  const isNewProductForClient = !client.transactions.some((t) => t.productId === productId)

  // 4. Count officer's volume this month for this product (for tiered rules)
  const now = new Date()
  const officerVolumeThisMonth = await prisma.transaction.count({
    where: {
      product: { id: productId },
      client: { officerId: client.officerId },
      confirmedAt: {
        gte: new Date(now.getFullYear(), now.getMonth(), 1),
      },
    },
  })

  // 5. Create transaction
  const transaction = await prisma.transaction.create({
    data: { clientId, productId, value: Number(value), confirmedBy: req.user!.id, externalRef },
  })

  // 6. Run commission engine
  const result = calculateCommission({
    transactionValue:       Number(value),
    commissionRule:         product.commissionRule as any,
    officerVolumeThisMonth: officerVolumeThisMonth + 1,
    isExistingClient,
    isNewProductForClient,
    transactionDate:        new Date(),
    isOfficerActive:        client.isOfficerActive,
    remappingType:          (client.remappingType as any) ?? null,
  })

  // 7. Determine who earns the commission
  const earningOfficerId = result.officerEarns
    ? (client.isOfficerActive ? client.officerId : (client.servicingOfficerId ?? client.officerId))
    : null

  // 8. Create commission record (even if amount is 0 — for audit)
  if (result.officerEarns && earningOfficerId) {
    await prisma.commission.create({
      data: {
        officerId:      earningOfficerId,
        transactionId:  transaction.id,
        organisationId: client.organisationId,
        amount:         result.amount,
        ruleSnapshot:   { ...result, productCode: product.code },
        status:         'PENDING',
        periodMonth:    now.getMonth() + 1,
        periodYear:     now.getFullYear(),
      },
    })

    // 9. Push notification to officer
    const earningOfficer = client.isOfficerActive ? client.officer : client.servicingOfficer
    if (earningOfficer?.expoPushToken) {
      await sendCommissionAlert(
        earningOfficer.expoPushToken,
        earningOfficer.name,
        result.amount,
        product.name
      ).catch(() => {}) // don't fail request if push fails
    }
  }

  // 10. Audit log
  await prisma.auditLog.create({
    data: {
      userId:     req.user!.id,
      action:     'TRANSACTION_CONFIRMED',
      entityType: 'Transaction',
      entityId:   transaction.id,
      newValue:   { value, clientId, productId, commissionAmount: result.amount },
    },
  })

  res.status(201).json({
    data: { transaction, commission: result },
    message: result.officerEarns
      ? `Commission of ₦${result.amount.toLocaleString()} calculated for officer`
      : `No commission — ${result.ruleApplied}`,
  })
})

export default router
