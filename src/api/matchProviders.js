import { supabase } from '@/lib/supabaseClient'

/**
 * Finds matching providers for a request
 * Filters by city, service_type, approval status
 * Sorts by tier (gold > silver > bronze) then distance
 */
export async function matchProviders(parsedIntent, customerId) {
  const { service_type } = parsedIntent

  // Get customer's location
  const { data: customer } = await supabase
    .from('users')
    .select('city, latitude, longitude')
    .eq('id', customerId)
    .single()

  if (!customer) throw new Error('Customer not found')

  // Find matching providers
  const { data: providers, error } = await supabase
    .from('providers')
    .select(`
      id,
      user_id,
      tier,
      avg_rating,
      service_types,
      user:user_id (
        full_name,
        phone,
        latitude,
        longitude,
        city
      )
    `)
    .eq('is_approved', true)
    .eq('is_online', true)
    .contains('service_types', [service_type])

  if (error) throw error
  if (!providers || providers.length === 0) return []

  // Filter by same city
  const cityProviders = providers.filter(p => p.user?.city === customer.city)

  // Calculate distance and tier score
  const scored = cityProviders.map(p => {
    const distance = calculateDistance(
      customer.latitude || 32.5,
      customer.longitude || 72.5,
      p.user?.latitude || 32.5,
      p.user?.longitude || 72.5
    )

    const tierScore = { gold: 3, silver: 2, bronze: 1 }[p.tier] || 0

    return {
      ...p,
      distance_km: Math.round(distance * 10) / 10,
      tier_score: tierScore
    }
  })

  // Sort: highest tier first, then nearest
  scored.sort((a, b) => {
    if (b.tier_score !== a.tier_score) return b.tier_score - a.tier_score
    return a.distance_km - b.distance_km
  })

  return scored
}

/**
 * Haversine formula — calculates distance between two coordinates in km
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
