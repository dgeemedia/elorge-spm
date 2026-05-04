// apps/mobile/src/screens/HomeScreen.tsx
import React, { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, RefreshControl,
  TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native'
import { apiClient } from '../lib/api'

interface DashboardData {
  // Present for all compensation models
  compensationModel:   string
  activeleads:         number
  totalClients:        number
  rank:                number

  // Commission-based models (COMMISSION_ONLY, SALARY_PLUS_COMMISSION, RETAINER_PLUS_COMMISSION)
  commissionThisMonth?: number

  // SALARY_ONLY specific fields
  clientsThisMonth?:    number   // clients this officer onboarded this month
  productsThisMonth?:   number   // transactions confirmed for this officer's clients this month
  projectedCommission?: number   // what they WOULD earn if incentives were activated
}

export function HomeScreen({ navigation }: any) {
  const [data, setData]             = useState<DashboardData | null>(null)
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    try {
      const res = await apiClient.get<{ data: DashboardData }>('/api/users/me/dashboard')
      setData(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  function formatNaira(n: number) {
    if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000)     return `₦${(n / 1_000).toFixed(0)}K`
    return `₦${n.toLocaleString()}`
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1A3C6E" />
      </View>
    )
  }

  const isSalaryOnly = data?.compensationModel === 'SALARY_ONLY'

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} />}
    >
      {/* ── Header — branches on compensation model ── */}
      {isSalaryOnly ? (
        <View style={styles.header}>
          <Text style={styles.headerLabel}>Your performance this month</Text>
          <View style={styles.perfRow}>
            <View style={styles.perfStat}>
              <Text style={styles.perfValue}>{data?.clientsThisMonth ?? 0}</Text>
              <Text style={styles.perfLabel}>Clients brought in</Text>
            </View>
            <View style={styles.perfDivider} />
            <View style={styles.perfStat}>
              <Text style={styles.perfValue}>{data?.productsThisMonth ?? 0}</Text>
              <Text style={styles.perfLabel}>Products sold</Text>
            </View>
          </View>
          <Text style={styles.headerSub}>
            {data?.rank ? `#${data.rank} in your branch` : 'No rank yet'}
          </Text>

          {/* Projected commission — the hook that makes officers show managers the app */}
          {(data?.projectedCommission ?? 0) > 0 && (
            <View style={styles.projectedBox}>
              <Text style={styles.projectedLabel}>Your projected commission</Text>
              <Text style={styles.projectedValue}>{formatNaira(data!.projectedCommission!)}</Text>
              <Text style={styles.projectedCta}>
                👋 Show this to your manager to activate incentives
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.header}>
          <Text style={styles.headerLabel}>Commission this month</Text>
          <Text style={styles.headerValue}>{formatNaira(data?.commissionThisMonth ?? 0)}</Text>
          <Text style={styles.headerSub}>
            {data?.rank ? `#${data.rank} in your branch` : 'No rank yet'}
          </Text>
        </View>
      )}

      {/* ── Stats Row ── */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{data?.activeleads ?? 0}</Text>
          <Text style={styles.statLabel}>Active Leads</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{data?.totalClients ?? 0}</Text>
          <Text style={styles.statLabel}>My Clients</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>#{data?.rank ?? '—'}</Text>
          <Text style={styles.statLabel}>Branch Rank</Text>
        </View>
      </View>

      {/* ── Quick Actions ── */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('LogLead')}>
          <Text style={styles.primaryBtnText}>+ Log New Lead</Text>
        </TouchableOpacity>
        {!isSalaryOnly && (
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Commissions')}>
            <Text style={styles.secondaryBtnText}>View Commission</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('MyClients')}>
          <Text style={styles.secondaryBtnText}>My Clients</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#F5F5F5' },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Shared header
  header:           { backgroundColor: '#1A3C6E', padding: 24, paddingTop: 48 },
  headerLabel:      { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  headerValue:      { color: '#fff', fontSize: 40, fontWeight: '700', marginTop: 4 },
  headerSub:        { color: '#E8A020', fontSize: 13, marginTop: 4 },

  // Performance mode header additions
  perfRow:          { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 8 },
  perfStat:         { flex: 1, alignItems: 'center' },
  perfDivider:      { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' },
  perfValue:        { color: '#fff', fontSize: 32, fontWeight: '700' },
  perfLabel:        { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },

  // Projected commission callout
  projectedBox:     { backgroundColor: 'rgba(232,160,32,0.15)', borderRadius: 12, padding: 14, marginTop: 16,
                       borderWidth: 1, borderColor: 'rgba(232,160,32,0.4)' },
  projectedLabel:   { color: '#E8A020', fontSize: 11, fontWeight: '600' },
  projectedValue:   { color: '#fff', fontSize: 28, fontWeight: '700', marginTop: 2 },
  projectedCta:     { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 6 },

  // Stats row
  statsRow:         { flexDirection: 'row', gap: 12, padding: 16 },
  statCard:         { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center',
                       borderWidth: 0.5, borderColor: '#E5E7EB' },
  statValue:        { fontSize: 22, fontWeight: '700', color: '#1A3C6E' },
  statLabel:        { fontSize: 11, color: '#9CA3AF', marginTop: 4 },

  // Actions
  sectionTitle:     { fontSize: 13, fontWeight: '600', color: '#6B7280', paddingHorizontal: 16, marginBottom: 8 },
  actionsRow:       { paddingHorizontal: 16, gap: 10, paddingBottom: 32 },
  primaryBtn:       { backgroundColor: '#1A3C6E', borderRadius: 14, padding: 16, alignItems: 'center' },
  primaryBtnText:   { color: '#fff', fontWeight: '600', fontSize: 15 },
  secondaryBtn:     { backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center',
                       borderWidth: 1, borderColor: '#1A3C6E' },
  secondaryBtnText: { color: '#1A3C6E', fontWeight: '600', fontSize: 15 },
})
