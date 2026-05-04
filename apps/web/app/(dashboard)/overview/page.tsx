// apps/web/app/(dashboard)/overview/page.tsx
import { auth }              from '@/lib/auth'
import { prisma }            from '@/lib/prisma'
import { formatNaira }       from '@/lib/utils'
import { MetricCard }        from '@/components/ui/MetricCard'
import { LeaderboardTable }  from '@/components/charts/LeaderboardTable'
import { RecentLeads }       from '@/components/leads/RecentLeads'

export default async function OverviewPage() {
  const session = await auth()
  const orgId   = (session!.user as any).organisationId
  const now     = new Date()
  const month   = now.getMonth() + 1
  const year    = now.getFullYear()

  // Start / end of current month for date-scoped queries
  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth   = new Date(year, month, 0, 23, 59, 59, 999)

  // Fetch org to determine compensation model — drives all UI labels
  const org = await prisma.organisation.findUniqueOrThrow({
    where: { id: orgId },
    select: { compensationModel: true },
  })

  const isSalaryOnly = org.compensationModel === 'SALARY_ONLY'

  // ── Common queries (all orgs) ──────────────────────────────────────────────
  const [leadCount, convertedCount, disputeCount, recentLeads] = await Promise.all([
    prisma.lead.count({
      where: { organisationId: orgId, status: { notIn: ['CONVERTED', 'LOST'] } },
    }),
    prisma.lead.count({
      where: { organisationId: orgId, status: 'CONVERTED' },
    }),
    prisma.dispute.count({
      where: { commission: { organisationId: orgId }, status: 'OPEN' },
    }),
    prisma.lead.findMany({
      where: { organisationId: orgId },
      include: { officer: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  const conversionRate = (leadCount + convertedCount) > 0
    ? Math.round((convertedCount / (leadCount + convertedCount)) * 100)
    : 0

  // ── Branch-level metric #1 and leaderboard — diverge by comp model ─────────
  let primaryMetricLabel: string
  let primaryMetricValue: string
  let primaryMetricSub: string
  let leaderboard: { id: string; name: string; staffId?: string | null; total: number; clientsAdded?: number; mode: 'commission' | 'performance' }[]

  if (isSalaryOnly) {
    // SALARY_ONLY: primary metric = clients onboarded this month (team total)
    // Leaderboard ranked by clients brought + products sold (not commission)
    const [clientsThisMonth, officers] = await Promise.all([
      prisma.client.count({
        where: { organisationId: orgId, onboardedAt: { gte: startOfMonth, lte: endOfMonth } },
      }),
      prisma.user.findMany({
        where: { organisationId: orgId, role: 'OFFICER', isActive: true },
        include: {
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

    primaryMetricLabel = 'Clients onboarded'
    primaryMetricValue = String(clientsThisMonth)
    primaryMetricSub   = 'this month · team total'

    leaderboard = officers
      .map((o) => {
        const clientsAdded   = o.originalClients.length
        const totalTransactions = o.servicingClients.reduce((sum, c) => sum + c.transactions.length, 0)
        // Score = clients × 10 + transactions (weighted so new client acquisition ranks higher)
        const score = clientsAdded * 10 + totalTransactions
        return { id: o.id, name: o.name, staffId: o.staffId, total: score, clientsAdded, mode: 'performance' as const }
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)

  } else {
    // Commission-based: primary metric = total commission earned this month
    const [commissionAgg, officers] = await Promise.all([
      prisma.commission.aggregate({
        where: { organisationId: orgId, periodMonth: month, periodYear: year },
        _sum: { amount: true },
      }),
      prisma.user.findMany({
        where: { organisationId: orgId, role: 'OFFICER', isActive: true },
        include: {
          commissions: {
            where: { periodMonth: month, periodYear: year },
            select: { amount: true },
          },
        },
      }),
    ])

    const totalCommission = Number(commissionAgg._sum.amount ?? 0)
    primaryMetricLabel = 'Commission earned'
    primaryMetricValue = formatNaira(totalCommission)
    primaryMetricSub   = 'this month · team total'

    leaderboard = officers
      .map((o) => ({
        id: o.id, name: o.name, staffId: o.staffId,
        total: o.commissions.reduce((s, c) => s + Number(c.amount), 0),
        mode: 'commission' as const,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A3C6E]">Branch Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">{now.toLocaleString('en-NG', { month: 'long', year: 'numeric' })}</p>
      </div>

      {/* SALARY_ONLY banner — motivates managers to activate incentives */}
      {isSalaryOnly && (
        <div className="bg-[#FFF8E8] border border-[#E8A020] rounded-xl px-5 py-4 flex items-start gap-3">
          <span className="text-xl mt-0.5">💡</span>
          <div>
            <p className="text-sm font-semibold text-[#92600A]">Performance Intelligence Mode</p>
            <p className="text-xs text-[#92600A] mt-0.5">
              Your organisation is on salary-only compensation. Elorge is tracking client attribution
              and sales performance. Activate commission incentives anytime in{' '}
              <a href="/settings/organisation" className="underline font-medium">Organisation Settings</a>.
            </p>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label={primaryMetricLabel}
          value={primaryMetricValue}
          accent="navy"
          sub={primaryMetricSub}
        />
        <MetricCard label="Active leads"    value={String(leadCount)}       accent="gold"  sub="in pipeline" />
        <MetricCard label="Conversion rate" value={`${conversionRate}%`}    accent="green" sub="leads to clients" />
        {isSalaryOnly
          ? <MetricCard label="Officers active"  value={String(leaderboard.length)} accent="navy" sub="this month" />
          : <MetricCard label="Open disputes"    value={String(disputeCount)}       accent="red"  sub="needs resolution" />
        }
      </div>

      {/* Leaderboard + Recent Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeaderboardTable officers={leaderboard} />
        <RecentLeads leads={recentLeads as any} />
      </div>
    </div>
  )
}
