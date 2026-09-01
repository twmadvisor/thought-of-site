import React, { useEffect, useState } from 'react'
import { ActivityIndicator } from 'react-native'
import type { Session } from '@supabase/supabase-js'

import { supabase } from './src/lib/supabase'
import { registerNativePush } from './src/lib/notifications'
import { Center } from './src/components/Common'
import { PhoneAuth, ProfileSetup } from './src/screens/AuthScreens'
import { HomeScreen } from './src/screens/HomeScreen'
import { RequestsScreen } from './src/screens/RequestsScreen'
import { PersonScreen } from './src/screens/PersonScreen'
import type { Person } from './src/api/connections'

type Screen =
  | { name: 'home' }
  | { name: 'requests' }
  | { name: 'person'; person: Person }

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [booting, setBooting] = useState(true)
  const [profileExists, setProfileExists] = useState<boolean | null>(null)
  const [screen, setScreen] = useState<Screen>({ name: 'home' })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setBooting(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (!nextSession) setScreen({ name: 'home' })
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user.id) {
      setProfileExists(null)
      return
    }

    setProfileExists(null)
    supabase
      .from('profiles')
      .select('id')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setProfileExists(!!data))
  }, [session?.user.id])

  useEffect(() => {
    if (!session?.user.id || !profileExists) return
    registerNativePush(session.user.id).catch(() => undefined)
  }, [profileExists, session?.user.id])

  if (booting || (session && profileExists === null)) {
    return <Center><ActivityIndicator color="#111" /></Center>
  }

  if (!session) return <PhoneAuth />

  if (!profileExists) {
    return <ProfileSetup userId={session.user.id} onDone={() => setProfileExists(true)} />
  }

  if (screen.name === 'person') {
    return (
      <PersonScreen
        session={session}
        person={screen.person}
        onBack={() => setScreen({ name: 'home' })}
      />
    )
  }

  if (screen.name === 'requests') {
    return <RequestsScreen onBack={() => setScreen({ name: 'home' })} />
  }

  return (
    <HomeScreen
      session={session}
      onOpenPerson={(person) => setScreen({ name: 'person', person })}
      onOpenRequests={() => setScreen({ name: 'requests' })}
    />
  )
}
