import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Check, CheckCheck } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { getCurrentUser } from '@/lib/auth'
import { useChat } from '@/hooks/useChat'

export default function ProviderChat() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [currentUser, setCurrentUser] = useState(null)
  const [booking, setBooking] = useState(null)
  const [text, setText] = useState('')
  const [pageLoading, setPageLoading] = useState(true)

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  useEffect(() => {
    async function init() {
      const user = await getCurrentUser()
      setCurrentUser(user)

      const { data: bkg } = await supabase
        .from('bookings')
        .select('*, customer:customer_id(full_name), provider:provider_id(user_id, user:user_id(full_name))')
        .eq('id', bookingId)
        .single()
      setBooking(bkg)
      setPageLoading(false)
    }
    init()
  }, [bookingId])

  const { messages, loading, sending, sendMessage, getMessageStatus } = useChat(bookingId, currentUser?.id)

  const receiverId = booking?.customer_id
  const customerName = booking?.customer?.full_name || 'Customer'

  async function handleSend() {
    if (!text.trim()) return
    const result = await sendMessage(text, receiverId)
    if (result) setText('')
  }

  if (pageLoading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-gray-400"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{customerName}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">{booking?.service_type}</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20"><p className="text-sm text-gray-500">{t('No messages yet.', 'ابھی تک کوئی پیغام نہیں۔')}</p></div>
        ) : (
          messages.map(msg => {
            const isMine = msg.sender_id === currentUser?.id
            const status = getMessageStatus(msg)
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMine ? 'bg-purple-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700'}`}>
                  <p className="text-sm">{msg.message}</p>
                  <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[10px] opacity-60">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {status && <span className={`text-[10px] ${status.color}`}>{status.icon === '✓✓' ? <CheckCheck className="w-3 h-3 inline" /> : <Check className="w-3 h-3 inline" />}</span>}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

    <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
  {booking?.status !== 'confirmed' ? (
    <div className="text-center py-4 text-sm text-gray-400 dark:text-gray-500">
      {t('Chat is closed. Request is completed or cancelled.', 'چیٹ بند ہے۔ درخواست مکمل یا منسوخ ہو چکی ہے۔')}
    </div>
  ) : (
    <div className="p-4">
      <div className="flex items-center gap-2">
        <input type="text" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder={t('Type a message...', 'پیغام لکھیں...')} className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-500" />
        <button onClick={handleSend} disabled={!text.trim() || sending} className="w-10 h-10 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl flex items-center justify-center transition-colors"><Send className="w-4 h-4" /></button>
      </div>
    </div>
  )}
</div>
    </div>
  )
}