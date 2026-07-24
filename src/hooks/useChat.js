import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { sendPushNotification } from '@/api/sendPushNotification'
export function useChat(bookingId, currentUserId) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!bookingId) return
    loadMessages()
    const interval = setInterval(loadMessages, 2000)
    return () => clearInterval(interval)
  }, [bookingId, currentUserId])

  async function loadMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true })

    if (data) {
      setMessages(data)
      const unread = data.filter(m => m.receiver_id === currentUserId && !m.read_at)
      for (const m of unread) {
        if (!m.delivered_at) await supabase.from('messages').update({ delivered_at: new Date().toISOString() }).eq('id', m.id)
        await supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('id', m.id)
      }
    }
    setLoading(false)
  }
const sendMessage = useCallback(async (text, receiverId) => {
    if (!text.trim() || !bookingId || !currentUserId) return
    const sanitizedText = text.trim().replace(/[<>{}]/g, '')
    setSending(true)
    const { data, error } = await supabase
      .from('messages')
      .insert({
        booking_id: bookingId,
        sender_id: currentUserId,
        receiver_id: receiverId,
        message: sanitizedText,
        is_read: false,
      })
      .select()
      .single()
    if (!error && data) {
      setMessages(prev => [...prev, data])

      const { data: sender } = await supabase.from('users').select('full_name').eq('id', currentUserId).single()
      const { data: receiver } = await supabase.from('users').select('role').eq('id', receiverId).single()
      const chatPath = receiver?.role === 'provider' ? `/provider/chat/${bookingId}` : `/customer/chat/${bookingId}`

     await supabase.from('notifications').insert({
  user_id: receiverId,
  type: 'new_request',
  title: (sender?.full_name || 'Someone').replace(/[<>{}]/g, ''),
  message: sanitizedText.substring(0, 60) + (sanitizedText.length > 60 ? '...' : ''),
  action_url: chatPath
})
      // Send push notification
sendPushNotification(receiverId, {
  title: sender?.full_name || 'Someone',
  message: text.trim().substring(0, 60),
  actionUrl: chatPath
}).catch(() => {}) // fire and forget
    }
    setSending(false)
    return data
  }, [bookingId, currentUserId])

  function getMessageStatus(msg) {
    if (msg.sender_id !== currentUserId) return null
    if (msg.read_at) return { icon: '✓✓', color: 'text-blue-500', label: 'Read' }
    if (msg.delivered_at) return { icon: '✓✓', color: 'text-gray-400', label: 'Delivered' }
    return { icon: '✓', color: 'text-gray-400', label: 'Sent' }
  }

  return { messages, loading, sending, sendMessage, getMessageStatus }
}