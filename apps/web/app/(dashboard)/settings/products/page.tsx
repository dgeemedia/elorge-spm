// apps/web/app/(dashboard)/settings/products/page.tsx
// Super Admin configures ALL products and commission rules here
// No code changes needed — everything is done through this UI

import { auth }     from '@/lib/auth'
import { prisma }   from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ProductConfigClient } from '@/components/settings/ProductConfigClient'

export default async function ProductsSettingsPage() {
  const session = await auth()
  const user    = session!.user as any
  if (!['ADMIN'].includes(user.role)) redirect('/overview')

  const [products, org] = await Promise.all([
    prisma.product.findMany({
      where:   { organisationId: user.organisationId },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.organisation.findUnique({
      where:  { id: user.organisationId },
      select: { name: true, industry: true, compensationModel: true, defaultCommissionRate: true },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A3C6E]">Products & Commission Rules</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure every product your organisation sells and the commission rule that applies to each.
          Officers earn commission automatically based on these rules the moment a transaction is confirmed.
        </p>
      </div>

      <ProductConfigClient
        products={products as any}
        org={org as any}
        organisationId={user.organisationId}
      />
    </div>
  )
}
