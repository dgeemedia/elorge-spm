// apps/web/app/(dashboard)/team/page.tsx
import { auth }       from '@/lib/auth'
import { prisma }     from '@/lib/prisma'
import { formatNaira, getInitials, formatDate } from '@/lib/utils'

export default async function TeamPage() {
  const session = await auth()
  const user    = session!.user as any
  const now     = new Date()
  const month   = now.getMonth() + 1
  const year    = now.getFullYear()

  const officers = await prisma.user.findMany({
    where: { organisationId: user.organisationId, role: 'OFFICER' },
    include: {
      commissions: {
        where: { periodMonth: month, periodYear: year },
        select: { amount: true, status: true },
      },
      originalClients: { select: { id: true } },
      leads: { where: { status: { notIn: ['CONVERTED', 'LOST'] } }, select: { id: true } },
    },
    orderBy: { name: 'asc' },
  })

  const ranked = officers
    .map((o) => ({
      ...o,
      totalCommission: o.commissions.reduce((s, c) => s + Number(c.amount), 0),
    }))
    .sort((a, b) => b.totalCommission - a.totalCommission)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#1A3C6E]">Team Performance</h1>
        <p className="text-sm text-gray-500 mt-0.5">{officers.length} officers · {now.toLocaleString('en-NG', { month: 'long', year: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {ranked.map((o, i) => (
          <div key={o.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
            <div className="text-lg font-bold text-gray-300 w-6">#{i + 1}</div>
            <div className="w-10 h-10 rounded-full bg-[#B5D4F4] flex items-center justify-center text-[#0C447C] font-semibold flex-shrink-0">
              {getInitials(o.name)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900">{o.name}</p>
                {!o.isActive && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Exited</span>
                )}
              </div>
              <p className="text-xs text-gray-400">{o.staffId ?? 'No staff ID'} · {o.branchId ?? 'No branch'}</p>
            </div>
            <div className="text-center px-4">
              <p className="text-xs text-gray-400">Clients</p>
              <p className="font-bold text-gray-800">{o.originalClients.length}</p>
            </div>
            <div className="text-center px-4">
              <p className="text-xs text-gray-400">Active Leads</p>
              <p className="font-bold text-gray-800">{o.leads.length}</p>
            </div>
            <div className="text-center px-4">
              <p className="text-xs text-gray-400">Commission</p>
              <p className="font-bold text-[#1A3C6E]">{formatNaira(o.totalCommission)}</p>
            </div>
            <div className="flex gap-2">
              <a href={`/team/${o.id}`}
                className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50">
                View
              </a>
              {o.isActive && (user.role === 'MANAGER' || user.role === 'ADMIN') && (
                <a href={`/team/${o.id}/exit`}
                  className="text-xs border border-red-200 px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50">
                  Manage Exit
                </a>
              )}
            </div>
          </div>
        ))}
        {ranked.length === 0 && (
          <div className="text-center py-12 text-gray-400">No officers found.</div>
        )}
      </div>
    </div>
  )
}
