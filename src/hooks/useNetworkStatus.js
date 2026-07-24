import { useState, useEffect } from 'react'

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSlow, setIsSlow] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    let lastPing = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastPing
      setIsSlow(elapsed > 3000)
      lastPing = Date.now()
    }, 3000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  return { isOnline, isSlow }
}