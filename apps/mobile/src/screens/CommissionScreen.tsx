// apps/mobile/src/screens/CommissionScreen.tsx
import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'
import { apiClient } from '../lib/api'

interface Commission {
  id: string; amount: string; status: string
  createdAt: string
  transaction: { product: { name: string }; client: { name: string }; value: string }
}

export function CommissionScreen() {
  const [data, setData]           = useState<Commission[]>([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    try {
      const res = await apiClient.get<{ data: Commission[]; total: string }>('/api/commissions')
      setData(res.data)
      setTotal(Number(res.total))
    } catch (e) { console.error(e) }
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { load() }, [])

  const statusColors: Record<string, string> = {
    PENDING: '#F59E0B', APPROVED: '#10B981', PAID: '#3B82F6',
    DISPUTED: '#EF4444', CLAWED_BACK: '#9CA3AF',
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1A3C6E" /></View>

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Total earned this month</Text>
        <Text style={styles.headerValue}>
          ₦{total >= 1_000_000 ? `${(total / 1_000_000).toFixed(2)}M` : total.toLocaleString()}
        </Text>
      </View>
      <FlatList
        data={data}
        keyExtractor={(c) => c.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} />}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item: c }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.clientName}>{c.transaction.client.name}</Text>
                <Text style={styles.productName}>{c.transaction.product.name}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.amount}>₦{Number(c.amount).toLocaleString()}</Text>
                <View style={[styles.badge, { backgroundColor: statusColors[c.status] + '22' }]}>
                  <Text style={[styles.badgeText, { color: statusColors[c.status] }]}>{c.status}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.txnValue}>Transaction: ₦{Number(c.transaction.value).toLocaleString()}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.center}><Text style={{ color: '#9CA3AF' }}>No commissions this month</Text></View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F5F5F5' },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  header:      { backgroundColor: '#1A3C6E', padding: 24, paddingTop: 48 },
  headerLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  headerValue: { color: '#fff', fontSize: 36, fontWeight: '700', marginTop: 4 },
  card:        { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 0.5, borderColor: '#E5E7EB' },
  cardTop:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  clientName:  { fontSize: 14, fontWeight: '600', color: '#111827' },
  productName: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  amount:      { fontSize: 16, fontWeight: '700', color: '#1A3C6E' },
  badge:       { marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  badgeText:   { fontSize: 10, fontWeight: '600' },
  txnValue:    { fontSize: 11, color: '#9CA3AF' },
})
