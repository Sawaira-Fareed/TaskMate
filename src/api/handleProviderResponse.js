import { supabase } from '@/lib/supabaseClient'
import { incrementBookingCount } from './checkPlanLimit'

/**
 * Processes provider's response to a request
 * Returns { action: 'booked' | 'next' | 'countered', bookingId? }
 */
export async function handleProviderResponse(requestId, providerId, responseType, proposedTime = null) {
  
  // Prevent duplicate responses
  const { data: existing } = await supabase
    .from('provider_responses')
    .select('id')
    .eq('request_id', requestId)
    .eq('provider_id', providerId)
    .single()

  if (existing) {
    throw new Error('You have already responded to this request')
  }

  // Get request info
  const { data: request, error: requestError } = await supabase
    .from('requests')
    .select('*, customer:customer_id(full_name, phone)')
    .eq('id', requestId)
    .single()

  if (requestError || !request) throw new Error('Request not found')

  // Record the response
  const { error: responseError } = await supabase
    .from('provider_responses')
    .insert({
      request_id: requestId,
      provider_id: providerId,
      response_type: responseType,
      proposed_time: proposedTime,
      contact_order: request.provider_count + 1,
      responded_at: new Date().toISOString()
    })

  if (responseError) throw responseError

  // Update provider count on request
  await supabase
    .from('requests')
    .update({ provider_count: request.provider_count + 1 })
    .eq('id', requestId)

  // Handle based on response type
  if (responseType === 'accepted') {
    return await handleAcceptance(requestId, providerId, request)
  } else if (responseType === 'declined') {
    return await handleDecline(requestId, providerId, request)
  } else if (responseType === 'counter_offer') {
    return await handleCounterOffer(requestId, providerId, proposedTime, request)
  }
}

async function handleAcceptance(requestId, providerId, request) {
  // Create booking
  const scheduledTime = request.negotiated_time || request.preferred_time

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      request_id: requestId,
      provider_id: providerId,
      customer_id: request.customer_id,
      service_type: request.service_type,
      scheduled_date: request.preferred_date,
      scheduled_time: scheduledTime,
      status: 'confirmed'
    })
    .select()
    .single()

  if (error) throw error
  // After booking created, increment weekly count
await incrementBookingCount(providerId)

  // Update request status
  await supabase
    .from('requests')
    .update({ status: 'confirmed' })
    .eq('id', requestId)

  // Notify customer
  await supabase
    .from('notifications')
    .insert({
      user_id: request.customer_id,
      type: 'booking_confirmed',
      title: 'Booking Confirmed',
      message: `Provider confirmed for ${request.preferred_date} at ${scheduledTime}`,
      action_url: `/customer/bookings`
    })

  // Log audit
  await supabase
    .from('audit_logs')
    .insert({
      request_id: requestId,
      customer_id: request.customer_id,
      provider_id: providerId,
      event_type: 'booking_created',
      event_data: { booking_id: booking.id },
      status_before: request.status,
      status_after: 'confirmed'
    })

  return { action: 'booked', bookingId: booking.id }
}

async function handleDecline(requestId, providerId, request) {
  // Log audit
  await supabase
    .from('audit_logs')
    .insert({
      request_id: requestId,
      customer_id: request.customer_id,
      provider_id: providerId,
      event_type: 'provider_declined',
      status_before: request.status,
      status_after: request.status
    })

  return { action: 'next' }
}

async function handleCounterOffer(requestId, providerId, proposedTime, request) {
  // Update request with negotiated time
  await supabase
    .from('requests')
    .update({
      negotiated_time: proposedTime,
      status: 'offered'
    })
    .eq('id', requestId)

  // Notify customer
  await supabase
    .from('notifications')
    .insert({
      user_id: request.customer_id,
      type: 'counter_offer',
      title: 'New Time Proposed',
      message: `Provider suggests ${proposedTime} instead of ${request.preferred_time}`,
      action_url: `/customer/request/${requestId}`
    })

  // Log audit
  await supabase
    .from('audit_logs')
    .insert({
      request_id: requestId,
      customer_id: request.customer_id,
      provider_id: providerId,
      event_type: 'counter_offered',
      status_before: request.status,
      status_after: 'offered'
    })

  return { action: 'countered' }
}
