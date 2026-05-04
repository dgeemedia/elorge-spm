// apps/web/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNaira(amount: number | string | null | undefined): string {
  const num = Number(amount ?? 0)
  if (num >= 1_000_000) return `₦${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000)     return `₦${(num / 1_000).toFixed(0)}K`
  return `₦${num.toLocaleString()}`
}

export function formatNairaFull(amount: number | string | null | undefined): string {
  return `₦${Number(amount ?? 0).toLocaleString()}`
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    NEW:         'bg-blue-100 text-blue-800',
    CONTACTED:   'bg-yellow-100 text-yellow-800',
    NEGOTIATING: 'bg-orange-100 text-orange-800',
    CONVERTED:   'bg-green-100 text-green-800',
    LOST:        'bg-gray-100 text-gray-600',
    PENDING:     'bg-yellow-100 text-yellow-800',
    APPROVED:    'bg-green-100 text-green-800',
    PAID:        'bg-blue-100 text-blue-800',
    DISPUTED:    'bg-red-100 text-red-800',
    CLAWED_BACK: 'bg-red-200 text-red-900',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}
