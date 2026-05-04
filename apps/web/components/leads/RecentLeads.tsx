// apps/web/components/leads/RecentLeads.tsx
import { statusColor, formatDate } from '@/lib/utils'

interface Lead {
  id: string; prospectName: string; productInterest: string
  status: string; createdAt: Date; officer: { name: string }
}

export function RecentLeads({ leads }: { leads: Lead[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Recent Leads</h3>
        <a href="/leads" className="text-xs text-[#1A3C6E] hover:underline">View all →</a>
      </div>
      <div className="divide-y divide-gray-50">
        {leads.map((l) => (
          <div key={l.id} className="py-2.5 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{l.prospectName}</p>
              <p className="text-xs text-gray-400">{l.productInterest} · {l.officer.name}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(l.status)}`}>
              {l.status}
            </span>
          </div>
        ))}
        {leads.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">No leads yet</p>
        )}
      </div>
    </div>
  )
}
