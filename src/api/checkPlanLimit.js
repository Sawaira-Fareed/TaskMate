import { supabase } from '@/lib/supabaseClient'

/**
 * Checks if a free provider has hit the 4 bookings/week limit
 * Returns { canAccept: boolean, bookingsThisWeek: number, limit: number }
 */
export async function checkPlanLimit(providerId) {
  const { data: provider } = await supabase
    .from('providers')
    .select('plan, weekly_booking_count, week_start_date')
    .eq('id', providerId)
    .single()

  if (!provider) return { canAccept: false, bookingsThisWeek: 0, limit: 4 }

  // PRO users have no limit
  if (provider.plan === 'pro') return { canAccept: true, bookingsThisWeek: provider.weekly_booking_count, limit: Infinity }

  // Reset weekly count if it's a new week
  const now = new Date()
  const weekStart = new Date(provider.week_start_date)
  const daysSinceReset = Math.floor((now - weekStart) / (1000 * 60 * 60 * 24))

  if (daysSinceReset >= 7) {
    await supabase.from('providers').update({
      weekly_booking_count: 0,
      week_start_date: now.toISOString().split('T')[0]
    }).eq('id', providerId)
    return { canAccept: true, bookingsThisWeek: 0, limit: 4 }
  }

  return {
    canAccept: provider.weekly_booking_count < 4,
    bookingsThisWeek: provider.weekly_booking_count,
    limit: 4
  }
}

/**
 * Increment weekly booking count after a provider accepts a request
 */
export async function incrementBookingCount(providerId) {
  const { data: provider } = await supabase
    .from('providers')
    .select('weekly_booking_count')
    .eq('id', providerId)
    .single()

  if (!provider) return

  await supabase.from('providers').update({
    weekly_booking_count: (provider.weekly_booking_count || 0) + 1
  }).eq('id', providerId)
}