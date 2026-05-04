// apps/mobile/src/navigation/AppNavigator.tsx
import React, { useState, useEffect } from 'react'
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator }  from '@react-navigation/native-stack'
import { createBottomTabNavigator }    from '@react-navigation/bottom-tabs'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { LoginScreen, type AuthUser } from '../screens/LoginScreen'
import { HomeScreen }        from '../screens/HomeScreen'
import { LeadsScreen }       from '../screens/LeadsScreen'
import { LogLeadScreen }     from '../screens/LogLeadScreen'
import { MyClientsScreen }   from '../screens/MyClientsScreen'
import { CommissionScreen }  from '../screens/CommissionScreen'
import { ProfileScreen }     from '../screens/ProfileScreen'
import { apiClient }         from '../lib/api'

const Stack = createNativeStackNavigator()
const Tab   = createBottomTabNavigator()

const headerStyle = {
  headerStyle:      { backgroundColor: '#1A3C6E' },
  headerTintColor:  '#fff' as const,
  headerTitleStyle: { fontWeight: '700' as const, fontSize: 16 },
}

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '▦', Leads: '◎', Clients: '★', Commission: '₦', Profile: '◉',
  }
  return (
    <View style={{ alignItems: 'center', paddingTop: 4 }}>
      <Text style={{ fontSize: 18, color: focused ? '#1A3C6E' : '#9CA3AF' }}>
        {icons[label] ?? '•'}
      </Text>
    </View>
  )
}

function LeadsStack() {
  return (
    <Stack.Navigator screenOptions={headerStyle}>
      <Stack.Screen
        name="LeadsList"
        component={LeadsScreen}
        options={({ navigation }: any) => ({
          title: 'My Leads',
          headerRight: () => (
            <TouchableOpacity onPress={() => navigation.navigate('LogLead')} style={{ marginRight: 4 }}>
              <Text style={{ color: '#E8A020', fontWeight: '700', fontSize: 24 }}>+</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="LogLead"
        component={LogLeadScreen}
        options={{ title: 'Log New Lead', presentation: 'modal' }}
      />
    </Stack.Navigator>
  )
}

function MainTabs({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...headerStyle,
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
        tabBarLabel: ({ focused }) => (
          <Text style={{ fontSize: 10, color: focused ? '#1A3C6E' : '#9CA3AF', fontWeight: focused ? '600' : '400', marginBottom: 2 }}>
            {route.name}
          </Text>
        ),
        tabBarStyle: { backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#E5E7EB', height: 64, paddingTop: 4 },
        tabBarActiveTintColor: '#1A3C6E',
        tabBarInactiveTintColor: '#9CA3AF',
      })}
    >
      <Tab.Screen name="Home" options={{ headerTitle: 'Elorge SPM' }}>
        {(props) => <HomeScreen {...props} />}
      </Tab.Screen>

      <Tab.Screen name="Leads" component={LeadsStack} options={{ headerShown: false }} />

      <Tab.Screen name="Clients" component={MyClientsScreen} options={{ headerTitle: 'My Clients' }} />

      <Tab.Screen name="Commission" component={CommissionScreen} options={{ headerTitle: 'My Commission' }} />

      <Tab.Screen name="Profile" options={{ headerTitle: 'My Profile' }}>
        {(props) => <ProfileScreen {...props} user={user} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  )
}

export function AppNavigator() {
  const [user,    setUser]    = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function restore() {
      try {
        const [token, userStr] = await Promise.all([
          AsyncStorage.getItem('elorge_token'),
          AsyncStorage.getItem('elorge_user'),
        ])
        if (token && userStr) {
          await apiClient.setToken(token)
          setUser(JSON.parse(userStr) as AuthUser)
        }
      } catch {
        await AsyncStorage.multiRemove(['elorge_token', 'elorge_user'])
      } finally {
        setLoading(false)
      }
    }
    restore()
  }, [])

  async function handleLoginSuccess(authUser: AuthUser) {
    await AsyncStorage.setItem('elorge_user', JSON.stringify(authUser))
    setUser(authUser)
  }

  async function handleLogout() {
    await AsyncStorage.multiRemove(['elorge_token', 'elorge_user'])
    await apiClient.clearToken()
    setUser(null)
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A3C6E' }}>
        <Text style={{ color: '#fff', fontSize: 32, fontWeight: '800', marginBottom: 24 }}>Elorge</Text>
        <ActivityIndicator size="large" color="#E8A020" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="App">
            {() => <MainTabs user={user} onLogout={handleLogout} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Login">
            {() => <LoginScreen onLoginSuccess={handleLoginSuccess} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
