// apps/web/app/(dashboard)/commissions/page.tsx
import { auth }       from '@/lib/auth'
import { prisma }     from '@/lib/prisma'
import { formatNaira, formatNairaFull, statusColor, formatDate } from '@/lib/utils'

export default async function CommissionsPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string }
}) {
  const session = await auth()
  const user    = session!.user as any
  const now     = new Date()
  const month   = Number(searchParams.month ?? now.getMonth() + 1)
  const year    = Number(searchParams.year  ?? now.getFullYear())
  const isOfficer = user.role === 'OFFICER'

  const commissions = await prisma.commission.findMany({
    where: {
      organisationId: user.organisationId,
      periodMonth: month, periodYear: year,
      ...(isOfficer ? { officerId: user.userId } : {}),
    },
    include: {
      officer:     { select: { name: true, staffId: true } },
      transaction: { include: { product: true, client: { select: { name: true } } } },
      dispute: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const total = commissions.reduce((s, c) => s + Number(c.amount), 0)
  const paid  = commissions.filter((c) => c.status === 'PAID').reduce((s, c) => s + Number(c.amount), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A3C6E]">Commissions</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {now.toLocaleString('en-NG', { month: 'long' })} {year}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-center shadow-sm">
            <p className="text-xs text-gray-500">Total Earned</p>
            <p className="text-lg font-bold text-[#1A3C6E]">{formatNaira(total)}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-center shadow-sm">
            <p className="text-xs text-gray-500">Paid Out</p>
            <p className="text-lg font-bold text-green-700">{formatNaira(paid)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#1A3C6E] text-white">
              {!isOfficer && <th className="text-left px-4 py-3 text-xs font-medium">Officer</th>}
              <th className="text-left px-4 py-3 text-xs font-medium">Client</th>
              <th className="text-left px-4 py-3 text-xs font-medium">Product</th>
              <th className="text-left px-4 py-3 text-xs font-medium">Txn Value</th>
              <th className="text-left px-4 py-3 text-xs font-medium">Commission</th>
              <th className="text-left px-4 py-3 text-xs font-medium">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {commissions.map((c, i) => (
              <tr key={c.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                {!isOfficer && <td className="px-4 py-3 text-gray-800 font-medium">{c.officer.name}</td>}
                <td className="px-4 py-3 text-gray-700">{c.transaction.client.name}</td>
                <td className="px-4 py-3 text-gray-600">{c.transaction.product.name}</td>
                <td className="px-4 py-3 text-gray-600">{formatNairaFull(Number(c.transaction.value))}</td>
                <td className="px-4 py-3 font-semibold text-[#1A3C6E]">{formatNairaFull(Number(c.amount))}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(c.status)}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(c.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {commissions.length === 0 && (
          <div className="text-center py-12 text-gray-400">No commissions for this period.</div>
        )}
      </div>
    </div>
  )
}
