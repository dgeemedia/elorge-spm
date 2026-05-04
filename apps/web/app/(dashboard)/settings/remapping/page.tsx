// apps/web/app/(dashboard)/settings/remapping/page.tsx
import { auth }       from '@/lib/auth'
import { prisma }     from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { redirect }   from 'next/navigation'

export default async function RemappingPage() {
  const session = await auth()
  const user    = session!.user as any
  if (user.role !== 'ADMIN') redirect('/overview')

  const requests = await prisma.remappingRequest.findMany({
    where: { organisationId: user.organisationId },
    include: {
      fromOfficer:     { select: { name: true, staffId: true } },
      toOfficer:       { select: { name: true } },
      requestedByUser: { select: { name: true } },
    },
    orderBy: { requestedAt: 'desc' },
  })

  const statusColor: Record<string, string> = {
    PENDING:  'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    MODIFIED: 'bg-blue-100 text-blue-800',
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#1A3C6E]">Remapping Requests</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Review and approve staff exit and client remapping requests
        </p>
      </div>

      <div className="space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900">{r.fromOfficer.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[r.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {r.status}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {r.exitType}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-500">
                  <div><span className="font-medium text-gray-700">Staff ID:</span> {r.fromOfficer.staffId ?? '—'}</div>
                  <div><span className="font-medium text-gray-700">Exit Date:</span> {formatDate(r.exitDate)}</div>
                  <div><span className="font-medium text-gray-700">Clients:</span> {r.clientIds.length}</div>
                  <div><span className="font-medium text-gray-700">Remap Type:</span> {r.remapType}</div>
                  <div><span className="font-medium text-gray-700">Servicing Officer:</span> {r.toOfficer?.name ?? 'None (Freeze)'}</div>
                  <div><span className="font-medium text-gray-700">Requested By:</span> {r.requestedByUser.name}</div>
                  <div><span className="font-medium text-gray-700">Requested At:</span> {formatDate(r.requestedAt)}</div>
                </div>
              </div>

              {r.status === 'PENDING' && (
                <div className="flex gap-2 flex-shrink-0">
                  <form action={`/api/remapping/${r.id}/approve`} method="POST">
                    <button className="bg-[#1A3C6E] text-white text-xs px-4 py-2 rounded-lg hover:bg-[#2E5C9E] transition-colors">
                      Approve
                    </button>
                  </form>
                  <form action={`/api/remapping/${r.id}/reject`} method="POST">
                    <button className="border border-red-200 text-red-600 text-xs px-4 py-2 rounded-lg hover:bg-red-50 transition-colors">
                      Reject
                    </button>
                  </form>
                </div>
              )}
            </div>

            {r.reviewNotes && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                <span className="font-medium">Review notes:</span> {r.reviewNotes}
              </div>
            )}
          </div>
        ))}
        {requests.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm text-center py-12 text-gray-400">
            No remapping requests yet.
          </div>
        )}
      </div>
    </div>
  )
}
