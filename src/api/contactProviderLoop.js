import { supabase } from '@/lib/supabaseClient'
import { sendPushNotification } from './sendPushNotification'

const TIMEOUT_MINUTES = 15

/**
 * Contacts providers sequentially until one accepts or all exhausted
 * Runs as a background process triggered after request creation
 */
export async function contactProviderLoop(requestId, matchedProviders) {
  // Update request status
  await supabase
    .from('requests')
    .update({ status: 'contacting' })
    .eq('id', requestId)

  // Log audit
  await supabase
    .from('audit_logs')
    .insert({
      request_id: requestId,
      event_type: 'request_created',
      event_data: { providers_count: matchedProviders.length },
      status_before: 'pending',
      status_after: 'contacting'
    })

  // Contact providers one at a time
  for (let i = 0; i < matchedProviders.length; i++) {
    const provider = matchedProviders[i]
    const contactOrder = i + 1

    // Check if request is already handled (booked or cancelled)
    const { data: currentRequest } = await supabase
      .from('requests')
      .select('status')
      .eq('id', requestId)
      .single()

    if (['confirmed', 'cancelled', 'expired'].includes(currentRequest?.status)) {
      console.log(`Request ${requestId} already resolved. Stopping loop.`)
      return { status: currentRequest.status }
    }

    // Get full request details for the notification
    const { data: request } = await supabase
      .from('requests')
      .select('*, customer:customer_id(full_name, city)')
      .eq('id', requestId)
      .single()

    // Log that we're contacting this provider
    await supabase
      .from('audit_logs')
      .insert({
        request_id: requestId,
        customer_id: request?.customer_id,
        provider_id: provider.id,
        event_type: 'provider_contacted',
        event_data: { contact_order: contactOrder, total_providers: matchedProviders.length },
        status_before: 'contacting',
        status_after: 'contacting'
      })

    // Send push notification to provider
    await sendPushNotification(provider.id, {
      title: `New ${request?.service_type || 'Service'} Request`,
      message: `${request?.customer?.full_name || 'Customer'} needs help in ${request?.customer?.city || 'your area'}`,
      requestId: requestId
    })

    // Update request to show which provider is being contacted
    await supabase
      .from('requests')
      .update({
        provider_count: contactOrder,
        status: 'contacting'
      })
      .eq('id', requestId)

    // Wait for provider response (poll for TIMEOUT_MINUTES)
    const responseReceived = await waitForProviderResponse(requestId, provider.id)

    if (responseReceived) {
      // Check what the response was
      const { data: response } = await supabase
        .from('provider_responses')
        .select('response_type')
        .eq('request_id', requestId)
        .eq('provider_id', provider.id)
        .single()

      if (response?.response_type === 'accepted') {
        return { status: 'confirmed', providerId: provider.id }
      } else if (response?.response_type === 'counter_offer') {
        return { status: 'offered', providerId: provider.id }
      }
      // If declined, continue to next provider
    }

    console.log(`Provider ${provider.id} did not accept. Moving to next.`)
  }

  // All providers exhausted or declined
  await supabase
    .from('requests')
    .update({ status: 'no_provider' })
    .eq('id', requestId)

  // Notify customer
  const { data: request } = await supabase
    .from('requests')
    .select('customer_id')
    .eq('id', requestId)
    .single()

  await supabase
    .from('notifications')
    .insert({
      user_id: request?.customer_id,
      type: 'no_provider_found',
      title: 'No Provider Available',
      message: 'No providers accepted your request. Please try again later.',
      action_url: '/customer/dashboard'
    })

  await supabase
    .from('audit_logs')
    .insert({
      request_id: requestId,
      customer_id: request?.customer_id,
      event_type: 'no_provider_found',
      status_before: 'contacting',
      status_after: 'no_provider'
    })

  return { status: 'no_provider' }
}

/**
 * Polls for provider response with timeout
 */
async function waitForProviderResponse(requestId, providerId) {
  const startTime = Date.now()
  const timeoutMs = TIMEOUT_MINUTES * 60 * 1000
  const pollInterval = 5000 // Check every 5 seconds

  while (Date.now() - startTime < timeoutMs) {
    const { data: response } = await supabase
      .from('provider_responses')
      .select('response_type')
      .eq('request_id', requestId)
      .eq('provider_id', providerId)
      .single()

    if (response) {
      return true
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollInterval))
  }

  return false
}
