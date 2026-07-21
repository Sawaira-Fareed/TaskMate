import { supabase } from '@/lib/supabaseClient'

export async function sendPushNotification(userId, { title, message, actionUrl }) {
  try {
    if (!userId) return false

    // Get user's push subscription
    const { data: user } = await supabase
      .from('users')
      .select('push_subscription')
      .eq('id', userId)
      .single()

    if (!user?.push_subscription) return false

    // Also check providers table
    const { data: provider } = await supabase
      .from('providers')
      .select('push_subscription')
      .eq('user_id', userId)
      .single()

    const subscription = user.push_subscription || provider?.push_subscription
    if (!subscription) return false

    // If service worker is ready, show notification directly
    if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
      const registration = await navigator.serviceWorker.ready
      await registration.showNotification(title || 'Zaria', {
        body: message || '',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        vibrate: [200, 100, 200],
        data: { url: actionUrl || '/' },
        requireInteraction: true,
        tag: `zaria-${Date.now()}`
      })
    }

    return true
  } catch (err) {
    console.error('Push notification failed:', err)
    return false
  }
}