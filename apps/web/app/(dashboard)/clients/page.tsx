// apps/web/app/(dashboard)/clients/page.tsx
import { auth }    from '@/lib/auth'
import { prisma }  from '@/lib/prisma'
import { formatDate } from '@/lib/utils'

export default async function ClientsPage() {
  const session = await auth()
  const user    = session!.user as any
  const isOfficer = user.role === 'OFFICER'

  const clients = await prisma.client.findMany({
    where: {
      organisationId: user.organisationId,
      ...(isOfficer ? { officerId: user.userId } : {}),
    },
    include: {
      officer:          { select: { name: true } },
      servicingOfficer: { select: { name: true } },
      transactions: { orderBy: { confirmedAt: 'desc' }, take: 1, include: { product: true } },
    },
    orderBy: { onboardedAt: 'desc' },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A3C6E]">Clients</h1>
          <p className="text-sm text-gray-500 mt-0.5">{clients.length} clients in portfolio</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#1A3C6E] text-white">
              <th className="text-left px-4 py-3 text-xs font-medium">Client</th>
              <th className="text-left px-4 py-3 text-xs font-medium">Phone</th>
              <th className="text-left px-4 py-3 text-xs font-medium">Account No.</th>
              <th className="text-left px-4 py-3 text-xs font-medium">Original Officer</th>
              <th className="text-left px-4 py-3 text-xs font-medium">Last Product</th>
              <th className="text-left px-4 py-3 text-xs font-medium">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium">Onboarded</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {clients.map((c, i) => (
              <tr key={c.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                <td className="px-4 py-3 text-gray-600">{c.phone}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{c.accountNumber ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{c.officer.name}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {c.transactions[0]?.product.name ?? 'None yet'}
                </td>
                <td className="px-4 py-3">
                  {c.isOfficerActive ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Active</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                      {c.remappingType ?? 'Remapped'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(c.onboardedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {clients.length === 0 && (
          <div className="text-center py-12 text-gray-400">No clients yet. Convert a lead to get started.</div>
        )}
      </div>
    </div>
  )
}
