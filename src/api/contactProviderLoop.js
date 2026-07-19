import { supabase } from '@/lib/supabaseClient'
import { sendPushNotification } from './sendPushNotification'

const TIMEOUT_MINUTES_FREE = 15
const TIMEOUT_MINUTES_PRO = 30
const FREE_WEEKLY_LIMIT = 4

export async function contactProviderLoop(requestId, matchedProviders) {
  await supabase.from('requests').update({ status: 'contacting' }).eq('id', requestId)
  await supabase.from('audit_logs').insert({
    request_id: requestId, event_type: 'request_created',
    event_data: { providers_count: matchedProviders.length },
    status_before: 'pending', status_after: 'contacting'
  })

  for (let i = 0; i < matchedProviders.length; i++) {
    const provider = matchedProviders[i]
    const contactOrder = i + 1

    // Check if request already resolved
    const { data: currentRequest } = await supabase.from('requests').select('status').eq('id', requestId).single()
    if (['confirmed', 'cancelled', 'expired'].includes(currentRequest?.status)) {
      console.log(`Request ${requestId} already resolved.`)
      return { status: currentRequest.status }
    }

    // Skip free providers who hit weekly limit
    if (provider.plan !== 'pro') {
      const { data: prov } = await supabase.from('providers').select('weekly_booking_count, week_start_date').eq('id', provider.id).single()
      if (prov) {
        const weekStart = new Date(prov.week_start_date || new Date())
        const now = new Date()
        // Reset weekly count if week has passed
        if ((now - weekStart) > 7 * 24 * 60 * 60 * 1000) {
          await supabase.from('providers').update({ weekly_booking_count: 0, week_start_date: now.toISOString() }).eq('id', provider.id)
        } else if (prov.weekly_booking_count >= FREE_WEEKLY_LIMIT) {
          console.log(`Provider ${provider.id} hit free weekly limit. Skipping.`)
          continue
        }
      }
    }

    const timeoutMinutes = provider.plan === 'pro' ? TIMEOUT_MINUTES_PRO : TIMEOUT_MINUTES_FREE

    const { data: request } = await supabase.from('requests').select('*, customer:customer_id(full_name, city)').eq('id', requestId).single()

    await supabase.from('audit_logs').insert({
      request_id: requestId, customer_id: request?.customer_id, provider_id: provider.id,
      event_type: 'provider_contacted',
      event_data: { contact_order: contactOrder, total_providers: matchedProviders.length },
      status_before: 'contacting', status_after: 'contacting'
    })

    await sendPushNotification(provider.id, {
      title: `New ${request?.service_type || 'Service'} Request`,
      message: `${request?.customer?.full_name || 'Customer'} needs help in ${request?.customer?.city || 'your area'}`,
      requestId: requestId
    })

    await supabase.from('requests').update({ provider_count: contactOrder, status: 'contacting' }).eq('id', requestId)

    const responseReceived = await waitForProviderResponse(requestId, provider.id, timeoutMinutes)

    if (responseReceived) {
      const { data: response } = await supabase.from('provider_responses').select('response_type').eq('request_id', requestId).eq('provider_id', provider.id).single()
      if (response?.response_type === 'accepted') {
        return { status: 'confirmed', providerId: provider.id }
      } else if (response?.response_type === 'counter_offer') {
        return { status: 'offered', providerId: provider.id }
      }
    }
    console.log(`Provider ${provider.id} did not accept. Moving to next.`)
  }

  await supabase.from('requests').update({ status: 'no_provider' }).eq('id', requestId)
  const { data: request } = await supabase.from('requests').select('customer_id').eq('id', requestId).single()
  await supabase.from('notifications').insert({
    user_id: request?.customer_id, type: 'no_provider_found',
    title: 'No Provider Available', message: 'No providers accepted your request. Please try again later.',
    action_url: '/customer/dashboard'
  })
  await supabase.from('audit_logs').insert({ request_id: requestId, customer_id: request?.customer_id, event_type: 'no_provider_found', status_before: 'contacting', status_after: 'no_provider' })
  return { status: 'no_provider' }
}

async function waitForProviderResponse(requestId, providerId, timeoutMinutes) {
  const startTime = Date.now()
  const timeoutMs = timeoutMinutes * 60 * 1000
  const pollInterval = 5000

  while (Date.now() - startTime < timeoutMs) {
    const { data: response } = await supabase.from('provider_responses').select('response_type').eq('request_id', requestId).eq('provider_id', providerId).single()
    if (response) return true
    await new Promise(resolve => setTimeout(resolve, pollInterval))
  }
  return false
}