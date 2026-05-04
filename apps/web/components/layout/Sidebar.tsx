// apps/web/components/layout/Sidebar.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { getInitials } from '@/lib/utils'

const NAV = [
  { href: '/overview',    label: 'Dashboard',   icon: '▦' },
  { href: '/leads',       label: 'Leads',        icon: '◎' },
  { href: '/clients',     label: 'My Clients',   icon: '★' },
  { href: '/commissions', label: 'Commissions',  icon: '₦' },
  { href: '/team',        label: 'Team',         icon: '◈' },
  { href: '/reports',     label: 'Reports',      icon: '≡' },
  { href: '/settings',    label: 'Settings',     icon: '⚙' },
]

export function Sidebar({ user }: { user: { name?: string; email?: string; role?: string } }) {
  const path = usePathname()
  return (
    <aside className="w-52 bg-[#1A3C6E] flex flex-col flex-shrink-0">
      <div className="px-4 py-5 border-b border-white/10">
        <p className="text-white font-semibold text-base">Elorge SPM</p>
        <p className="text-white/40 text-xs mt-0.5">Commission Intelligence</p>
      </div>

      <nav className="flex-1 py-3">
        {NAV.map((item) => {
          const active = path.startsWith(item.href)
          return (
            <Link
              key={item.href} href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-all
                ${active
                  ? 'bg-white/15 text-white border-l-4 border-[#E8A020]'
                  : 'text-white/60 hover:bg-white/8 hover:text-white border-l-4 border-transparent'
                }`}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#B5D4F4] flex items-center justify-center text-[#0C447C] text-xs font-semibold">
            {getInitials(user.name ?? 'U')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user.name}</p>
            <p className="text-white/40 text-xs">{user.role}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full text-xs text-white/40 hover:text-white text-left transition-colors"
        >
          Sign out →
        </button>
      </div>
    </aside>
  )
}
