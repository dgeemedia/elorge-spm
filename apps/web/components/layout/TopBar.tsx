// apps/web/components/layout/TopBar.tsx
'use client'
import { formatDate } from '@/lib/utils'

export function TopBar({ user }: { user: { name?: string; role?: string } }) {
  const now = new Date()
  return (
    <header className="h-14 bg-white border-b border-gray-100 px-6 flex items-center justify-between flex-shrink-0">
      <div>
        <p className="text-sm font-medium text-gray-800">
          {now.toLocaleString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs bg-[#E6F1FB] text-[#1A3C6E] px-3 py-1 rounded-full font-medium">
          {user.role}
        </span>
        <span className="text-sm text-gray-600">{user.name}</span>
      </div>
    </header>
  )
}
