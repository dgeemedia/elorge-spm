// apps/mobile/src/screens/LeadsScreen.tsx
import React, { useEffect, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl,
  TouchableOpacity, Alert,
} from 'react-native'
import { apiClient } from '../lib/api'

interface Lead {
  id:              string
  prospectName:    string
  phone:           string
  productInterest: string
  estimatedValue:  string | null
  status:          string
  notes:           string | null
  nextFollowUp:    string | null
  createdAt:       string
  officer:         { name: string }
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  NEW:         { bg: '#DBEAFE', text: '#1D4ED8' },
  CONTACTED:   { bg: '#FEF3C7', text: '#B45309' },
  NEGOTIATING: { bg: '#FFEDD5', text: '#C2410C' },
  CONVERTED:   { bg: '#DCFCE7', text: '#15803D' },
  LOST:        { bg: '#F3F4F6', text: '#6B7280' },
}

const STATUS_ORDER = ['NEW', 'CONTACTED', 'NEGOTIATING', 'CONVERTED', 'LOST']

export function LeadsScreen({ navigation }: any) {
  const [leads,      setLeads]      = useState<Lead[]>([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter,     setFilter]     = useState<string | null>(null)

  async function load() {
    try {
      const res = await apiClient.get<{ data: Lead[] }>('/api/leads')
      setLeads(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  async function updateStatus(leadId: string, newStatus: string) {
    try {
      await apiClient.patch(`/api/leads/${leadId}`, { status: newStatus })
      setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status: newStatus } : l))
    } catch (e: any) {
      Alert.alert('Error', e.message)
    }
  }

  function formatNaira(v: string | null) {
    if (!v) return null
    const n = Number(v)
    if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000)     return `₦${(n / 1_000).toFixed(0)}K`
    return `₦${n.toLocaleString()}`
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
  }

  const displayed = filter ? leads.filter((l) => l.status === filter) : leads

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#1A3C6E" /></View>
  }

  return (
    <View style={styles.container}>
      {/* Filter chips */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.chip, !filter && styles.chipActive]}
          onPress={() => setFilter(null)}
        >
          <Text style={[styles.chipText, !filter && styles.chipTextActive]}>All ({leads.length})</Text>
        </TouchableOpacity>
        {STATUS_ORDER.slice(0, 4).map((s) => {
          const count = leads.filter((l) => l.status === s).length
          if (count === 0) return null
          return (
            <TouchableOpacity
              key={s}
              style={[styles.chip, filter === s && styles.chipActive]}
              onPress={() => setFilter(filter === s ? null : s)}
            >
              <Text style={[styles.chipText, filter === s && styles.chipTextActive]}>{s} ({count})</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <FlatList
        data={displayed}
        keyExtractor={(l) => l.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor="#1A3C6E" />
        }
        contentContainerStyle={{ padding: 14, gap: 10 }}
        renderItem={({ item: l }) => {
          const sc = STATUS_COLORS[l.status] ?? { bg: '#F3F4F6', text: '#6B7280' }
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prospectName}>{l.prospectName}</Text>
                  <Text style={styles.productText}>{l.productInterest}</Text>
                </View>
                <View>
                  <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.statusText, { color: sc.text }]}>{l.status}</Text>
                  </View>
                  {l.estimatedValue && (
                    <Text style={styles.valueText}>{formatNaira(l.estimatedValue)}</Text>
                  )}
                </View>
              </View>

              <View style={styles.cardMeta}>
                <Text style={styles.metaText}>📞 {l.phone}</Text>
                {l.nextFollowUp && (
                  <Text style={styles.metaText}>📅 Follow-up: {formatDate(l.nextFollowUp)}</Text>
                )}
                <Text style={styles.metaText}>🗓 Added: {formatDate(l.createdAt)}</Text>
              </View>

              {l.notes && (
                <Text style={styles.notes} numberOfLines={2}>{l.notes}</Text>
              )}

              {/* Quick status update */}
              {l.status !== 'CONVERTED' && l.status !== 'LOST' && (
                <View style={styles.actionRow}>
                  {l.status !== 'CONTACTED' && (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => updateStatus(l.id, 'CONTACTED')}
                    >
                      <Text style={styles.actionBtnText}>Mark Contacted</Text>
                    </TouchableOpacity>
                  )}
                  {l.status === 'CONTACTED' && (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => updateStatus(l.id, 'NEGOTIATING')}
                    >
                      <Text style={styles.actionBtnText}>In Negotiation</Text>
                    </TouchableOpacity>
                  )}
                  {l.status === 'NEGOTIATING' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionBtnSuccess]}
                      onPress={() => updateStatus(l.id, 'CONVERTED')}
                    >
                      <Text style={[styles.actionBtnText, { color: '#15803D' }]}>Mark Converted ✓</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnDanger]}
                    onPress={() => Alert.alert('Mark as Lost?', `Remove ${l.prospectName} from active pipeline?`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Yes, Mark Lost', style: 'destructive', onPress: () => updateStatus(l.id, 'LOST') },
                    ])}
                  >
                    <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>Lost</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>◎</Text>
            <Text style={styles.emptyTitle}>No leads{filter ? ` with status ${filter}` : ' yet'}</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('LogLead')}
            >
              <Text style={styles.emptyBtnText}>Log Your First Lead</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#F5F5F5' },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center' },

  filterRow:        { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB', flexWrap: 'wrap' },
  chip:             { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  chipActive:       { backgroundColor: '#1A3C6E', borderColor: '#1A3C6E' },
  chipText:         { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  chipTextActive:   { color: '#fff' },

  card:             { backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: '#E5E7EB' },
  cardHeader:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  prospectName:     { fontSize: 15, fontWeight: '700', color: '#111827' },
  productText:      { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusBadge:      { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  statusText:       { fontSize: 11, fontWeight: '700' },
  valueText:        { fontSize: 12, fontWeight: '600', color: '#1A3C6E', marginTop: 4, textAlign: 'right' },

  cardMeta:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  metaText:         { fontSize: 11, color: '#6B7280' },
  notes:            { fontSize: 12, color: '#9CA3AF', fontStyle: 'italic', marginBottom: 10 },

  actionRow:        { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn:        { flex: 1, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  actionBtnSuccess: { borderColor: '#86EFAC', backgroundColor: '#F0FDF4' },
  actionBtnDanger:  { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
  actionBtnText:    { fontSize: 12, fontWeight: '600', color: '#374151' },

  emptyState:       { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyIcon:        { fontSize: 48, color: '#D1D5DB', marginBottom: 12 },
  emptyTitle:       { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 16 },
  emptyBtn:         { backgroundColor: '#1A3C6E', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText:     { color: '#fff', fontWeight: '700', fontSize: 14 },
})
