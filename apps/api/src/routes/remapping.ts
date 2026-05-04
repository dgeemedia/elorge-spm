// apps/api/src/routes/remapping.ts
import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth'
import { sendRemappingRequestEmail, sendRemappingApprovedEmail } from '@elorge/notifications/email'

const router = Router()
router.use(requireAuth)

// POST /api/remapping — Manager raises exit + remap request
router.post('/', requireRole('MANAGER', 'ADMIN'), async (req: AuthRequest, res) => {
  const { fromOfficerId, toOfficerId, remapType, exitType, exitDate, clientIds, notes } = req.body

  const request = await prisma.remappingRequest.create({
    data: {
      organisationId: req.user!.organisationId,
      fromOfficerId, toOfficerId: toOfficerId || null,
      remapType, exitType,
      exitDate: new Date(exitDate),
      clientIds, requestedBy: req.user!.id,
    },
    include: { fromOfficer: true },
  })

  // Notify Super Admin by email
  const admins = await prisma.user.findMany({
    where: { organisationId: req.user!.organisationId, role: 'ADMIN' },
  })
  const org = await prisma.organisation.findUnique({ where: { id: req.user!.organisationId } })

  for (const admin of admins) {
    await sendRemappingRequestEmail(admin.email, {
      officerName: request.fromOfficer.name,
      clientCount: clientIds.length,
      requestedBy: req.user!.id,
      orgName: org?.name ?? '',
    }).catch(() => {})
  }

  res.status(201).json({ data: request, message: 'Remapping request submitted. Super Admin notified.' })
})

// GET /api/remapping — Super Admin views pending requests
router.get('/', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  const requests = await prisma.remappingRequest.findMany({
    where: { organisationId: req.user!.organisationId },
    include: {
      fromOfficer: { select: { name: true, staffId: true } },
      toOfficer:   { select: { name: true } },
      requestedByUser: { select: { name: true } },
    },
    orderBy: { requestedAt: 'desc' },
  })
  res.json({ data: requests })
})

// PATCH /api/remapping/:id/approve — Super Admin approves
router.patch('/:id/approve', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  const request = await prisma.remappingRequest.findUnique({
    where: { id: req.params.id },
    include: { fromOfficer: true, toOfficer: true },
  })
  if (!request) return res.status(404).json({ error: 'Request not found' })

  // Execute atomically
  await prisma.$transaction(async (tx) => {
    // 1. Approve the request
    await tx.remappingRequest.update({
      where: { id: request.id },
      data: { status: 'APPROVED', reviewedBy: req.user!.id, reviewedAt: new Date(), executedAt: new Date() },
    })

    // 2. Deactivate the exiting officer
    await tx.user.update({
      where: { id: request.fromOfficerId },
      data: { isActive: false, exitedAt: request.exitDate, exitReason: request.exitType },
    })

    // 3. Remap each client
    for (const clientId of request.clientIds) {
      await tx.client.update({
        where: { id: clientId },
        data: {
          isOfficerActive:    false,
          servicingOfficerId: request.toOfficerId,
          remappingType:      request.remapType,
          remappedAt:         new Date(),
          remappedBy:         req.user!.id,
          exitReason:         request.exitType,
        },
      })
      // 4. Audit log per client
      await tx.auditLog.create({
        data: {
          userId:     req.user!.id,
          action:     'CLIENT_REMAPPED',
          entityType: 'Client',
          entityId:   clientId,
          newValue:   { remapType: request.remapType, toOfficerId: request.toOfficerId },
        },
      })
    }
  })

  // Notify manager
  const manager = await prisma.user.findUnique({ where: { id: request.requestedBy } })
  if (manager) {
    await sendRemappingApprovedEmail(manager.email, {
      officerName: request.fromOfficer.name,
      servicingOfficerName: request.toOfficer?.name ?? '',
      remapType: request.remapType,
    }).catch(() => {})
  }

  res.json({ message: `Remapping approved. ${request.clientIds.length} clients updated.` })
})

// PATCH /api/remapping/:id/reject
router.patch('/:id/reject', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  const { reviewNotes } = req.body
  await prisma.remappingRequest.update({
    where: { id: req.params.id },
    data: { status: 'REJECTED', reviewedBy: req.user!.id, reviewedAt: new Date(), reviewNotes },
  })
  res.json({ message: 'Remapping request rejected.' })
})

export default router
