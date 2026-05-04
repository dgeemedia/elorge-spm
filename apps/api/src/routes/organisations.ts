// apps/api/src/routes/organisations.ts
import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

// GET /api/organisations/me
router.get('/me', async (req: AuthRequest, res) => {
  const org = await prisma.organisation.findUnique({
    where: { id: req.user!.organisationId },
  })
  res.json({ data: org })
})

// PATCH /api/organisations/me — Super Admin updates org settings
router.patch('/me', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  const {
    name, industry, compensationModel, defaultCommissionRate,
    requireManagerApproval, requireFinanceApproval, commissionPayDay,
    ssoEnabled, ssoProvider, ssoTenantId, ssoClientId, ssoClientSecret,
    ssoDisplayName, ssoLogoUrl, logoUrl, primaryColor,
  } = req.body

  const org = await prisma.organisation.update({
    where: { id: req.user!.organisationId },
    data: {
      ...(name                   !== undefined && { name }),
      ...(industry               !== undefined && { industry }),
      ...(compensationModel      !== undefined && { compensationModel }),
      ...(defaultCommissionRate  !== undefined && { defaultCommissionRate }),
      ...(requireManagerApproval !== undefined && { requireManagerApproval }),
      ...(requireFinanceApproval !== undefined && { requireFinanceApproval }),
      ...(commissionPayDay       !== undefined && { commissionPayDay }),
      ...(ssoEnabled             !== undefined && { ssoEnabled }),
      ...(ssoProvider            !== undefined && { ssoProvider }),
      ...(ssoTenantId            !== undefined && { ssoTenantId }),
      ...(ssoClientId            !== undefined && { ssoClientId }),
      ...(ssoClientSecret        !== undefined && { ssoClientSecret }),
      ...(ssoDisplayName         !== undefined && { ssoDisplayName }),
      ...(ssoLogoUrl             !== undefined && { ssoLogoUrl }),
      ...(logoUrl                !== undefined && { logoUrl }),
      ...(primaryColor           !== undefined && { primaryColor }),
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id, action: 'ORG_SETTINGS_UPDATED',
      entityType: 'Organisation', entityId: org.id,
      newValue: req.body,
    },
  })

  res.json({ data: org })
})

export default router
