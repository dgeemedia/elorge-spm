// apps/web/app/(dashboard)/leads/page.tsx
import { auth }        from '@/lib/auth'
import { prisma }      from '@/lib/prisma'
import { statusColor, formatDate, formatNaira } from '@/lib/utils'
import Link from 'next/link'

export default async function LeadsPage() {
  const session = await auth()
  const user    = session!.user as any
  const isOfficer = user.role === 'OFFICER'

  const leads = await prisma.lead.findMany({
    where: {
      organisationId: user.organisationId,
      ...(isOfficer ? { officerId: user.userId } : {}),
    },
    include: { officer: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A3C6E]">Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">{leads.length} leads total</p>
        </div>
        <a
          href="/leads/new"
          className="bg-[#1A3C6E] text-white text-sm px-4 py-2 rounded-xl hover:bg-[#2E5C9E] transition-colors"
        >
          + Log Lead
        </a>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#1A3C6E] text-white">
              <th className="text-left px-4 py-3 text-xs font-medium">Prospect</th>
              <th className="text-left px-4 py-3 text-xs font-medium">Product</th>
              <th className="text-left px-4 py-3 text-xs font-medium">Est. Value</th>
              <th className="text-left px-4 py-3 text-xs font-medium">Officer</th>
              <th className="text-left px-4 py-3 text-xs font-medium">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {leads.map((l, i) => (
              <tr key={l.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="px-4 py-3 font-medium text-gray-900">{l.prospectName}</td>
                <td className="px-4 py-3 text-gray-600">{l.productInterest}</td>
                <td className="px-4 py-3 text-gray-600">{l.estimatedValue ? formatNaira(Number(l.estimatedValue)) : '—'}</td>
                <td className="px-4 py-3 text-gray-600">{l.officer.name}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(l.status)}`}>
                    {l.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(l.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {leads.length === 0 && (
          <div className="text-center py-12 text-gray-400">No leads yet. Log your first lead.</div>
        )}
      </div>
    </div>
  )
}
