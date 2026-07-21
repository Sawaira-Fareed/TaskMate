import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export function useRealtimeRequests(userId) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [providerId, setProviderId] = useState(null)

  useEffect(() => {
    async function getProvider() {
      const { data } = await supabase
        .from('providers')
        .select('id, service_types, vehicle_type')
        .eq('user_id', userId)
        .single()

      if (data) setProviderId(data)
    }
    if (userId) getProvider()
  }, [userId])

  useEffect(() => {
    if (!providerId) return
    fetchRequests()

    const channel = supabase
      .channel('requests-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'requests' },
        (payload) => {
          const newRequest = payload.new
          if (newRequest.city === 'Jand' && ['pending', 'parsed', 'contacting'].includes(newRequest.status)) {
            if (isMatchingRequest(newRequest)) {
              setRequests(prev => [newRequest, ...prev])
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'requests' },
        (payload) => {
          setRequests(prev => prev.map(r => r.id === payload.new.id ? payload.new : r))
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime connected')
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.warn('Realtime disconnected, falling back to polling')
          const interval = setInterval(fetchRequests, 5000)
          return () => clearInterval(interval)
        }
      })

    return () => { supabase.removeChannel(channel) }
  }, [providerId])

  function isMatchingRequest(req) {
    if (!providerId) return false
    const hasRide = providerId.service_types.includes('ride') && providerId.vehicle_type
    const hasServices = providerId.service_types.some(s => s !== 'ride')

    if (req.is_ride) {
      return hasRide && req.vehicle_type === providerId.vehicle_type
    } else {
      return hasServices && providerId.service_types.includes(req.service_type)
    }
  }

  async function fetchRequests() {
    if (!providerId) return
    setLoading(true)
    try {
      const { data: responded } = await supabase
        .from('provider_responses')
        .select('request_id')
        .eq('provider_id', providerId.id)

      const respondedIds = (responded || []).map(r => r.request_id)

      const hasRide = providerId.service_types.includes('ride') && providerId.vehicle_type
      const nonRideServices = providerId.service_types.filter(s => s !== 'ride')
      const hasServices = nonRideServices.length > 0

      let allData = []

      // Fetch ride requests
      if (hasRide) {
        const { data: rideData } = await supabase
          .from('requests')
          .select('*')
          .eq('city', 'Jand')
          .eq('is_ride', true)
          .eq('vehicle_type', providerId.vehicle_type)
          .in('status', ['pending', 'parsed', 'contacting'])
          .order('created_at', { ascending: false })
          .limit(20)

        if (rideData) allData = [...allData, ...rideData]
      }

      // Fetch service requests
      if (hasServices) {
        const { data: serviceData } = await supabase
          .from('requests')
          .select('*')
          .eq('city', 'Jand')
          .eq('is_ride', false)
          .in('service_type', nonRideServices)
          .in('status', ['pending', 'parsed', 'contacting'])
          .order('created_at', { ascending: false })
          .limit(20)

        if (serviceData) allData = [...allData, ...serviceData]
      }

      // Sort combined by created_at
      allData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      // Filter out already responded
      const filtered = allData.filter(r => !respondedIds.includes(r.id))
      setRequests(filtered.slice(0, 20))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { requests, loading, error, refetch: fetchRequests }
}