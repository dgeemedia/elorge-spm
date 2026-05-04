// apps/mobile/src/screens/LoginScreen.tsx
import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
  Image,
} from 'react-native'
import { apiClient } from '../lib/api'

interface Props {
  onLoginSuccess: (user: AuthUser) => void
}

export interface AuthUser {
  id:             string
  name:           string
  email:          string
  role:           string
  organisationId: string
  token:          string
}

export function LoginScreen({ onLoginSuccess }: Props) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [error,    setError]    = useState('')

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.post<{ data: AuthUser; token: string }>(
        '/api/auth/login',
        { email: email.trim().toLowerCase(), password }
      )
      // Store token for all future requests
      await apiClient.setToken(res.token)
      onLoginSuccess(res.data)
    } catch (e: any) {
      setError(e.message ?? 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  function handleForgotPassword() {
    Alert.alert(
      'Forgot Password',
      'Please contact your system administrator or use the web portal at your organisation to reset your password.',
      [{ text: 'OK' }]
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header / Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>E</Text>
          </View>
          <Text style={styles.appName}>Elorge SPM</Text>
          <Text style={styles.appTagline}>Sales Performance & Commission Platform</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>
          <Text style={styles.cardSubtitle}>Enter your organisation credentials</Text>

          {/* Error Banner */}
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </View>
          ) : null}

          {/* Email */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(v) => { setEmail(v); setError('') }}
              placeholder="you@yourorganisation.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          {/* Password */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={(v) => { setPassword(v); setError('') }}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPass}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPass((p) => !p)}
              >
                <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotWrap}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.loginBtnText}>Sign In</Text>
            }
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* SSO Button */}
          <TouchableOpacity
            style={styles.ssoBtn}
            onPress={() =>
              Alert.alert(
                'Organisation SSO',
                'To use Windows/Active Directory login, please ask your IT team to configure SSO in the Elorge web portal. You will then be redirected to your organisation\'s Microsoft login page.',
                [{ text: 'Got it' }]
              )
            }
          >
            {/* Microsoft colours */}
            <View style={styles.msIcon}>
              <View style={styles.msSquare1} /><View style={styles.msSquare2} />
              <View style={styles.msSquare3} /><View style={styles.msSquare4} />
            </View>
            <Text style={styles.ssoBtnText}>Sign in with Organisation Account</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          © 2025 Elorge Technologies Limited{'\n'}Lagos, Nigeria
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F0F4F8' },
  scroll:         { flexGrow: 1, justifyContent: 'center', padding: 20, paddingTop: 60, paddingBottom: 40 },

  // Logo
  logoSection:    { alignItems: 'center', marginBottom: 28 },
  logoBox:        { width: 64, height: 64, borderRadius: 18, backgroundColor: '#1A3C6E', justifyContent: 'center', alignItems: 'center', marginBottom: 10, shadowColor: '#1A3C6E', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  logoText:       { color: '#fff', fontSize: 30, fontWeight: '800' },
  appName:        { fontSize: 26, fontWeight: '800', color: '#1A3C6E', letterSpacing: -0.5 },
  appTagline:     { fontSize: 12, color: '#6B7280', marginTop: 4, textAlign: 'center' },

  // Card
  card:           { backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  cardTitle:      { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardSubtitle:   { fontSize: 13, color: '#6B7280', marginBottom: 20 },

  // Error
  errorBanner:    { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText:      { color: '#DC2626', fontSize: 13 },

  // Fields
  fieldWrap:      { marginBottom: 16 },
  label:          { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 7 },
  input:          { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: '#111827', backgroundColor: '#FAFAFA' },
  passwordWrap:   { position: 'relative' },
  passwordInput:  { paddingRight: 44 },
  eyeBtn:         { position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center', paddingHorizontal: 4 },
  eyeIcon:        { fontSize: 16 },

  // Forgot
  forgotWrap:     { alignItems: 'flex-end', marginBottom: 20, marginTop: -8 },
  forgotText:     { fontSize: 12, color: '#1A3C6E', fontWeight: '500' },

  // Login button
  loginBtn:           { backgroundColor: '#1A3C6E', borderRadius: 13, paddingVertical: 15, alignItems: 'center', shadowColor: '#1A3C6E', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  loginBtnDisabled:   { opacity: 0.6 },
  loginBtnText:       { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Divider
  divider:        { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 },
  dividerLine:    { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText:    { fontSize: 12, color: '#9CA3AF' },

  // SSO
  ssoBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1.5, borderColor: '#D1D5DB', borderRadius: 13, paddingVertical: 14, backgroundColor: '#FAFAFA' },
  ssoBtnText:     { fontSize: 14, color: '#374151', fontWeight: '500' },
  msIcon:         { width: 18, height: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 1.5 },
  msSquare1:      { width: 7.5, height: 7.5, backgroundColor: '#F25022' },
  msSquare2:      { width: 7.5, height: 7.5, backgroundColor: '#7FBA00' },
  msSquare3:      { width: 7.5, height: 7.5, backgroundColor: '#00A4EF' },
  msSquare4:      { width: 7.5, height: 7.5, backgroundColor: '#FFB900' },

  // Footer
  footer:         { textAlign: 'center', color: '#9CA3AF', fontSize: 11, marginTop: 28, lineHeight: 18 },
})
