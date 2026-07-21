import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function usePushNotifications(userId) {
  const [subscription, setSubscription] = useState(null)
  const [permission, setPermission] = useState('default')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkPermission()
  }, [])

  async function checkPermission() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setPermission('unsupported')
      setLoading(false)
      return
    }
    setPermission(Notification.permission)
    setLoading(false)
  }

  async function subscribe() {
    try {
      setLoading(true)
      const perm = await Notification.requestPermission()
      setPermission(perm)

      if (perm !== 'granted') return false

      const registration = await navigator.serviceWorker.ready
      
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        console.error('VAPID public key not found')
        return false
      }

      const convertedKey = urlBase64ToUint8Array(vapidPublicKey)
      
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      })

      setSubscription(sub)
      const subJson = JSON.parse(JSON.stringify(sub))

      // Save to providers table
      await supabase.from('providers').update({
        push_subscription: subJson
      }).eq('user_id', userId)

      // Save to users table (for customers)
      await supabase.from('users').update({
        push_subscription: subJson
      }).eq('id', userId)

      return true
    } catch (err) {
      console.error('Push subscription failed:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  async function unsubscribe() {
    try {
      if (subscription) {
        await subscription.unsubscribe()
        setSubscription(null)
        await supabase.from('providers').update({ push_subscription: null }).eq('user_id', userId)
        await supabase.from('users').update({ push_subscription: null }).eq('id', userId)
      }
    } catch (err) {
      console.error('Unsubscribe failed:', err)
    }
  }

  async function loadExistingSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.getSubscription()
      if (sub) setSubscription(sub)
    } catch (err) {
      console.error('Load subscription failed:', err)
    }
  }

  useEffect(() => {
    if (permission === 'granted') loadExistingSubscription()
  }, [permission])

  return {
    subscription,
    permission,
    loading,
    subscribe,
    unsubscribe,
    isSubscribed: !!subscription,
    isSupported: permission !== 'unsupported'
  }
}