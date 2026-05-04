// apps/web/app/(dashboard)/settings/organisation/page.tsx
'use client'
import { useState, useEffect } from 'react'

const INDUSTRIES = ['BANKING','INSURANCE','MANUFACTURING','FMCG','REAL_ESTATE','TELECOMS','LOGISTICS','HEALTHCARE','EDUCATION','OTHER']
const COMP_MODELS = [
  {
    value: 'SALARY_ONLY',
    label: 'Salary Only — Performance Intelligence',
    desc:  'Officers are on fixed salary. Elorge tracks client attribution, sales performance, and shows officers their projected earnings. No commission records are created.',
  },
  {
    value: 'COMMISSION_ONLY',
    label: 'Commission Only',
    desc:  'Officers earn purely from commission on sales. No base salary tracked here.',
  },
  {
    value: 'SALARY_PLUS_COMMISSION',
    label: 'Salary + Commission',
    desc:  'Officers have a base salary (set per officer) plus earn commission on sales.',
  },
  {
    value: 'RETAINER_PLUS_COMMISSION',
    label: 'Retainer + Commission',
    desc:  'Officers receive a fixed monthly retainer (set per officer) plus commission.',
  },
]

export default function OrganisationSettingsPage() {
  const [org,     setOrg]     = useState<any>(null)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    fetch('/api/organisations/me').then((r) => r.json()).then((d) => setOrg(d.data))
  }, [])

  async function handleSave() {
    setSaving(true); setError(''); setSaved(false)
    try {
      const res = await fetch('/api/organisations/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(org),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  if (!org) return <div className="text-center py-20 text-gray-400">Loading...</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#1A3C6E]">Organisation Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">Update your organisation settings</p>
      </div>

      {error  && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
      {saved  && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">✓ Changes saved successfully</div>}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Organisation Name</label>
          <input value={org.name ?? ''} onChange={(e) => setOrg({ ...org, name: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3C6E]" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Industry</label>
          <select value={org.industry ?? ''} onChange={(e) => setOrg({ ...org, industry: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3C6E]">
            {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">Compensation Model</label>
          <div className="space-y-2">
            {COMP_MODELS.map((m) => (
              <button key={m.value} onClick={() => setOrg({ ...org, compensationModel: m.value })}
                className={`w-full text-left border rounded-xl p-4 transition-all ${org.compensationModel === m.value ? 'border-[#1A3C6E] bg-[#E6F1FB]' : 'border-gray-200 hover:border-gray-300'}`}>
                <p className={`text-sm font-semibold ${org.compensationModel === m.value ? 'text-[#1A3C6E]' : 'text-gray-700'}`}>{m.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
              </button>
            ))}
          </div>
          {org.compensationModel === 'SALARY_ONLY' && (
            <div className="mt-2 bg-[#FFF8E8] border border-[#E8A020] rounded-lg px-4 py-3 text-xs text-[#92600A]">
              <strong>Salary Only mode is active.</strong> Commission fields are hidden from officer dashboards.
              Officers see client attribution, performance scores, and projected earnings.
              You can switch to a commission model at any time to activate the full engine.
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Default Commission Rate (%) — fallback</label>
          <input type="number" step="0.01" min="0" max="100"
            value={org.defaultCommissionRate != null ? (Number(org.defaultCommissionRate) * 100).toFixed(3) : ''}
            onChange={(e) => setOrg({ ...org, defaultCommissionRate: e.target.value ? Number(e.target.value) / 100 : null })}
            placeholder="e.g. 0.500"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3C6E]" />
          <p className="text-xs text-gray-400 mt-1">Used only if a transaction has no matching product rule. Leave blank to require all products to have explicit rules.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Commission Pay Day</label>
            <input type="number" min="1" max="31" value={org.commissionPayDay ?? ''}
              onChange={(e) => setOrg({ ...org, commissionPayDay: e.target.value ? Number(e.target.value) : null })}
              placeholder="e.g. 25"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3C6E]" />
            <p className="text-xs text-gray-400 mt-1">Day of month commissions are paid</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Require Manager Approval</label>
            <div className="flex items-center gap-3 mt-3">
              <button onClick={() => setOrg({ ...org, requireManagerApproval: !org.requireManagerApproval })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${org.requireManagerApproval ? 'bg-[#1A3C6E]' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${org.requireManagerApproval ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-sm text-gray-600">{org.requireManagerApproval ? 'Required' : 'Not required'}</span>
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full bg-[#1A3C6E] text-white py-3 rounded-xl font-semibold hover:bg-[#2E5C9E] transition-colors disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
