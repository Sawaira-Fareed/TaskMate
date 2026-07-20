import { supabase } from '@/lib/supabaseClient'

export async function getEarnings(providerId) {
  const { data, error } = await supabase
    .from('bookings')
    .select('provider_earnings, scheduled_date, created_at')
    .eq('provider_id', providerId)
    .eq('status', 'completed')

  if (error) return { total: 0, monthly: 0, weekly: 0, jobs: [] }

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const total = (data || []).reduce((sum, b) => sum + (b.provider_earnings || 0), 0)
  const weekly = (data || []).filter(b => new Date(b.created_at) >= weekAgo).reduce((sum, b) => sum + (b.provider_earnings || 0), 0)
  const monthly = (data || []).filter(b => new Date(b.created_at) >= monthAgo).reduce((sum, b) => sum + (b.provider_earnings || 0), 0)

  return { total, weekly, monthly, jobs: data || [] }
}