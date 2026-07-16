import { supabase } from '@/lib/supabaseClient'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

/**
 * Sends a push notification to a provider via Web Push API
 * Provider must have push_subscription stored in providers table
 */
export async function sendPushNotification(providerId, { title, message, requestId }) {
  try {
    // Get provider's push subscription
    const { data: provider, error } = await supabase
      .from('providers')
      .select('push_subscription, user_id')
      .eq('id', providerId)
      .single()

    if (error || !provider?.push_subscription) {
      console.warn(`No push subscription for provider ${providerId}`)
      return false
    }

    const subscription = provider.push_subscription

    // Send push via Web Push API
    await fetch('/api/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription,
        payload: {
          title: title || 'Zaria - New Request',
          message: message || 'You have a new service request',
          data: {
            requestId,
            url: `/provider/request/${requestId}`
          }
        }
      })
    })

    // Also save to notifications table as fallback
    await supabase
      .from('notifications')
      .insert({
        user_id: provider.user_id,
        type: 'new_request',
        title: title || 'New Request',
        message: message || 'You have a new service request',
        action_url: `/provider/request/${requestId}`
      })

    return true
  } catch (err) {
    console.error('Push notification failed:', err.message)
    return false
  }
}
