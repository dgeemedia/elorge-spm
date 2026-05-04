// apps/api/src/routes/webhooks.ts
// Receives POST from client's core banking system (Finacle, FlexCube, SEABaaS)
// No auth middleware — secured by HMAC signature verification

import { Router, type Request, type Response } from 'express'
import crypto from 'crypto'
import { prisma } from '../lib/prisma'
import { calculateCommission } from '@elorge/engine'
import { sendCommissionAlert } from '@elorge/notifications/push'

const router = Router()

function verifyHmac(body: string, signature: string | undefined): boolean {
  if (!signature) return false
  const expected = crypto
    .createHmac('sha256', process.env.WEBHOOK_HMAC_SECRET!)
    .update(body)
    .digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

// POST /webhooks/transaction
router.post('/transaction', async (req: Request, res: Response) => {
  const rawBody    = JSON.stringify(req.body)
  const signature  = req.headers['x-elorge-signature'] as string | undefined

  if (!verifyHmac(rawBody, signature)) {
    return res.status(401).json({ error: 'Invalid webhook signature' })
  }

  const { clientAccountNumber, productCode, value, externalRef, confirmedAt } = req.body

  // 1. Find client by account number
  const client = await prisma.client.findFirst({
    where: { accountNumber: clientAccountNumber },
    include: { officer: true, servicingOfficer: true, transactions: true },
  })
  if (!client) return res.status(404).json({ error: `Client ${clientAccountNumber} not found in Elorge` })

  // 2. Find product by code within client's organisation
  const product = await prisma.product.findFirst({
    where: { code: productCode, organisationId: client.organisationId },
  })
  if (!product) return res.status(404).json({ error: `Product ${productCode} not found` })

  // 3. Deduplicate — check if this external ref was already processed
  if (externalRef) {
    const existing = await prisma.transaction.findFirst({ where: { externalRef } })
    if (existing) return res.json({ message: 'Already processed', transactionId: existing.id })
  }

  const isExistingClient    = client.transactions.length > 0
  const isNewProductForClient = !client.transactions.some((t) => t.productId === product.id)

  const now = new Date()
  const officerVolumeThisMonth = await prisma.transaction.count({
    where: {
      product: { id: product.id },
      client:  { officerId: client.officerId },
      confirmedAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
    },
  })

  const transaction = await prisma.transaction.create({
    data: {
      clientId: client.id, productId: product.id,
      value: Number(value), confirmedBy: 'WEBHOOK',
      externalRef, isFromWebhook: true,
      confirmedAt: confirmedAt ? new Date(confirmedAt) : new Date(),
    },
  })

  const result = calculateCommission({
    transactionValue:       Number(value),
    commissionRule:         product.commissionRule as any,
    officerVolumeThisMonth: officerVolumeThisMonth + 1,
    isExistingClient, isNewProductForClient,
    transactionDate:        new Date(),
    isOfficerActive:        client.isOfficerActive,
    remappingType:          (client.remappingType as any) ?? null,
  })

  const earningOfficerId = result.officerEarns
    ? (client.isOfficerActive ? client.officerId : client.servicingOfficerId)
    : null

  if (result.officerEarns && earningOfficerId) {
    await prisma.commission.create({
      data: {
        officerId: earningOfficerId, transactionId: transaction.id,
        organisationId: client.organisationId, amount: result.amount,
        ruleSnapshot: result, status: 'PENDING',
        periodMonth: now.getMonth() + 1, periodYear: now.getFullYear(),
      },
    })

    const officer = client.isOfficerActive ? client.officer : client.servicingOfficer
    if (officer?.expoPushToken) {
      await sendCommissionAlert(officer.expoPushToken, officer.name, result.amount, product.name).catch(() => {})
    }
  }

  res.json({ success: true, transactionId: transaction.id, commissionAmount: result.amount })
})

export default router
