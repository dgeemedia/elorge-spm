// apps/web/app/(dashboard)/settings/page.tsx
import { auth }     from '@/lib/auth'
import { prisma }   from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link         from 'next/link'

export default async function SettingsPage() {
  const session = await auth()
  const user    = session!.user as any
  if (!['ADMIN', 'FINANCE', 'MANAGER'].includes(user.role)) redirect('/overview')

  const org = await prisma.organisation.findUnique({
    where:  { id: user.organisationId },
    select: {
      name: true, industry: true, compensationModel: true,
      subscriptionTier: true, ssoEnabled: true, logoUrl: true,
      _count: { select: { users: true, products: true, clients: true } },
    },
  })

  const COMP_LABELS: Record<string, string> = {
    COMMISSION_ONLY:          'Commission Only',
    SALARY_PLUS_COMMISSION:   'Salary + Commission',
    RETAINER_PLUS_COMMISSION: 'Retainer + Commission',
  }

  const tiles = [
    {
      href:  '/settings/products',
      title: 'Products & Commission Rules',
      desc:  'Add, edit, and configure every product your organisation sells and the commission rate that applies.',
      icon:  '📦',
      roles: ['ADMIN'],
      badge: `${org?._count.products ?? 0} products`,
    },
    {
      href:  '/settings/remapping',
      title: 'Remapping Requests',
      desc:  'Review and approve staff exit and client portfolio remapping requests submitted by managers.',
      icon:  '↩',
      roles: ['ADMIN'],
    },
    {
      href:  '/settings/sso',
      title: 'SSO / Windows Login',
      desc:  'Configure Microsoft Azure AD so staff log in with their existing Windows credentials.',
      icon:  '🔐',
      roles: ['ADMIN'],
      badge: org?.ssoEnabled ? 'Enabled' : 'Not configured',
    },
    {
      href:  '/settings/organisation',
      title: 'Organisation Profile',
      desc:  'Update your organisation name, industry, compensation model, and branding.',
      icon:  '🏢',
      roles: ['ADMIN'],
    },
  ].filter((t) => t.roles.includes(user.role))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A3C6E]">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure your organisation on Elorge SPM</p>
      </div>

      {/* Org summary */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><p className="text-xs text-gray-400 mb-0.5">Organisation</p><p className="font-semibold text-gray-800">{org?.name}</p></div>
          <div><p className="text-xs text-gray-400 mb-0.5">Industry</p><p className="font-semibold text-gray-800">{org?.industry}</p></div>
          <div><p className="text-xs text-gray-400 mb-0.5">Compensation Model</p><p className="font-semibold text-gray-800">{COMP_LABELS[org?.compensationModel ?? ''] ?? org?.compensationModel}</p></div>
          <div><p className="text-xs text-gray-400 mb-0.5">Subscription</p><p className="font-semibold text-[#1A3C6E]">{org?.subscriptionTier}</p></div>
          <div><p className="text-xs text-gray-400 mb-0.5">Total Staff</p><p className="font-semibold text-gray-800">{org?._count.users}</p></div>
          <div><p className="text-xs text-gray-400 mb-0.5">Products</p><p className="font-semibold text-gray-800">{org?._count.products}</p></div>
          <div><p className="text-xs text-gray-400 mb-0.5">Total Clients</p><p className="font-semibold text-gray-800">{org?._count.clients}</p></div>
          <div><p className="text-xs text-gray-400 mb-0.5">SSO</p><p className={`font-semibold ${org?.ssoEnabled ? 'text-green-600' : 'text-gray-400'}`}>{org?.ssoEnabled ? 'Enabled' : 'Not configured'}</p></div>
        </div>
      </div>

      {/* Setting tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-[#1A3C6E] hover:shadow-md transition-all group"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{t.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-[#1A3C6E] transition-colors">{t.title}</h3>
                  {t.badge && <span className="text-xs bg-[#E6F1FB] text-[#1A3C6E] px-2 py-0.5 rounded-full">{t.badge}</span>}
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{t.desc}</p>
              </div>
              <span className="text-gray-300 group-hover:text-[#1A3C6E] transition-colors text-lg">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
