import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { supabase } from './supabase'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export async function registerNativePush(userId: string) {
  if (!Device.isDevice) return null

  const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId
  if (!projectId) return null

  const current = await Notifications.getPermissionsAsync()
  let status = current.status
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync()
    status = requested.status
  }
  if (status !== 'granted') return null

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Thoughts',
      importance: Notifications.AndroidImportance.DEFAULT,
    })
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data
  if (!token) return null

  await supabase.from('push_registrations').delete().eq('user_id', userId).eq('provider', 'expo')
  const { error } = await supabase.from('push_registrations').insert({
    user_id: userId,
    provider: 'expo',
    token,
  })
  if (error) throw error
  return token
}
