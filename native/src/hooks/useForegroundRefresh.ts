import { useEffect } from 'react'
import { AppState } from 'react-native'

export function useForegroundRefresh(refresh: () => void | Promise<void>) {
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh()
    })
    return () => sub.remove()
  }, [refresh])
}
