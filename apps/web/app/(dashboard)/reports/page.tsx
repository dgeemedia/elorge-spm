// apps/web/app/(dashboard)/reports/page.tsx
import { auth }       from '@/lib/auth'
import { prisma }     from '@/lib/prisma'
import { formatNaira, formatDate } from '@/lib/utils'
import { redirect }   from 'next/navigation'

export default async function ReportsPage() {
  const session = await auth()
  const user    = session!.user as any
  if (!['FINANCE', 'ADMIN', 'MANAGER', 'DIRECTOR'].includes(user.role)) redirect('/overview')

  const now   = new Date()
  const month = now.getMonth() + 1
  const year  = now.getFullYear()

  const summary = await prisma.commission.groupBy({
    by: ['officerId', 'status'],
    where: { organisationId: user.organisationId, periodMonth: month, periodYear: year },
    _sum: { amount: true },
  })

  const officers = await prisma.user.findMany({
    where: { organisationId: user.organisationId, role: 'OFFICER' },
    select: { id: true, name: true, staffId: true, branchId: true },
  })

  const rows = officers.map((o) => {
    const earned = summary.filter((s) => s.officerId === o.id).reduce((t, s) => t + Number(s._sum.amount ?? 0), 0)
    const paid   = summary.filter((s) => s.officerId === o.id && s.status === 'PAID').reduce((t, s) => t + Number(s._sum.amount ?? 0), 0)
    return { ...o, earned, paid }
  }).filter((r) => r.earned > 0).sort((a, b) => b.earned - a.earned)

  const grandTotal = rows.reduce((s, r) => s + r.earned, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A3C6E]">Reports & Payroll Export</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {now.toLocaleString('en-NG', { month: 'long', year: 'numeric' })} · {rows.length} officers with earnings
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-center shadow-sm">
            <p className="text-xs text-gray-500">Total Commission Liability</p>
            <p className="text-xl font-bold text-[#1A3C6E]">{formatNaira(grandTotal)}</p>
          </div>
          <a
            href={`/api/export/payroll?month=${month}&year=${year}`}
            className="bg-[#E8A020] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#c8881a] transition-colors flex items-center gap-2"
          >
            ↓ Export Excel
          </a>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#1A3C6E] text-white">
              <th className="text-left px-4 py-3 text-xs font-medium">Officer</th>
              <th className="text-left px-4 py-3 text-xs font-medium">Staff ID</th>
              <th className="text-left px-4 py-3 text-xs font-medium">Branch</th>
              <th className="text-right px-4 py-3 text-xs font-medium">Earned (₦)</th>
              <th className="text-right px-4 py-3 text-xs font-medium">Paid (₦)</th>
              <th className="text-right px-4 py-3 text-xs font-medium">Pending (₦)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((r, i) => (
              <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{r.staffId ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{r.branchId ?? '—'}</td>
                <td className="px-4 py-3 text-right font-semibold text-[#1A3C6E]">{formatNaira(r.earned)}</td>
                <td className="px-4 py-3 text-right text-green-700">{formatNaira(r.paid)}</td>
                <td className="px-4 py-3 text-right text-amber-700">{formatNaira(r.earned - r.paid)}</td>
              </tr>
            ))}
            <tr className="bg-[#FAEEDA] font-bold">
              <td className="px-4 py-3 text-[#1A3C6E]" colSpan={3}>TOTAL</td>
              <td className="px-4 py-3 text-right text-[#1A3C6E]">{formatNaira(grandTotal)}</td>
              <td className="px-4 py-3 text-right text-green-700">{formatNaira(rows.reduce((s,r)=>s+r.paid,0))}</td>
              <td className="px-4 py-3 text-right text-amber-700">{formatNaira(rows.reduce((s,r)=>s+(r.earned-r.paid),0))}</td>
            </tr>
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="text-center py-12 text-gray-400">No commission data for this period.</div>
        )}
      </div>
    </div>
  )
}
