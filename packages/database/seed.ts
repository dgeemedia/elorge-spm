// packages/database/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Elorge SPM demo data...')
  const hash = await bcrypt.hash('Password123!', 10)

  // ── Org 1: Manufacturing ──────────────────────────────────────────────────
  const mfgOrg = await prisma.organisation.upsert({
    where: { id: 'demo-mfg-001' }, update: {},
    create: {
      id: 'demo-mfg-001', name: 'Elorge Demo — Manufacturing Co.',
      industry: 'MANUFACTURING', subscriptionTier: 'PROFESSIONAL',
      compensationModel: 'SALARY_PLUS_COMMISSION',
      defaultCommissionRate: 0.015,
    },
  })

  // ── Org 2: Bank ───────────────────────────────────────────────────────────
  const bankOrg = await prisma.organisation.upsert({
    where: { id: 'demo-bank-001' }, update: {},
    create: {
      id: 'demo-bank-001', name: 'Elorge Demo — Commercial Bank',
      industry: 'BANKING', subscriptionTier: 'PROFESSIONAL',
      compensationModel: 'COMMISSION_ONLY',
    },
  })

  // ── Org 3: Insurance ──────────────────────────────────────────────────────
  const insOrg = await prisma.organisation.upsert({
    where: { id: 'demo-ins-001' }, update: {},
    create: {
      id: 'demo-ins-001', name: 'Elorge Demo — Insurance Agency',
      industry: 'INSURANCE', subscriptionTier: 'GROWTH',
      compensationModel: 'RETAINER_PLUS_COMMISSION',
    },
  })

  console.log('✅ 3 orgs created')

  // ── Mfg Users ─────────────────────────────────────────────────────────────
  const mfgAdmin = await prisma.user.upsert({
    where: { email: 'admin@mfg-demo.com' }, update: {},
    create: { email: 'admin@mfg-demo.com', name: 'Super Admin (Mfg)', role: 'ADMIN', organisationId: mfgOrg.id, passwordHash: hash, staffId: 'MFG-ADM-001' },
  })
  const mfgManager = await prisma.user.upsert({
    where: { email: 'manager@mfg-demo.com' }, update: {},
    create: { email: 'manager@mfg-demo.com', name: 'Emeka Okafor', role: 'MANAGER', organisationId: mfgOrg.id, passwordHash: hash, staffId: 'MFG-MGR-001', baseSalary: 350000 },
  })
  const mfgOfficer1 = await prisma.user.upsert({
    where: { email: 'sola@mfg-demo.com' }, update: {},
    create: { email: 'sola@mfg-demo.com', name: 'Sola Adeyemi', role: 'OFFICER', organisationId: mfgOrg.id, passwordHash: hash, staffId: 'MFG-OFF-001', managerId: mfgManager.id, baseSalary: 180000, monthlyTarget: 500000 },
  })
  const mfgOfficer2 = await prisma.user.upsert({
    where: { email: 'ngozi@mfg-demo.com' }, update: {},
    create: { email: 'ngozi@mfg-demo.com', name: 'Ngozi Kalu', role: 'OFFICER', organisationId: mfgOrg.id, passwordHash: hash, staffId: 'MFG-OFF-002', managerId: mfgManager.id, baseSalary: 180000, monthlyTarget: 500000 },
  })
  const mfgFinance = await prisma.user.upsert({
    where: { email: 'finance@mfg-demo.com' }, update: {},
    create: { email: 'finance@mfg-demo.com', name: 'Amaka Nwosu', role: 'FINANCE', organisationId: mfgOrg.id, passwordHash: hash, staffId: 'MFG-FIN-001' },
  })

  // ── Bank Users ────────────────────────────────────────────────────────────
  const bankAdmin = await prisma.user.upsert({
    where: { email: 'admin@bank-demo.com' }, update: {},
    create: { email: 'admin@bank-demo.com', name: 'Super Admin (Bank)', role: 'ADMIN', organisationId: bankOrg.id, passwordHash: hash, staffId: 'BNK-ADM-001' },
  })
  const bankManager = await prisma.user.upsert({
    where: { email: 'manager@bank-demo.com' }, update: {},
    create: { email: 'manager@bank-demo.com', name: 'Chidi Okonkwo', role: 'MANAGER', organisationId: bankOrg.id, passwordHash: hash, staffId: 'BNK-MGR-001' },
  })
  const bankOfficer = await prisma.user.upsert({
    where: { email: 'tunde@bank-demo.com' }, update: {},
    create: { email: 'tunde@bank-demo.com', name: 'Tunde Babatunde', role: 'OFFICER', organisationId: bankOrg.id, passwordHash: hash, staffId: 'BNK-OFF-001', managerId: bankManager.id, monthlyTarget: 400000 },
  })

  // ── Ins Users ─────────────────────────────────────────────────────────────
  const insAdmin = await prisma.user.upsert({
    where: { email: 'admin@ins-demo.com' }, update: {},
    create: { email: 'admin@ins-demo.com', name: 'Super Admin (Ins)', role: 'ADMIN', organisationId: insOrg.id, passwordHash: hash, staffId: 'INS-ADM-001' },
  })
  const insOfficer = await prisma.user.upsert({
    where: { email: 'fatima@ins-demo.com' }, update: {},
    create: { email: 'fatima@ins-demo.com', name: 'Fatima Kabir', role: 'OFFICER', organisationId: insOrg.id, passwordHash: hash, staffId: 'INS-OFF-001', retainerAmount: 80000, monthlyTarget: 300000 },
  })

  console.log('✅ Users created across all 3 orgs')

  // ── Products: Manufacturing ───────────────────────────────────────────────
  const cement = await prisma.product.upsert({
    where: { organisationId_code: { organisationId: mfgOrg.id, code: 'CEM-001' } }, update: {},
    create: {
      organisationId: mfgOrg.id, name: 'Cement — 50kg Bag', code: 'CEM-001',
      category: 'GOODS', unit: 'BAG',
      description: 'Commission paid per bag confirmed delivered to buyer',
      commissionRule: { type: 'FLAT_PER_UNIT', amountPerUnit: 50, description: '₦50 flat per 50kg bag' },
    },
  })
  const steelRod = await prisma.product.upsert({
    where: { organisationId_code: { organisationId: mfgOrg.id, code: 'STL-001' } }, update: {},
    create: {
      organisationId: mfgOrg.id, name: 'Steel Rod — 12mm Bundle', code: 'STL-001',
      category: 'GOODS', unit: 'BUNDLE',
      description: '1.5% of confirmed invoice value',
      commissionRule: { type: 'FLAT_RATE', rate: 0.015, description: '1.5% of invoice value' },
    },
  })

  // ── Products: Bank ────────────────────────────────────────────────────────
  const fixedDep = await prisma.product.upsert({
    where: { organisationId_code: { organisationId: bankOrg.id, code: 'FD-001' } }, update: {},
    create: {
      organisationId: bankOrg.id, name: 'Fixed Deposit', code: 'FD-001',
      category: 'DEPOSIT', unit: 'ACCOUNT',
      commissionRule: {
        type: 'TIERED',
        tiers: [
          { minVolume: 0,  maxVolume: 10,   rate: 0.005  },
          { minVolume: 11, maxVolume: 25,   rate: 0.0075 },
          { minVolume: 26, maxVolume: null, rate: 0.01   },
        ],
        description: '0.5% – 1.0% tiered by monthly volume',
      },
    },
  })
  const smeLoan = await prisma.product.upsert({
    where: { organisationId_code: { organisationId: bankOrg.id, code: 'SL-001' } }, update: {},
    create: {
      organisationId: bankOrg.id, name: 'SME Loan', code: 'SL-001',
      category: 'LOAN', unit: 'ACCOUNT',
      commissionRule: { type: 'FLAT_RATE', rate: 0.008, description: '0.8% of loan value disbursed' },
    },
  })

  // ── Products: Insurance ───────────────────────────────────────────────────
  const lifePolicy = await prisma.product.upsert({
    where: { organisationId_code: { organisationId: insOrg.id, code: 'LIF-001' } }, update: {},
    create: {
      organisationId: insOrg.id, name: 'Life Insurance Policy', code: 'LIF-001',
      category: 'POLICY', unit: 'POLICY',
      commissionRule: { type: 'FLAT_RATE', rate: 0.10, description: '10% of first-year annual premium' },
    },
  })

  console.log('✅ Products created (mfg x2, bank x2, insurance x1)')

  // ── Clients ───────────────────────────────────────────────────────────────
  const clients = await Promise.all([
    prisma.client.upsert({ where: { id: 'mfg-c-001' }, update: {},
      create: { id: 'mfg-c-001', officerId: mfgOfficer1.id, organisationId: mfgOrg.id, name: 'Adekunle Construction Ltd', phone: '08011111111', company: 'Adekunle Construction Ltd', clientType: 'BUSINESS' } }),
    prisma.client.upsert({ where: { id: 'mfg-c-002' }, update: {},
      create: { id: 'mfg-c-002', officerId: mfgOfficer2.id, organisationId: mfgOrg.id, name: 'Bello & Sons Builders', phone: '08022222222', clientType: 'BUSINESS' } }),
    prisma.client.upsert({ where: { id: 'bnk-c-001' }, update: {},
      create: { id: 'bnk-c-001', officerId: bankOfficer.id, organisationId: bankOrg.id, name: 'Adaeze Okonkwo', phone: '08033333333', accountNumber: '3012345678' } }),
    prisma.client.upsert({ where: { id: 'ins-c-001' }, update: {},
      create: { id: 'ins-c-001', officerId: insOfficer.id, organisationId: insOrg.id, name: 'Grace Udoh', phone: '08044444444' } }),
  ])

  // ── Transactions + Commissions ────────────────────────────────────────────
  const now = new Date()
  const m = now.getMonth() + 1
  const y = now.getFullYear()

  const txData = [
    { clientId: clients[0].id, productId: cement.id, value: 500000, quantity: 10000, officerId: mfgOfficer1.id, orgId: mfgOrg.id, amount: 500000, confirmedBy: mfgFinance.id },
    { clientId: clients[1].id, productId: steelRod.id, value: 2000000, quantity: null, officerId: mfgOfficer2.id, orgId: mfgOrg.id, amount: 30000, confirmedBy: mfgFinance.id },
    { clientId: clients[2].id, productId: fixedDep.id, value: 5000000, quantity: null, officerId: bankOfficer.id, orgId: bankOrg.id, amount: 25000, confirmedBy: bankAdmin.id },
    { clientId: clients[3].id, productId: lifePolicy.id, value: 240000, quantity: null, officerId: insOfficer.id, orgId: insOrg.id, amount: 24000, confirmedBy: insAdmin.id },
  ]

  for (const t of txData) {
    const existing = await prisma.transaction.findFirst({ where: { clientId: t.clientId, productId: t.productId } })
    if (existing) continue
    const txn = await prisma.transaction.create({
      data: { clientId: t.clientId, productId: t.productId, value: t.value, quantity: t.quantity, confirmedBy: t.confirmedBy },
    })
    await prisma.commission.create({
      data: {
        officerId: t.officerId, transactionId: txn.id, organisationId: t.orgId,
        amount: t.amount, ruleSnapshot: { seeded: true, amount: t.amount },
        status: 'APPROVED', periodMonth: m, periodYear: y,
      },
    })
  }

  // ── Demo Leads ────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.lead.upsert({ where: { id: 'lead-001' }, update: {},
      create: { id: 'lead-001', officerId: mfgOfficer1.id, organisationId: mfgOrg.id, prospectName: 'Chukwu Builders', phone: '08055555551', productInterest: 'Cement — 50kg Bag', estimatedValue: 750000, estimatedUnits: 15000, status: 'NEGOTIATING', source: 'REFERRAL' } }),
    prisma.lead.upsert({ where: { id: 'lead-002' }, update: {},
      create: { id: 'lead-002', officerId: bankOfficer.id, organisationId: bankOrg.id, prospectName: 'Henry Okoro', phone: '08055555552', productInterest: 'SME Loan', estimatedValue: 8000000, status: 'CONTACTED', source: 'COLD_CALL' } }),
    prisma.lead.upsert({ where: { id: 'lead-003' }, update: {},
      create: { id: 'lead-003', officerId: insOfficer.id, organisationId: insOrg.id, prospectName: 'Ifeoma Eze', phone: '08055555553', productInterest: 'Life Insurance Policy', estimatedValue: 180000, status: 'NEW', source: 'REFERRAL' } }),
  ])

  console.log('✅ Transactions, commissions, and leads seeded')
  console.log('\n🎉 Done! Login credentials:\n')
  console.log('Manufacturing org:')
  console.log('  Admin:   admin@mfg-demo.com   / Password123!')
  console.log('  Manager: manager@mfg-demo.com / Password123!')
  console.log('  Finance: finance@mfg-demo.com / Password123!')
  console.log('  Officer: sola@mfg-demo.com    / Password123!\n')
  console.log('Bank org:')
  console.log('  Admin:   admin@bank-demo.com   / Password123!')
  console.log('  Officer: tunde@bank-demo.com   / Password123!\n')
  console.log('Insurance org:')
  console.log('  Admin:   admin@ins-demo.com    / Password123!')
  console.log('  Officer: fatima@ins-demo.com   / Password123!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
