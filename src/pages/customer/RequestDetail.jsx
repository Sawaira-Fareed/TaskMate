import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, MapPin, Calendar, Play, Check, X, Loader2, MessageCircle, Phone, Star, User, Wrench, Plug, ShoppingBag, Monitor, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

const serviceIcons = { plumber: Wrench, electrician: Plug, grocery: ShoppingBag, computer_repair: Monitor }
const serviceColors = {
  plumber: 'from-blue-500 to-cyan-500',
  electrician: 'from-amber-500 to-orange-500',
  grocery: 'from-emerald-500 to-teal-500',
  computer_repair: 'from-violet-500 to-purple-500',
}

export default function RequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [request, setRequest] = useState(null)
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [booking, setBooking] = useState(null)

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  useEffect(() => {
    loadRequest()
    const channel = supabase
      .channel(`request-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'requests' }, async (payload) => {
        if (payload.new.id === id) {
          setRequest(payload.new)
          if (payload.new.status === 'confirmed' && !booking) {
            const { data: bkg } = await supabase.from('bookings').select('*, provider:provider_id(phone, plan, user:user_id(full_name, avatar_url))').eq('request_id', id).single()
            if (bkg) setBooking(bkg)
          }
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'provider_responses' }, (payload) => { if (payload.new.request_id === id) loadResponses() })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, (payload) => { if (payload.new.request_id === id) setBooking(payload.new) })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings' }, (payload) => { if (payload.new.request_id === id) setBooking(payload.new) })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id])

  async function loadRequest() {
    const { data: req } = await supabase.from('requests').select('*').eq('id', id).single()
    setRequest(req)
    if (req?.status === 'confirmed' || req?.status === 'completed') {
      const { data: bkg } = await supabase.from('bookings').select('*, provider:provider_id(phone, plan, user:user_id(full_name, avatar_url))').eq('request_id', id).single()
      setBooking(bkg)
    }
    setLoading(false)
  }

  async function loadResponses() {
    const { data: res } = await supabase.from('provider_responses').select('*, provider:provider_id(user:user_id(full_name, avatar_url))').eq('request_id', id).order('created_at', { ascending: true })
    setResponses(res || [])
  }

  async function handleCancelRequest() {
    if (!confirm(t('Cancel this request?', 'کیا آپ یہ درخواست منسوخ کرنا چاہتے ہیں؟'))) return
    setActionLoading(true)
    try {
      await supabase.from('requests').update({ status: 'cancelled' }).eq('id', id)
      navigate('/customer/my-requests', { replace: true })
    } catch (err) { alert('Failed: ' + err.message) }
    finally { setActionLoading(false) }
  }

  async function handleMarkDone() {
    if (!confirm(t('Mark this job as completed?', 'کیا یہ کام مکمل ہو گیا ہے؟'))) return
    const { data: bkg } = await supabase.from('bookings').select('id, status').eq('request_id', id).single()
    if (!bkg) { alert(t('Booking not found', 'بکنگ نہیں ملی')); return }
    if (bkg.status === 'completed') {
      await supabase.from('requests').update({ status: 'completed' }).eq('id', id)
      alert(t('Already completed!', 'پہلے ہی مکمل ہے!'))
      navigate('/customer/my-requests', { replace: true })
      return
    }
    navigate(`/customer/rate/${bkg.id}`, { replace: true })
  }

  function getStatusDisplay() {
    const map = {
      pending: { icon: Clock, color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', label: t('Pending', 'زیر التواء') },
      contacting: { icon: Loader2, color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', label: t('Finding Provider', 'پرووائیڈر تلاش ہو رہا ہے'), spin: true },
      confirmed: { icon: Check, color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', label: t('Confirmed', 'تصدیق شدہ') },
      completed: { icon: Check, color: 'bg-emerald-50 text-emerald-700', label: t('Completed', 'مکمل') },
      cancelled: { icon: X, color: 'bg-red-50 text-red-700', label: t('Cancelled', 'منسوخ') },
    }
    return map[request?.status] || map.pending
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>
  if (!request) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Request not found</p></div>

  const statusDisplay = getStatusDisplay()
  const StatusIcon = statusDisplay.icon
  const Icon = serviceIcons[request.service_type] || Wrench
  const gradient = serviceColors[request.service_type] || 'from-purple-500 to-pink-500'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => navigate('/customer/my-requests', { replace: true })} className="text-gray-500 dark:text-gray-400"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Request Status', 'درخواست کی صورتحال')}</h1>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Status Banner */}
        <div className={`rounded-2xl p-4 flex items-center gap-3 ${statusDisplay.color}`}>
          <StatusIcon className={`w-6 h-6 ${statusDisplay.spin ? 'animate-spin' : ''}`} />
          <p className="font-semibold">{statusDisplay.label}</p>
        </div>

        {/* Provider Card — only when confirmed */}
        {booking?.provider && (
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl shadow-lg shadow-purple-500/20 p-5 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                {booking.provider.user?.avatar_url ? (
                  <img src={booking.provider.user.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-7 h-7 text-white" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-lg">{booking.provider.user?.full_name || 'Provider'}</p>
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <span className="capitalize">{request.service_type}</span>
                  {booking.provider.plan === 'pro' && (
                    <span className="text-xs px-2 py-0.5 bg-yellow-400 text-yellow-900 rounded-full font-bold">PRO</span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/50" />
            </div>
          </div>
        )}

        {/* Request Info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white capitalize">{request.service_type}</h2>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>{request.preferred_date} • {(() => { if (!request.preferred_time) return ''; const [h, m] = request.preferred_time.split(':'); const hour = parseInt(h); const ampm = hour >= 12 ? 'PM' : 'AM'; const h12 = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour); return `${h12}:${m} ${ampm}` })()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-700 dark:text-gray-300">{request.parsed_intent?.location || 'Jand'}</span>
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-xl p-3">{request.raw_text}</p>

          {request.parsed_intent?.voice_note_url && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3">
              <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 font-medium mb-2"><Play className="w-4 h-4" /> {t('Voice Note', 'وائس نوٹ')}</div>
              <audio src={request.parsed_intent.voice_note_url} controls className="w-full h-10" />
            </div>
          )}
        </div>

        {/* Cancel Button — before confirmed */}
        {['pending', 'parsed', 'contacting'].includes(request.status) && (
          <button onClick={handleCancelRequest} disabled={actionLoading} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 transition-colors">
            <X className="w-4 h-4" /> {t('Cancel Request', 'درخواست منسوخ کریں')}
          </button>
        )}

        {/* Confirmed Actions */}
        {request.status === 'confirmed' && booking?.provider && (
          <div className="space-y-3">
            {/* Small buttons row */}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => navigate(`/customer/chat/${booking.id}`)} className="py-3 rounded-2xl text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2 transition-colors">
                <MessageCircle className="w-4 h-4" /> {t('Chat in App', 'ایپ میں چیٹ')}
              </button>
              <a href={`https://wa.me/${booking.provider.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(`Assalam-o-Alaikum, I booked you through Zaria for ${request.service_type}`)}`} target="_blank" className="py-3 rounded-2xl text-sm font-medium bg-green-500 hover:bg-green-600 text-white flex items-center justify-center gap-2 transition-colors">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            </div>

            {/* Call — Pro only */}
            {booking.provider.plan === 'pro' && (
              <a href={`tel:${booking.provider.phone}`} className="w-full py-3 rounded-2xl text-sm font-medium bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 border-2 border-purple-200 dark:border-purple-800 flex items-center justify-center gap-2 hover:bg-purple-50 transition-colors">
                <Phone className="w-4 h-4" /> {t('Call Provider', 'پرووائیڈر کو کال کریں')}
              </a>
            )}

            {/* Mark as Done — BIG */}
            <button onClick={handleMarkDone} disabled={actionLoading} className="w-full py-4 rounded-2xl text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
              <Check className="w-5 h-5" /> {t('Mark as Done', 'مکمل کے طور پر نشان زد کریں')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}