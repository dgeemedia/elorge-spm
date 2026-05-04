// apps/mobile/src/screens/LogLeadScreen.tsx
// Products are loaded dynamically from the organisation's configured product list
// No hardcoded banking products — works for any industry

import React, { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native'
import { apiClient } from '../lib/api'

interface Product { id: string; name: string; category: string; unit: string; commissionRule: any }

export function LogLeadScreen({ navigation }: any) {
  const [products,  setProducts]  = useState<Product[]>([])
  const [loadingP,  setLoadingP]  = useState(true)
  const [form, setForm] = useState({
    prospectName:    '',
    phone:           '',
    email:           '',
    company:         '',
    productInterest: '',
    estimatedValue:  '',
    estimatedUnits:  '',
    notes:           '',
    source:          'COLD_CALL',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    apiClient.get<{ data: Product[] }>('/api/products')
      .then((r) => {
        setProducts(r.data)
        if (r.data.length > 0) setForm((f) => ({ ...f, productInterest: r.data[0].name }))
      })
      .catch(console.error)
      .finally(() => setLoadingP(false))
  }, [])

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const selectedProduct = products.find((p) => p.name === form.productInterest)
  const isUnitBased = selectedProduct?.commissionRule?.type === 'FLAT_PER_UNIT' || selectedProduct?.commissionRule?.type === 'TIERED_PER_UNIT'

  async function submit() {
    if (!form.prospectName.trim()) return Alert.alert('Required', 'Prospect name is required')
    if (!form.phone.trim())        return Alert.alert('Required', 'Phone number is required')
    if (!form.productInterest)     return Alert.alert('Required', 'Please select a product')

    setSubmitting(true)
    try {
      await apiClient.post('/api/leads', {
        prospectName:    form.prospectName.trim(),
        phone:           form.phone.trim(),
        email:           form.email.trim() || null,
        company:         form.company.trim() || null,
        productInterest: form.productInterest,
        estimatedValue:  form.estimatedValue  ? Number(form.estimatedValue)  : null,
        estimatedUnits:  form.estimatedUnits  ? Number(form.estimatedUnits)  : null,
        notes:           form.notes.trim()    || null,
        source:          form.source,
      })

      Alert.alert(
        '✅ Lead Logged',
        `${form.prospectName} has been added to your pipeline.`,
        [
          { text: 'Log Another', onPress: () => setForm((f) => ({
            ...f, prospectName: '', phone: '', email: '', company: '',
            estimatedValue: '', estimatedUnits: '', notes: '',
          })) },
          { text: 'View Leads', onPress: () => navigation.navigate('LeadsList') },
        ]
      )
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const SOURCES = ['COLD_CALL', 'REFERRAL', 'WALK_IN', 'SOCIAL_MEDIA', 'OTHER']

  if (loadingP) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#1A3C6E" /></View>
  }

  if (products.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>📦</Text>
        <Text style={styles.emptyTitle}>No products configured</Text>
        <Text style={styles.emptySub}>Your Super Admin needs to add products in Settings before you can log leads.</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        <Text style={styles.title}>Log New Lead</Text>
        <Text style={styles.subtitle}>Enter prospect details</Text>

        {/* Prospect Info */}
        <Field label="Prospect Name *" value={form.prospectName} onChangeText={(v) => update('prospectName', v)} placeholder="Full name" />
        <Field label="Phone Number *"  value={form.phone}         onChangeText={(v) => update('phone', v)}         placeholder="e.g. 08012345678" keyboardType="phone-pad" />
        <Field label="Email (optional)" value={form.email}        onChangeText={(v) => update('email', v)}         placeholder="email@example.com" />
        <Field label="Company / Business (optional)" value={form.company} onChangeText={(v) => update('company', v)} placeholder="e.g. Adekunle Construction Ltd" />

        {/* Product selector — loaded from org config */}
        <Text style={styles.label}>Product / Service of Interest *</Text>
        <View style={styles.productGrid}>
          {products.map((p) => (
            <TouchableOpacity
              key={p.id}
              onPress={() => update('productInterest', p.name)}
              style={[styles.productChip, form.productInterest === p.name && styles.productChipActive]}
            >
              <Text style={[styles.productChipText, form.productInterest === p.name && styles.productChipTextActive]}>
                {p.name}
              </Text>
              <Text style={[styles.productChipUnit, form.productInterest === p.name && styles.productChipUnitActive]}>
                per {p.unit}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Commission rule preview */}
        {selectedProduct && (
          <View style={styles.rulePreview}>
            <Text style={styles.rulePreviewLabel}>Commission rule for this product</Text>
            <Text style={styles.rulePreviewText}>
              {selectedProduct.commissionRule?.description ?? formatRule(selectedProduct.commissionRule)}
            </Text>
          </View>
        )}

        {/* Value / units */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Field label="Estimated Value (₦)" value={form.estimatedValue} onChangeText={(v) => update('estimatedValue', v)} placeholder="e.g. 5000000" keyboardType="numeric" />
          </View>
          {isUnitBased && (
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Field label={`Est. Units (${selectedProduct?.unit})`} value={form.estimatedUnits} onChangeText={(v) => update('estimatedUnits', v)} placeholder="e.g. 1000" keyboardType="numeric" />
            </View>
          )}
        </View>

        {/* Lead source */}
        <Text style={styles.label}>Lead Source</Text>
        <View style={styles.sourceRow}>
          {SOURCES.map((s) => (
            <TouchableOpacity key={s} onPress={() => update('source', s)}
              style={[styles.sourceChip, form.source === s && styles.sourceChipActive]}>
              <Text style={[styles.sourceChipText, form.source === s && styles.sourceChipTextActive]}>
                {s.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Field label="Notes (optional)" value={form.notes} onChangeText={(v) => update('notes', v)} placeholder="Any relevant context..." multiline />

        <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={submit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Log Lead</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

function formatRule(rule: any): string {
  if (!rule) return 'No rule configured'
  switch (rule.type) {
    case 'FLAT_RATE':       return `${((rule.rate ?? 0) * 100).toFixed(2)}% of transaction value`
    case 'FLAT_PER_UNIT':   return `₦${(rule.amountPerUnit ?? 0).toLocaleString()} per unit`
    case 'TIERED':          return `Tiered % based on monthly volume`
    case 'TIERED_PER_UNIT': return `Tiered amount per unit based on volume`
    default:                return rule.type
  }
}

function Field({ label, value, onChangeText, placeholder, keyboardType, multiline }: any) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder}
        keyboardType={keyboardType} multiline={multiline} numberOfLines={multiline ? 3 : 1}
        style={[styles.input, multiline && { height: 72, textAlignVertical: 'top' }]}
        placeholderTextColor="#9CA3AF" />
    </View>
  )
}

const styles = StyleSheet.create({
  container:             { flex: 1, backgroundColor: '#F5F5F5' },
  center:                { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  form:                  { padding: 20, paddingBottom: 40 },
  title:                 { fontSize: 22, fontWeight: '700', color: '#1A3C6E', marginBottom: 4 },
  subtitle:              { fontSize: 13, color: '#6B7280', marginBottom: 20 },
  label:                 { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input:                 { backgroundColor: '#fff', borderWidth: 0.5, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111827' },
  row:                   { flexDirection: 'row' },
  productGrid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  productChip:           { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', alignItems: 'center' },
  productChipActive:     { backgroundColor: '#1A3C6E', borderColor: '#1A3C6E' },
  productChipText:       { fontSize: 12, color: '#374151', fontWeight: '500' },
  productChipTextActive: { color: '#fff' },
  productChipUnit:       { fontSize: 10, color: '#9CA3AF', marginTop: 1 },
  productChipUnitActive: { color: 'rgba(255,255,255,0.6)' },
  rulePreview:           { backgroundColor: '#E6F1FB', borderRadius: 10, padding: 12, marginBottom: 14 },
  rulePreviewLabel:      { fontSize: 10, fontWeight: '600', color: '#1A3C6E', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 },
  rulePreviewText:       { fontSize: 12, color: '#1A3C6E' },
  sourceRow:             { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  sourceChip:            { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  sourceChipActive:      { backgroundColor: '#1A3C6E', borderColor: '#1A3C6E' },
  sourceChipText:        { fontSize: 11, color: '#374151' },
  sourceChipTextActive:  { color: '#fff' },
  submitBtn:             { backgroundColor: '#1A3C6E', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  submitBtnDisabled:     { opacity: 0.6 },
  submitBtnText:         { color: '#fff', fontWeight: '700', fontSize: 16 },
  emptyIcon:             { fontSize: 48, marginBottom: 12 },
  emptyTitle:            { fontSize: 17, fontWeight: '700', color: '#374151', marginBottom: 8 },
  emptySub:              { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
})
