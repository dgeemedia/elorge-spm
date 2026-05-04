// apps/mobile/src/screens/ProfileScreen.tsx
import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ScrollView, Switch,
} from 'react-native'
import { apiClient } from '../lib/api'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface Props {
  user: {
    id: string; name: string; email: string
    role: string; staffId?: string; branchId?: string
  }
  onLogout: () => void
}

export function ProfileScreen({ user, onLogout }: Props) {
  const [notificationsOn, setNotificationsOn] = useState(true)

  function getInitials(name: string) {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  function handleLogout() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of Elorge SPM?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await apiClient.clearToken()
            await AsyncStorage.multiRemove(['elorge_token', 'elorge_user'])
            onLogout()
          },
        },
      ]
    )
  }

  const roleLabel: Record<string, string> = {
    OFFICER:  'Sales Officer',
    MANAGER:  'Branch Manager',
    DIRECTOR: 'Regional Director',
    FINANCE:  'Finance Officer',
    ADMIN:    'Super Administrator',
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{roleLabel[user.role] ?? user.role}</Text>
        </View>
      </View>

      {/* Details Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Details</Text>
        <Row label="Email"    value={user.email} />
        <Row label="Staff ID" value={user.staffId ?? '—'} />
        <Row label="Branch"   value={user.branchId ?? '—'} />
        <Row label="Role"     value={roleLabel[user.role] ?? user.role} />
      </View>

      {/* Preferences */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Preferences</Text>
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Commission Notifications</Text>
            <Text style={styles.switchSub}>Alert when commission is confirmed</Text>
          </View>
          <Switch
            value={notificationsOn}
            onValueChange={setNotificationsOn}
            trackColor={{ false: '#D1D5DB', true: '#1A3C6E' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* App Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>About</Text>
        <Row label="App"     value="Elorge SPM" />
        <Row label="Version" value="1.0.0" />
        <Row label="Built by" value="Elorge Technologies Limited" />
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>© 2025 Elorge Technologies Limited · Lagos, Nigeria</Text>
    </ScrollView>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#F5F5F5' },
  content:       { padding: 16, paddingBottom: 40 },

  avatarSection: { alignItems: 'center', paddingVertical: 28 },
  avatar:        { width: 72, height: 72, borderRadius: 36, backgroundColor: '#1A3C6E', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText:    { color: '#fff', fontSize: 26, fontWeight: '800' },
  userName:      { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  roleBadge:     { backgroundColor: '#E6F1FB', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  roleText:      { color: '#1A3C6E', fontSize: 12, fontWeight: '600' },

  card:          { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 0.5, borderColor: '#E5E7EB' },
  cardTitle:     { fontSize: 11, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },

  row:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6' },
  rowLabel:      { fontSize: 13, color: '#6B7280' },
  rowValue:      { fontSize: 13, color: '#111827', fontWeight: '500', maxWidth: '60%', textAlign: 'right' },

  switchRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel:   { fontSize: 13, color: '#111827', fontWeight: '500' },
  switchSub:     { fontSize: 11, color: '#9CA3AF', marginTop: 2 },

  logoutBtn:     { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4, marginBottom: 16 },
  logoutText:    { color: '#DC2626', fontWeight: '700', fontSize: 15 },

  footer:        { textAlign: 'center', color: '#9CA3AF', fontSize: 11 },
})
