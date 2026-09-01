import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Modal, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native'
import type { Session } from '@supabase/supabase-js'
import { ThoughtDots } from '../components/ThoughtDots'
import { AvatarCircle } from '../components/AvatarCircle'
import { Button, Center } from '../components/Common'
import { IncomingRequest, Person, loadIncomingRequests, loadPeople, requestPerson } from '../api/connections'
import { supabase } from '../lib/supabase'
import { styles } from '../theme'

export function HomeScreen({ session, onOpenPerson, onOpenRequests }: { session: Session; onOpenPerson: (person: Person) => void; onOpenRequests: () => void }) {
  const [people, setPeople] = useState<Person[]>([])
  const [incoming, setIncoming] = useState<IncomingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [requesting, setRequesting] = useState(false)
  const [requestMessage, setRequestMessage] = useState('')

  const refresh = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true)
    try {
      const [nextPeople, nextIncoming] = await Promise.all([loadPeople(session.user.id), loadIncomingRequests()])
      setPeople(nextPeople); setIncoming(nextIncoming)
    } catch (e: any) {
      Alert.alert('Could not load thought of', e.message ?? 'Please try again.')
    } finally { setLoading(false) }
  }, [session.user.id])

  useEffect(() => {
    refresh(true)
    const channel = supabase.channel(`people-${session.user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'thoughts' }, () => refresh(false))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, () => refresh(false))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [refresh, session.user.id])

  async function submitRequest() {
    if (!phone.trim()) return
    setRequesting(true); setRequestMessage('')
    try { await requestPerson(phone); setRequestMessage('Request sent.') }
    catch { setRequestMessage('Request sent.') }
    finally { setPhone(''); setRequesting(false) }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.homeTitle}>Your People</Text>
          <View style={styles.headerActions}>
            <Pressable style={styles.requestButton} onPress={onOpenRequests}><Text style={styles.small}>Requests</Text><ThoughtDots filled={incoming.length > 0} /></Pressable>
            <Pressable onPress={() => supabase.auth.signOut()}><Text style={styles.smallMuted}>Sign out</Text></Pressable>
          </View>
        </View>
        {loading ? <Center><ActivityIndicator color="#111" /></Center> : people.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.heading}>Your People is empty</Text>
            <Text style={styles.mutedCentered}>Add someone by phone number. We never import your contacts.</Text>
            <Button label="Add someone" onPress={() => setAddOpen(true)} />
          </View>
        ) : (
          <>
            <ScrollView contentContainerStyle={styles.peopleGrid} showsVerticalScrollIndicator={false}>
              {people.map((person) => {
                const name = person.privateName || person.name
                return (
                  <Pressable key={person.connectionId} style={styles.personTile} onPress={() => onOpenPerson(person)}>
                    <View style={styles.personGraphic}>
                      <View style={styles.avatarPosition}><AvatarCircle name={name} uri={person.avatarUrl} size={78} /></View>
                      <View style={styles.personDots}><ThoughtDots filled={person.unread} /></View>
                    </View>
                    <Text style={styles.personName} numberOfLines={1}>{name}</Text>
                  </Pressable>
                )
              })}
            </ScrollView>
            <Pressable style={styles.addOutline} onPress={() => setAddOpen(true)}><Text style={styles.small}>Add someone</Text></Pressable>
          </>
        )}
        <Modal transparent animationType="slide" visible={addOpen} onRequestClose={() => setAddOpen(false)}>
          <View style={styles.modalBackdrop}><View style={styles.sheet}>
            <Text style={styles.heading}>Add someone</Text>
            <Text style={styles.smallMuted}>Enter their exact phone number.</Text>
            <TextInput value={phone} onChangeText={setPhone} placeholder="Phone number" keyboardType="phone-pad" style={styles.input} />
            <Button label={requesting ? 'Sending…' : 'Send request'} onPress={submitRequest} disabled={requesting} />
            {!!requestMessage && <Text style={styles.notice}>{requestMessage}</Text>}
            <Pressable onPress={() => { setAddOpen(false); setRequestMessage('') }}><Text style={styles.link}>Done</Text></Pressable>
          </View></View>
        </Modal>
      </View>
    </SafeAreaView>
  )
}
