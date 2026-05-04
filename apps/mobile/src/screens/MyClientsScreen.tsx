// apps/mobile/src/screens/MyClientsScreen.tsx
import React, { useEffect, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native'
import { apiClient } from '../lib/api'

interface Client {
  id:                string
  name:              string
  phone:             string
  accountNumber:     string | null
  isOfficerActive:   boolean
  remappingType:     string | null
  onboardedAt:       string
  officer:           { name: string }
  servicingOfficer:  { name: string } | null
  transactions: {
    id: string
    value: string
    confirmedAt: string
    product: { name: string; category: string }
  }[]
}

export function MyClientsScreen() {
  const [clients,    setClients]    = useState<Client[]>([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expanded,   setExpanded]   = useState<string | null>(null)

  async function load() {
    try {
      const res = await apiClient.get<{ data: Client[] }>('/api/clients')
      setClients(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  function formatNaira(v: string | number) {
    const n = Number(v)
    if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000)     return `₦${(n / 1_000).toFixed(0)}K`
    return `₦${n.toLocaleString()}`
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function getInitials(name: string) {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1A3C6E" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>{clients.length} clients in your portfolio</Text>
      </View>

      <FlatList
        data={clients}
        keyExtractor={(c) => c.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load() }}
            tintColor="#1A3C6E"
          />
        }
        contentContainerStyle={{ padding: 14, gap: 10 }}
        renderItem={({ item: c }) => {
          const isExpanded = expanded === c.id
          const lastTxn    = c.transactions[0]
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => setExpanded(isExpanded ? null : c.id)}
              activeOpacity={0.85}
            >
              {/* Card Top */}
              <View style={styles.cardTop}>
                {/* Avatar */}
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(c.name)}</Text>
                </View>

                {/* Info */}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.clientName}>{c.name}</Text>
                    {!c.isOfficerActive && (
                      <View style={styles.remapBadge}>
                        <Text style={styles.remapBadgeText}>{c.remappingType ?? 'REMAPPED'}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.clientPhone}>{c.phone}</Text>
                  {c.accountNumber && (
                    <Text style={styles.accountNo}>A/C: {c.accountNumber}</Text>
                  )}
                </View>

                {/* Expand arrow */}
                <Text style={styles.arrow}>{isExpanded ? '▲' : '▼'}</Text>
              </View>

              {/* Last transaction preview */}
              {lastTxn && !isExpanded && (
                <View style={styles.lastTxnRow}>
                  <Text style={styles.lastTxnText}>
                    Last: {lastTxn.product.name} · {formatNaira(lastTxn.value)} · {formatDate(lastTxn.confirmedAt)}
                  </Text>
                </View>
              )}

              {/* Expanded detail */}
              {isExpanded && (
                <View style={styles.expandedSection}>
                  <View style={styles.divider} />

                  {/* Attribution info */}
                  <View style={styles.attrRow}>
                    <View style={styles.attrItem}>
                      <Text style={styles.attrLabel}>Original Officer</Text>
                      <Text style={styles.attrValue}>{c.officer.name}</Text>
                    </View>
                    {c.servicingOfficer && (
                      <View style={styles.attrItem}>
                        <Text style={styles.attrLabel}>Servicing Officer</Text>
                        <Text style={styles.attrValue}>{c.servicingOfficer.name}</Text>
                      </View>
                    )}
                    <View style={styles.attrItem}>
                      <Text style={styles.attrLabel}>Onboarded</Text>
                      <Text style={styles.attrValue}>{formatDate(c.onboardedAt)}</Text>
                    </View>
                  </View>

                  {/* Remapping notice */}
                  {!c.isOfficerActive && (
                    <View style={styles.remapNotice}>
                      <Text style={styles.remapNoticeText}>
                        {c.remappingType === 'HYBRID'
                          ? '⚠ Hybrid remapping: Commission only earned on new products you introduce to this client.'
                          : c.remappingType === 'FREEZE'
                          ? '🔒 Portfolio frozen: No commission on future transactions from this client.'
                          : '↩ Full remapping: You earn commission on all future transactions.'}
                      </Text>
                    </View>
                  )}

                  {/* Transaction history */}
                  <Text style={styles.txnHistoryTitle}>Product History ({c.transactions.length})</Text>
                  {c.transactions.length === 0 ? (
                    <Text style={styles.noTxnText}>No products purchased yet</Text>
                  ) : (
                    c.transactions.slice(0, 5).map((t) => (
                      <View key={t.id} style={styles.txnRow}>
                        <View style={styles.txnDot} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.txnProduct}>{t.product.name}</Text>
                          <Text style={styles.txnDate}>{formatDate(t.confirmedAt)}</Text>
                        </View>
                        <Text style={styles.txnValue}>{formatNaira(t.value)}</Text>
                      </View>
                    ))
                  )}
                  {c.transactions.length > 5 && (
                    <Text style={styles.moreText}>+{c.transactions.length - 5} more transactions</Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          )
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>★</Text>
            <Text style={styles.emptyTitle}>No clients yet</Text>
            <Text style={styles.emptySubtitle}>Convert a lead to add your first client to your portfolio</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#F5F5F5' },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center' },

  summaryBar:      { backgroundColor: '#1A3C6E', paddingHorizontal: 16, paddingVertical: 10 },
  summaryText:     { color: 'rgba(255,255,255,0.7)', fontSize: 12 },

  card:            { backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: '#E5E7EB', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardTop:         { flexDirection: 'row', alignItems: 'center' },

  avatar:          { width: 42, height: 42, borderRadius: 21, backgroundColor: '#B5D4F4', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avatarText:      { color: '#0C447C', fontSize: 14, fontWeight: '700' },

  nameRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  clientName:      { fontSize: 15, fontWeight: '700', color: '#111827' },
  clientPhone:     { fontSize: 12, color: '#6B7280', marginTop: 2 },
  accountNo:       { fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace', marginTop: 1 },

  remapBadge:      { backgroundColor: '#FAEEDA', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  remapBadgeText:  { fontSize: 9, color: '#633806', fontWeight: '700' },

  arrow:           { color: '#9CA3AF', fontSize: 11, marginLeft: 8 },

  lastTxnRow:      { marginTop: 8, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: '#F3F4F6' },
  lastTxnText:     { fontSize: 11, color: '#9CA3AF' },

  expandedSection: { marginTop: 4 },
  divider:         { height: 0.5, backgroundColor: '#E5E7EB', marginVertical: 12 },

  attrRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  attrItem:        { minWidth: '40%' },
  attrLabel:       { fontSize: 10, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  attrValue:       { fontSize: 13, color: '#374151', fontWeight: '500', marginTop: 2 },

  remapNotice:     { backgroundColor: '#FAEEDA', borderRadius: 8, padding: 10, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#E8A020' },
  remapNoticeText: { fontSize: 12, color: '#633806', lineHeight: 18 },

  txnHistoryTitle: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  noTxnText:       { fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' },

  txnRow:          { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6' },
  txnDot:          { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1A3C6E', flexShrink: 0 },
  txnProduct:      { fontSize: 13, color: '#374151', fontWeight: '500' },
  txnDate:         { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  txnValue:        { fontSize: 13, fontWeight: '600', color: '#1A3C6E' },
  moreText:        { fontSize: 11, color: '#9CA3AF', marginTop: 6, fontStyle: 'italic' },

  emptyState:      { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyIcon:       { fontSize: 48, color: '#D1D5DB', marginBottom: 12 },
  emptyTitle:      { fontSize: 17, fontWeight: '700', color: '#374151', marginBottom: 6 },
  emptySubtitle:   { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
})
