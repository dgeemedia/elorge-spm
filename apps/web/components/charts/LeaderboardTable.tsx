// apps/web/components/charts/LeaderboardTable.tsx
import { formatNaira, getInitials } from '@/lib/utils'

interface Officer {
  id:           string
  name:         string
  staffId?:     string | null
  total:        number        // commission amount OR performance score depending on mode
  clientsAdded?: number       // present only in performance mode
  mode:         'commission' | 'performance'
}

export function LeaderboardTable({ officers }: { officers: Officer[] }) {
  const max        = officers[0]?.total || 1
  const isPerfMode = officers[0]?.mode === 'performance'

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Officer Leaderboard</h3>
        <span className="text-xs text-gray-400">
          {isPerfMode ? 'Ranked by performance' : 'This month'}
        </span>
      </div>

      {isPerfMode && (
        <p className="text-xs text-gray-400 mb-3 -mt-1">
          Score = clients onboarded × 10 + products sold
        </p>
      )}

      <div className="space-y-2">
        {officers.map((o, i) => (
          <div key={o.id} className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-4">{i + 1}</span>
            <div className="w-7 h-7 rounded-full bg-[#B5D4F4] flex items-center justify-center text-[#0C447C] text-xs font-semibold flex-shrink-0">
              {getInitials(o.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{o.name}</p>
              <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1A3C6E] rounded-full"
                  style={{ width: `${(o.total / max) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-semibold text-gray-800 min-w-[70px] text-right">
              {isPerfMode
                ? (o.clientsAdded != null ? `${o.clientsAdded} clients` : `${o.total} pts`)
                : formatNaira(o.total)
              }
            </span>
          </div>
        ))}
        {officers.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">
            {isPerfMode ? 'No performance data yet' : 'No commission data yet'}
          </p>
        )}
      </div>
    </div>
  )
}
