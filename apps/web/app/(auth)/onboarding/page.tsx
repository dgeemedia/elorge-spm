// apps/web/app/(auth)/onboarding/page.tsx
// NEW FILE — multi-step onboarding for new organisations.
// Step 1: How do you compensate your sales team? (compensationModel)
// Step 2: Industry + org name
// Step 3: Done — redirect to /overview
//
// The compensation model question comes FIRST because it determines
// what the entire platform looks like for that org.

'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ── Types ─────────────────────────────────────────────────────────────────────

interface OnboardingState {
  compensationModel: string
  industry:          string
  name:              string
  defaultCommissionRate: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const COMP_OPTIONS = [
  {
    value:   'SALARY_ONLY',
    icon:    '🏦',
    label:   'Salary only — no commission',
    detail:  'Officers are on fixed salary. Elorge tracks who brings which client, who is performing, and shows officers their projected earnings if incentives are ever activated.',
    example: 'Most Nigerian tier-1 banks (First Bank, GTB, Zenith)',
  },
  {
    value:   'SALARY_PLUS_COMMISSION',
    icon:    '💼',
    label:   'Salary + performance bonus or commission',
    detail:  'Officers have a base salary plus earn commission or a discretionary bonus tied to their sales performance. Elorge calculates the commission portion automatically.',
    example: 'Manufacturing, FMCG, tier-2/3 banks with bonus schemes',
  },
  {
    value:   'COMMISSION_ONLY',
    icon:    '💰',
    label:   'Commission only',
    detail:  'Officers earn entirely from commission. No base salary is tracked here. The full commission engine fires automatically on every transaction.',
    example: 'Insurance agents, real estate brokers, telecoms dealers',
  },
  {
    value:   'RETAINER_PLUS_COMMISSION',
    icon:    '🤝',
    label:   'Retainer + commission',
    detail:  'Officers receive a fixed monthly retainer plus earn commission on sales. Retainer amounts are set per officer. Commission calculated automatically.',
    example: 'Senior insurance agents, independent brokers',
  },
]

const INDUSTRIES = [
  { value: 'BANKING',       label: '🏛️  Banking & Finance' },
  { value: 'INSURANCE',     label: '🛡️  Insurance' },
  { value: 'MANUFACTURING', label: '🏭  Manufacturing' },
  { value: 'FMCG',          label: '🛒  FMCG / Consumer Goods' },
  { value: 'REAL_ESTATE',   label: '🏠  Real Estate' },
  { value: 'TELECOMS',      label: '📡  Telecoms' },
  { value: 'LOGISTICS',     label: '🚚  Logistics' },
  { value: 'HEALTHCARE',    label: '🏥  Healthcare' },
  { value: 'EDUCATION',     label: '🎓  Education' },
  { value: 'OTHER',         label: '⚙️  Other' },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const [step,    setStep]    = useState(1) // 1 | 2 | 3
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  const [form, setForm] = useState<OnboardingState>({
    compensationModel:    '',
    industry:             '',
    name:                 '',
    defaultCommissionRate: '',
  })

  const showCommissionRate = ['COMMISSION_ONLY', 'SALARY_PLUS_COMMISSION', 'RETAINER_PLUS_COMMISSION']
    .includes(form.compensationModel)

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleFinish() {
    setSaving(true)
    setError('')
    try {
      const body: Record<string, unknown> = {
        name:             form.name,
        industry:         form.industry,
        compensationModel: form.compensationModel,
      }
      if (form.defaultCommissionRate) {
        body.defaultCommissionRate = Number(form.defaultCommissionRate) / 100
      }

      const res = await fetch('/api/organisations/me', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Save failed')
      router.push('/overview')
    } catch (e: any) {
      setError(e.message)
      setSaving(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-xl p-8">

        {/* Logo + progress */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#1A3C6E]">Elorge SPM</h1>
          <p className="text-sm text-gray-500 mt-1">Let's set up your organisation</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${s <= step ? 'bg-[#1A3C6E]' : 'bg-gray-200'}`} />
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">
            {error}
          </div>
        )}

        {/* ── STEP 1: Compensation model ── */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              How does your organisation compensate its sales team?
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              This determines what your dashboard and your officers' mobile app look like.
              You can change it anytime in Settings.
            </p>
            <div className="space-y-3">
              {COMP_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setForm({ ...form, compensationModel: opt.value })}
                  className={`w-full text-left border rounded-xl p-4 transition-all ${
                    form.compensationModel === opt.value
                      ? 'border-[#1A3C6E] bg-[#E6F1FB]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className={`text-sm font-semibold ${form.compensationModel === opt.value ? 'text-[#1A3C6E]' : 'text-gray-800'}`}>
                    {opt.icon} {opt.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{opt.detail}</p>
                  <p className="text-xs text-gray-400 mt-1 italic">e.g. {opt.example}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!form.compensationModel}
              className="mt-6 w-full bg-[#1A3C6E] text-white py-3 rounded-xl font-semibold hover:bg-[#2E5C9E] transition-colors disabled:opacity-40"
            >
              Continue →
            </button>
          </div>
        )}

        {/* ── STEP 2: Org details ── */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Tell us about your organisation</h2>
            <p className="text-sm text-gray-500 mb-5">
              This helps Elorge use the right labels and defaults for your industry.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Organisation Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. First Bank Nigeria Plc"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3C6E]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Industry</label>
                <select
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3C6E]"
                >
                  <option value="">Select your industry...</option>
                  {INDUSTRIES.map((i) => (
                    <option key={i.value} value={i.value}>{i.label}</option>
                  ))}
                </select>
              </div>

              {/* Default commission rate — only shown for commission-based models */}
              {showCommissionRate && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Default Commission Rate (%) — optional
                  </label>
                  <input
                    type="number" step="0.01" min="0" max="100"
                    value={form.defaultCommissionRate}
                    onChange={(e) => setForm({ ...form, defaultCommissionRate: e.target.value })}
                    placeholder="e.g. 0.500"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3C6E]"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Fallback rate used when a product has no specific commission rule.
                    You can set per-product rules later in Settings → Products.
                  </p>
                </div>
              )}

              {/* SALARY_ONLY: show the projected commission explainer */}
              {form.compensationModel === 'SALARY_ONLY' && (
                <div className="bg-[#FFF8E8] border border-[#E8A020] rounded-xl px-4 py-4">
                  <p className="text-sm font-semibold text-[#92600A] mb-1">💡 About Projected Earnings</p>
                  <p className="text-xs text-[#92600A]">
                    Even without live commission, Elorge will show each officer what they <em>would</em> earn
                    if your organisation activated incentives. This keeps officers motivated and gives you
                    a live picture of what a commission scheme would cost before you commit to one.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:border-gray-300 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!form.name || !form.industry}
                className="flex-1 bg-[#1A3C6E] text-white py-3 rounded-xl font-semibold hover:bg-[#2E5C9E] transition-colors disabled:opacity-40"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Confirmation ── */}
        {step === 3 && (
          <div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#E6F1FB] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900">Ready to launch</h2>
              <p className="text-sm text-gray-500 mt-1">Here's your configuration summary.</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-5 space-y-3 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Organisation</span>
                <span className="font-semibold text-gray-900">{form.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Industry</span>
                <span className="font-semibold text-gray-900">{form.industry}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Compensation</span>
                <span className="font-semibold text-gray-900">
                  {COMP_OPTIONS.find((o) => o.value === form.compensationModel)?.label}
                </span>
              </div>
              {form.defaultCommissionRate && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Default rate</span>
                  <span className="font-semibold text-gray-900">{form.defaultCommissionRate}%</span>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-400 text-center mb-5">
              All settings can be changed in Settings → Organisation at any time.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:border-gray-300 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleFinish}
                disabled={saving}
                className="flex-1 bg-[#1A3C6E] text-white py-3 rounded-xl font-semibold hover:bg-[#2E5C9E] transition-colors disabled:opacity-50"
              >
                {saving ? 'Setting up...' : 'Launch Elorge →'}
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">© 2025 Elorge Technologies Limited</p>
      </div>
    </div>
  )
}
