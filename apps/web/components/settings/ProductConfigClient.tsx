'use client'
// apps/web/components/settings/ProductConfigClient.tsx

import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Tier { minVolume: number; maxVolume: number | null; rate?: number; amountPerUnit?: number }

interface CommissionRule {
  type:          string
  rate?:         number
  amountPerUnit?: number
  tiers?:        Tier[]
  cap?:          number
  floor?:        number
  crossSellBonus?: number
  clawbackWindowDays?: number
  description?:  string
  accelerator?: { startDate: string; endDate: string; multiplier: number }
}

interface Product {
  id:             string
  name:           string
  code:           string
  category:       string
  unit:           string
  description:    string | null
  commissionRule: CommissionRule
  isActive:       boolean
  createdAt:      string
}

interface Org {
  name:                 string
  industry:             string
  compensationModel:    string
  defaultCommissionRate: number | null
}

// ─── Category options by industry ────────────────────────────────────────────
const CATEGORIES: Record<string, string[]> = {
  BANKING:       ['LOAN', 'DEPOSIT', 'INVESTMENT', 'CARD', 'INSURANCE', 'OTHER'],
  INSURANCE:     ['POLICY', 'RENEWAL', 'ENDORSEMENT', 'OTHER'],
  MANUFACTURING: ['GOODS', 'SERVICE', 'OTHER'],
  FMCG:          ['GOODS', 'BUNDLE', 'SERVICE', 'OTHER'],
  REAL_ESTATE:   ['PROPERTY_SALE', 'LEASE', 'REFERRAL', 'OTHER'],
  TELECOMS:      ['SIM', 'DATA_BUNDLE', 'DEVICE', 'SERVICE', 'OTHER'],
  OTHER:         ['PRODUCT', 'SERVICE', 'OTHER'],
}

const UNITS = ['UNIT', 'ACCOUNT', 'POLICY', 'BAG', 'TONNE', 'BUNDLE', 'PROPERTY', 'SUBSCRIPTION', 'DEVICE', 'OTHER']

const RULE_TYPES = [
  { value: 'FLAT_RATE',       label: 'Flat Rate (%)',           desc: 'A fixed percentage of the transaction value. e.g. 0.5% of every loan disbursed.' },
  { value: 'FLAT_PER_UNIT',   label: 'Flat Amount per Unit',    desc: 'A fixed naira amount for each unit sold. e.g. ₦50 per cement bag delivered.' },
  { value: 'TIERED',          label: 'Tiered Rate (%)',          desc: 'The commission % increases as the officer sells more this month. e.g. 0.5% for first 10, 0.75% for 11–25.' },
  { value: 'TIERED_PER_UNIT', label: 'Tiered Amount per Unit',  desc: 'The per-unit amount increases as the officer sells more. e.g. ₦50/unit for first 100, ₦60 for 101+.' },
]

const COMP_MODEL_LABELS: Record<string, string> = {
  COMMISSION_ONLY:          'Commission Only',
  SALARY_PLUS_COMMISSION:   'Salary + Commission',
  RETAINER_PLUS_COMMISSION: 'Retainer + Commission',
}

// ─── Empty product form ───────────────────────────────────────────────────────
const emptyForm = (): Omit<Product, 'id' | 'createdAt' | 'isActive'> => ({
  name: '', code: '', category: '', unit: 'UNIT', description: '',
  commissionRule: { type: 'FLAT_RATE', rate: 0, description: '' },
})

// ─── Main component ───────────────────────────────────────────────────────────
export function ProductConfigClient({ products: initial, org, organisationId }: {
  products: Product[]; org: Org; organisationId: string
}) {
  const [products,   setProducts]   = useState<Product[]>(initial)
  const [showForm,   setShowForm]   = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [form,       setForm]       = useState(emptyForm())
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')

  const categories = CATEGORIES[org.industry] ?? CATEGORIES['OTHER']

  // ── Open create form ────────────────────────────────────────────────────
  function openCreate() {
    setEditProduct(null)
    setForm({ ...emptyForm(), category: categories[0] })
    setShowForm(true)
    setError('')
  }

  // ── Open edit form ──────────────────────────────────────────────────────
  function openEdit(p: Product) {
    setEditProduct(p)
    setForm({
      name: p.name, code: p.code, category: p.category,
      unit: p.unit, description: p.description ?? '',
      commissionRule: { ...p.commissionRule },
    })
    setShowForm(true)
    setError('')
  }

  // ── Save (create or update) ─────────────────────────────────────────────
  async function handleSave() {
    if (!form.name.trim())     return setError('Product name is required')
    if (!form.code.trim())     return setError('Product code is required')
    if (!form.category.trim()) return setError('Category is required')

    setSaving(true)
    setError('')
    try {
      const method = editProduct ? 'PATCH' : 'POST'
      const url    = editProduct
        ? `/api/products/${editProduct.id}`
        : '/api/products'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, organisationId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to save product')
      }

      const saved: Product = (await res.json()).data

      if (editProduct) {
        setProducts((prev) => prev.map((p) => p.id === saved.id ? saved : p))
      } else {
        setProducts((prev) => [...prev, saved])
      }

      setShowForm(false)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Toggle active ───────────────────────────────────────────────────────
  async function toggleActive(p: Product) {
    await fetch(`/api/products/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !p.isActive }),
    })
    setProducts((prev) => prev.map((pr) => pr.id === p.id ? { ...pr, isActive: !pr.isActive } : pr))
  }

  // ── Rule field helpers ──────────────────────────────────────────────────
  function setRule(patch: Partial<CommissionRule>) {
    setForm((f) => ({ ...f, commissionRule: { ...f.commissionRule, ...patch } }))
  }

  function setTier(i: number, patch: Partial<Tier>) {
    const tiers = [...(form.commissionRule.tiers ?? [])]
    tiers[i] = { ...tiers[i], ...patch }
    setRule({ tiers })
  }

  function addTier() {
    const tiers = [...(form.commissionRule.tiers ?? [])]
    const last  = tiers[tiers.length - 1]
    tiers.push({ minVolume: last ? (last.maxVolume ?? 0) + 1 : 0, maxVolume: null, rate: 0 })
    setRule({ tiers })
  }

  function removeTier(i: number) {
    const tiers = [...(form.commissionRule.tiers ?? [])]
    tiers.splice(i, 1)
    setRule({ tiers })
  }

  const ruleType = form.commissionRule.type

  return (
    <div className="space-y-6">

      {/* Org Compensation Model Banner */}
      <div className="bg-[#D6E4F7] border border-[#B5D4F4] rounded-xl px-5 py-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold text-[#1A3C6E] uppercase tracking-wide mb-1">Organisation Compensation Model</p>
            <p className="text-lg font-bold text-[#1A3C6E]">{COMP_MODEL_LABELS[org.compensationModel] ?? org.compensationModel}</p>
            <p className="text-xs text-[#2E5C9E] mt-1">
              {org.compensationModel === 'COMMISSION_ONLY'          && 'Officers earn purely from commission on sales. No base salary tracked in Elorge.'}
              {org.compensationModel === 'SALARY_PLUS_COMMISSION'   && 'Officers have a base salary plus earn commission on sales. Salary is recorded per officer under Team settings.'}
              {org.compensationModel === 'RETAINER_PLUS_COMMISSION' && 'Officers receive a fixed monthly retainer plus earn commission on sales. Retainer is recorded per officer under Team settings.'}
            </p>
          </div>
          {org.defaultCommissionRate && (
            <div className="bg-white border border-[#B5D4F4] rounded-lg px-4 py-3 text-center">
              <p className="text-xs text-gray-500">Default fallback rate</p>
              <p className="text-lg font-bold text-[#1A3C6E]">{(Number(org.defaultCommissionRate) * 100).toFixed(2)}%</p>
              <p className="text-xs text-gray-400">used if no product rule set</p>
            </div>
          )}
        </div>
      </div>

      {/* Product list header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{products.length} product{products.length !== 1 ? 's' : ''} configured</p>
        <button
          onClick={openCreate}
          className="bg-[#1A3C6E] text-white text-sm px-4 py-2 rounded-xl hover:bg-[#2E5C9E] transition-colors"
        >
          + Add Product
        </button>
      </div>

      {/* Product cards */}
      <div className="space-y-3">
        {products.map((p) => (
          <div key={p.id} className={`bg-white rounded-xl border shadow-sm p-5 ${p.isActive ? 'border-gray-100' : 'border-gray-200 opacity-60'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <h3 className="font-semibold text-gray-900">{p.name}</h3>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">{p.code}</span>
                  <span className="text-xs bg-[#E6F1FB] text-[#1A3C6E] px-2 py-0.5 rounded">{p.category}</span>
                  <span className="text-xs bg-[#FAEEDA] text-[#633806] px-2 py-0.5 rounded">per {p.unit}</span>
                  {!p.isActive && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Inactive</span>}
                </div>
                {p.description && <p className="text-xs text-gray-500 mb-2">{p.description}</p>}
                <div className="bg-[#F0F4F8] rounded-lg px-4 py-2.5 inline-block">
                  <p className="text-xs font-semibold text-[#1A3C6E]">Commission Rule</p>
                  <p className="text-sm text-gray-700 mt-0.5">
                    {p.commissionRule.description ?? formatRuleSummary(p.commissionRule)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(p)} className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50">Edit</button>
                <button onClick={() => toggleActive(p)} className={`text-xs border px-3 py-1.5 rounded-lg transition-colors ${p.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                  {p.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        ))}

        {products.length === 0 && (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 py-16 text-center">
            <p className="text-2xl mb-3">📦</p>
            <p className="font-semibold text-gray-700">No products configured yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">Add your first product and set its commission rule.</p>
            <button onClick={openCreate} className="bg-[#1A3C6E] text-white text-sm px-5 py-2.5 rounded-xl hover:bg-[#2E5C9E]">
              + Add First Product
            </button>
          </div>
        )}
      </div>

      {/* ── Form Modal ──────────────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold text-[#1A3C6E]">
                {editProduct ? `Edit: ${editProduct.name}` : 'Add New Product'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="p-6 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
              )}

              {/* Product basics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Product / Service Name *</Label>
                  <Input value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="e.g. Fixed Deposit, Cement 50kg Bag, Life Insurance Policy" />
                </div>
                <div>
                  <Label>Product Code *</Label>
                  <Input value={form.code} onChange={(v) => setForm((f) => ({ ...f, code: v.toUpperCase() }))} placeholder="e.g. FD-001, CEM-001" mono />
                </div>
                <div>
                  <Label>Unit of Sale</Label>
                  <select value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} className={inputCls}>
                    {UNITS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Category</Label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className={inputCls}>
                    {categories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Description (shown to officers)</Label>
                  <Input value={form.description ?? ''} onChange={(v) => setForm((f) => ({ ...f, description: v }))} placeholder="Optional — explain what earns this commission" />
                </div>
              </div>

              {/* Commission rule type selector */}
              <div>
                <Label>Commission Rule Type *</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {RULE_TYPES.map((rt) => (
                    <button
                      key={rt.value}
                      onClick={() => {
                        setRule({ type: rt.value, tiers: rt.value.startsWith('TIERED') ? [{ minVolume: 0, maxVolume: 10, rate: 0.005, amountPerUnit: 50 }] : undefined })
                      }}
                      className={`text-left border rounded-xl p-3 transition-all ${ruleType === rt.value ? 'border-[#1A3C6E] bg-[#E6F1FB]' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <p className={`text-sm font-semibold ${ruleType === rt.value ? 'text-[#1A3C6E]' : 'text-gray-700'}`}>{rt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-tight">{rt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rule-specific fields */}
              <div className="bg-[#F0F4F8] rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-[#1A3C6E] uppercase tracking-wide">Commission Rate Configuration</p>

                {(ruleType === 'FLAT_RATE') && (
                  <div>
                    <Label>Commission Rate (%)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number" step="0.01" min="0" max="100"
                        value={form.commissionRule.rate != null ? (Number(form.commissionRule.rate) * 100).toFixed(3) : ''}
                        onChange={(v) => setRule({ rate: Number(v) / 100 })}
                        placeholder="e.g. 0.500"
                      />
                      <span className="text-gray-500 text-sm">%</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {form.commissionRule.rate ? `₦${(1000000 * Number(form.commissionRule.rate)).toLocaleString()} on a ₦1,000,000 transaction` : ''}
                    </p>
                  </div>
                )}

                {(ruleType === 'FLAT_PER_UNIT') && (
                  <div>
                    <Label>Commission Amount per {form.unit} (₦)</Label>
                    <Input
                      type="number" min="0"
                      value={form.commissionRule.amountPerUnit ?? ''}
                      onChange={(v) => setRule({ amountPerUnit: Number(v) })}
                      placeholder="e.g. 50"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {form.commissionRule.amountPerUnit ? `₦${Number(form.commissionRule.amountPerUnit).toLocaleString()} × quantity sold = total commission` : ''}
                    </p>
                  </div>
                )}

                {(ruleType === 'TIERED' || ruleType === 'TIERED_PER_UNIT') && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-gray-500 px-1">
                      <span>Min Volume</span>
                      <span>Max Volume</span>
                      <span>{ruleType === 'TIERED' ? 'Rate (%)' : 'Amount/Unit (₦)'}</span>
                      <span></span>
                    </div>
                    {(form.commissionRule.tiers ?? []).map((t, i) => (
                      <div key={i} className="grid grid-cols-4 gap-2 items-center">
                        <Input type="number" min="0" value={t.minVolume} onChange={(v) => setTier(i, { minVolume: Number(v) })} />
                        <Input type="number" min="0" value={t.maxVolume ?? ''} onChange={(v) => setTier(i, { maxVolume: v === '' ? null : Number(v) })} placeholder="∞" />
                        <Input
                          type="number" min="0" step={ruleType === 'TIERED' ? '0.001' : '1'}
                          value={ruleType === 'TIERED' ? (t.rate != null ? (t.rate * 100).toFixed(3) : '') : (t.amountPerUnit ?? '')}
                          onChange={(v) => ruleType === 'TIERED' ? setTier(i, { rate: Number(v) / 100 }) : setTier(i, { amountPerUnit: Number(v) })}
                        />
                        <button onClick={() => removeTier(i)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                      </div>
                    ))}
                    <button onClick={addTier} className="text-xs text-[#1A3C6E] hover:underline mt-1">+ Add tier</button>
                  </div>
                )}

                {/* Optional additions */}
                <div className="pt-2 border-t border-gray-200 grid grid-cols-2 gap-3">
                  <div>
                    <Label>Commission Cap (₦) — optional</Label>
                    <Input type="number" min="0" value={form.commissionRule.cap ?? ''} onChange={(v) => setRule({ cap: v ? Number(v) : undefined })} placeholder="No cap" />
                    <p className="text-xs text-gray-400 mt-0.5">Maximum commission per transaction</p>
                  </div>
                  <div>
                    <Label>Minimum Commission (₦) — optional</Label>
                    <Input type="number" min="0" value={form.commissionRule.floor ?? ''} onChange={(v) => setRule({ floor: v ? Number(v) : undefined })} placeholder="No minimum" />
                    <p className="text-xs text-gray-400 mt-0.5">Minimum commission per transaction</p>
                  </div>
                  <div>
                    <Label>Cross-Sell Bonus (₦) — optional</Label>
                    <Input type="number" min="0" value={form.commissionRule.crossSellBonus ?? ''} onChange={(v) => setRule({ crossSellBonus: v ? Number(v) : undefined })} placeholder="e.g. 2000" />
                    <p className="text-xs text-gray-400 mt-0.5">Extra bonus when existing client buys this new product</p>
                  </div>
                  <div>
                    <Label>Clawback Window (days) — optional</Label>
                    <Input type="number" min="0" value={form.commissionRule.clawbackWindowDays ?? ''} onChange={(v) => setRule({ clawbackWindowDays: v ? Number(v) : undefined })} placeholder="e.g. 90" />
                    <p className="text-xs text-gray-400 mt-0.5">Days within which a default reverses commission</p>
                  </div>
                </div>

                {/* Rule description */}
                <div>
                  <Label>Rule Description (shown to officers)</Label>
                  <Input value={form.commissionRule.description ?? ''} onChange={(v) => setRule({ description: v })} placeholder="e.g. 0.5% of deposit value, paid on activation" />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl hover:bg-gray-50 text-sm font-medium">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="flex-1 bg-[#1A3C6E] text-white py-3 rounded-xl hover:bg-[#2E5C9E] text-sm font-semibold disabled:opacity-50 transition-colors">
                  {saving ? 'Saving...' : editProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatRuleSummary(rule: CommissionRule): string {
  switch (rule.type) {
    case 'FLAT_RATE':       return `${((rule.rate ?? 0) * 100).toFixed(2)}% of transaction value`
    case 'FLAT_PER_UNIT':   return `₦${(rule.amountPerUnit ?? 0).toLocaleString()} per unit`
    case 'TIERED':          return `Tiered % — ${rule.tiers?.length ?? 0} tiers`
    case 'TIERED_PER_UNIT': return `Tiered per unit — ${rule.tiers?.length ?? 0} tiers`
    default:                return rule.type
  }
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3C6E] bg-white'

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-gray-600 mb-1">{children}</label>
}

function Input({ value, onChange, placeholder, type = 'text', step, min, max, mono }: {
  value: string | number; onChange: (v: string) => void; placeholder?: string
  type?: string; step?: string; min?: string; max?: string; mono?: boolean
}) {
  return (
    <input
      type={type} step={step} min={min} max={max}
      value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${inputCls} ${mono ? 'font-mono' : ''}`}
    />
  )
}
