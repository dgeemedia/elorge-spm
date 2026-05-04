// apps/web/components/ui/MetricCard.tsx
type Accent = 'navy' | 'gold' | 'green' | 'red'

const accentMap: Record<Accent, string> = {
  navy:  'border-t-[#1A3C6E]',
  gold:  'border-t-[#E8A020]',
  green: 'border-t-[#3B6D11]',
  red:   'border-t-[#E24B4A]',
}

export function MetricCard({
  label,
  value,
  accent = 'navy',
  sub,
  badge,
}: {
  label:   string
  value:   string
  accent?: Accent
  sub?:    string
  // Optional badge shown below the value — used for "projected commission" callouts
  // on SALARY_ONLY orgs. Renders in amber to signal it's aspirational, not earned.
  badge?:  string
}) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 border-t-4 ${accentMap[accent]} p-4 shadow-sm`}>
      <p className="text-xs text-gray-500 mb-1.5">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {sub   && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      {badge && (
        <p className="text-xs font-medium text-[#92600A] bg-[#FFF8E8] border border-[#E8A020] rounded-md px-2 py-1 mt-2 inline-block">
          {badge}
        </p>
      )}
    </div>
  )
}
