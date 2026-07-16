import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export function useRealtimeRequests(userId) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [providerId, setProviderId] = useState(null)

  // Step 1: Get provider ID
  useEffect(() => {
    async function getProvider() {
      const { data } = await supabase
        .from('providers')
        .select('id, service_types')
        .eq('user_id', userId)
        .single()

      if (data) setProviderId(data)
    }
    if (userId) getProvider()
  }, [userId])

  // Step 2: Initial fetch + Set up realtime subscription
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
          if (
            providerId.service_types.includes(newRequest.service_type) &&
            newRequest.city === 'Jand' &&
            ['pending', 'parsed', 'contacting'].includes(newRequest.status)
          ) {
            setRequests(prev => [newRequest, ...prev])
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'requests' },
        (payload) => {
          setRequests(prev =>
            prev.map(r => r.id === payload.new.id ? payload.new : r)
          )
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime connected')
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.warn('Realtime disconnected, falling back to polling')
          const interval = setInterval(fetchRequests, 10000)
          return () => clearInterval(interval)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [providerId])

  async function fetchRequests() {
  if (!providerId) return
  setLoading(true)
  try {
    // Get IDs of requests this provider already responded to
    const { data: responded } = await supabase
      .from('provider_responses')
      .select('request_id')
      .eq('provider_id', providerId.id)

    const respondedIds = (responded || []).map(r => r.request_id)

    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .in('service_type', providerId.service_types)
      .eq('city', 'Jand')
      .in('status', ['pending', 'parsed', 'contacting'])
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error
    
    // Filter out already-responded requests
    const filtered = (data || []).filter(r => !respondedIds.includes(r.id))
    setRequests(filtered)
  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}

  return { requests, loading, error, refetch: fetchRequests }
}