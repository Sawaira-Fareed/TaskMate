import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Check, CheckCheck, AlertTriangle, WifiOff, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { getCurrentUser } from '@/lib/auth'
import { useChat } from '@/hooks/useChat'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

export default function Chat() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const messagesEndRef = useRef(null)
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [currentUser, setCurrentUser] = useState(null)
  const [booking, setBooking] = useState(null)
  const [text, setText] = useState('')
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState(null)
  const { isOnline, isSlow } = useNetworkStatus()

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  useEffect(() => {
    async function init() {
      try {
        const user = await getCurrentUser()
        setCurrentUser(user)
        const { data: bkg } = await supabase.from('bookings').select('*, provider:provider_id(user_id, user:user_id(full_name)), customer:customer_id(full_name)').eq('id', bookingId).single()
        if (!bkg) throw new Error('Booking not found')
        setBooking(bkg)
      } catch (err) { setPageError(err.message) }
      finally { setPageLoading(false) }
    }
    init()
  }, [bookingId])

  const { messages, loading, sending, sendMessage, getMessageStatus } = useChat(bookingId, currentUser?.id)

  const receiverId = booking?.provider?.user_id
  const providerName = booking?.provider?.user?.full_name || 'Provider'
  const isChatOpen = booking?.status === 'confirmed'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!text.trim() || !isChatOpen) return
    const result = await sendMessage(text, receiverId)
    if (result) setText('')
  }

  if (!isOnline) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center"><WifiOff className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" /><h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('No Internet', 'انٹرنیٹ نہیں ہے')}</h3><button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium">{t('Retry', 'دوبارہ کوشش کریں')}</button></div>
      </div>
    )
  }

  if (pageLoading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>
  )

  if (pageError) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4"><div className="text-center"><AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" /><p className="text-sm text-gray-500 mb-2">{pageError}</p><button onClick={() => navigate(-1)} className="text-sm text-purple-600 font-medium">{t('Go back', 'واپس جائیں')}</button></div></div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {isSlow && (<div className="sticky top-0 z-50 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs text-center py-1.5">{t('Slow connection', 'انٹرنیٹ سست ہے')}</div>)}

      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-gray-400"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{providerName}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">{booking?.service_type}</p>
        </div>
        {!isChatOpen && (
          <span className="ml-auto text-xs px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full font-medium">{t('Closed', 'بند')}</span>
        )}
      </header>

      {/* Chat Closed Banner */}
      {!isChatOpen && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-3 text-center">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            {booking?.status === 'completed' ? t('This job is completed. Chat is closed.', 'یہ کام مکمل ہو چکا ہے۔ چیٹ بند ہے۔') : t('This job is cancelled. Chat is closed.', 'یہ کام منسوخ ہو چکا ہے۔ چیٹ بند ہے۔')}
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="space-y-3">{[1,2,3,4].map(i => (<div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}><div className="w-2/3 h-10 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" /></div>))}</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20"><p className="text-sm text-gray-500">{t('No messages yet. Say hello!', 'ابھی تک کوئی پیغام نہیں۔ ہیلو کہیں!')}</p></div>
        ) : (
          <>
            {messages.map(msg => {
              const isMine = msg.sender_id === currentUser?.id
              const status = getMessageStatus(msg)
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMine ? 'bg-purple-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700'}`}>
                    <p className="text-sm">{msg.message}</p>
                    <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[10px] opacity-60">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {status && (<span className={`text-[10px] ${status.color}`}>{status.icon === '✓✓' ? <CheckCheck className="w-3 h-3 inline" /> : <Check className="w-3 h-3 inline" />}</span>)}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        {!isChatOpen ? (
          <div className="text-center py-4 text-sm text-gray-400 dark:text-gray-500">{t('Chat is closed.', 'چیٹ بند ہے۔')}</div>
        ) : (
          <div className="p-4">
            <div className="flex items-center gap-2">
              <input type="text" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder={t('Type a message...', 'پیغام لکھیں...')} className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-500" disabled={!isChatOpen} />
              <button onClick={handleSend} disabled={!text.trim() || sending || !isChatOpen} className="w-10 h-10 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl flex items-center justify-center transition-colors"><Send className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}