import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, MapPin, Calendar, Play, Check, X, Loader2, MessageCircle, Phone, Star, User, Wrench, Plug, ShoppingBag, Monitor, Car, Bike, Users, AlertTriangle, WifiOff, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

const serviceIcons = { plumber: Wrench, electrician: Plug, grocery: ShoppingBag, computer_repair: Monitor, ride: Car }
const rideIcons = { bike: Bike, rickshaw: Users, car: Car }
const serviceColors = {
  plumber: 'from-blue-500 to-cyan-500', electrician: 'from-amber-500 to-orange-500',
  grocery: 'from-emerald-500 to-teal-500', computer_repair: 'from-violet-500 to-purple-500', ride: 'from-purple-500 to-pink-500',
}

export default function RequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [request, setRequest] = useState(null)
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [booking, setBooking] = useState(null)
  const [cancelModal, setCancelModal] = useState(false)
  const [cancelBookingModal, setCancelBookingModal] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const { isOnline, isSlow } = useNetworkStatus()
  const t = (en, ur) => (lang === 'ur' ? ur : en)

  useEffect(() => {
    loadRequest()
    const channel = supabase.channel(`request-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'requests' }, async (payload) => {
        if (payload.new.id === id) { setRequest(payload.new); if (payload.new.status === 'confirmed' && !booking) { const { data: bkg } = await supabase.from('bookings').select('*, provider:provider_id(phone, plan, user:user_id(full_name, avatar_url))').eq('request_id', id).single(); if (bkg) setBooking(bkg) } }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'provider_responses' }, (payload) => { if (payload.new.request_id === id) loadResponses() })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, (payload) => { if (payload.new.request_id === id) setBooking(payload.new) })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings' }, (payload) => { if (payload.new.request_id === id) setBooking(payload.new) })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id])

  async function loadRequest() {
    try {
      const { data: req } = await supabase.from('requests').select('*').eq('id', id).single()
      if (!req) throw new Error('Request not found'); setRequest(req)
      if (req?.status === 'confirmed' || req?.status === 'completed') { const { data: bkg } = await supabase.from('bookings').select('*, provider:provider_id(phone, plan, user:user_id(full_name, avatar_url))').eq('request_id', id).single(); setBooking(bkg) }
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  async function loadResponses() { const { data: res } = await supabase.from('provider_responses').select('*, provider:provider_id(user:user_id(full_name, avatar_url))').eq('request_id', id).order('created_at', { ascending: true }); setResponses(res || []) }

  async function confirmCancelRequest() { setActionLoading(true); try { await supabase.from('requests').update({ status: 'cancelled' }).eq('id', id); setSuccessMsg(t('Request cancelled', 'درخواست منسوخ کر دی گئی')); setCancelModal(false); setTimeout(() => navigate('/customer/my-requests', { replace: true }), 1000) } catch (err) { alert('Failed: ' + err.message) } finally { setActionLoading(false) } }

  async function confirmCancelBooking() { setActionLoading(true); try { await supabase.from('bookings').update({ status: 'cancelled' }).eq('request_id', id); await supabase.from('requests').update({ status: 'cancelled' }).eq('id', id); setSuccessMsg(t('Booking cancelled', 'بکنگ منسوخ کر دی گئی')); setCancelBookingModal(false); setTimeout(() => navigate('/customer/my-requests', { replace: true }), 1000) } catch (err) { alert('Failed: ' + err.message) } finally { setActionLoading(false) } }

  async function handleMarkDone() {
    if (!confirm(t('Mark this job as completed?', 'کیا یہ کام مکمل ہو گیا ہے؟'))) return
    const { data: bkg } = await supabase.from('bookings').select('id, status').eq('request_id', id).single()
    if (!bkg) { alert(t('Booking not found', 'بکنگ نہیں ملی')); return }
    if (bkg.status === 'completed') { await supabase.from('requests').update({ status: 'completed' }).eq('id', id); setSuccessMsg(t('Already completed!', 'پہلے ہی مکمل ہے!')); setTimeout(() => navigate('/customer/my-requests', { replace: true }), 1000); return }
    navigate(`/customer/rate/${bkg.id}`, { replace: true })
  }

  const getStatusBadge = (status) => {
    const map = { pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-700', contacting: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-700', confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700', completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700', cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-700' }
    return map[status] || 'bg-gray-100 text-gray-600 border-gray-200'
  }

  if (!isOnline) return (<div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4"><div className="text-center"><WifiOff className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" /><h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('No Internet', 'انٹرنیٹ نہیں ہے')}</h3><button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium">{t('Retry', 'دوبارہ کوشش کریں')}</button></div></div>)
  if (loading) return (<div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>)
  if (error || !request) return (<div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4"><div className="text-center"><AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" /><p className="text-sm text-gray-500 mb-2">{error || t('Request not found', 'درخواست نہیں ملی')}</p><button onClick={() => navigate('/customer/my-requests')} className="text-sm text-purple-600 font-medium">{t('Go back', 'واپس جائیں')}</button></div></div>)

  const isRide = request.is_ride
  const Icon = isRide ? (rideIcons[request.vehicle_type] || Car) : serviceIcons[request.service_type] || Wrench
  const gradient = isRide ? 'from-purple-500 to-pink-500' : serviceColors[request.service_type] || 'from-purple-500 to-pink-500'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      {isSlow && (<div className="sticky top-0 z-50 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs text-center py-1.5">{t('Slow connection', 'انٹرنیٹ سست ہے')}</div>)}
      {successMsg && (<div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-lg text-sm font-medium animate-pulse"><Check className="w-4 h-4 inline mr-1" /> {successMsg}</div>)}

      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => navigate('/customer/my-requests', { replace: true })} className="text-gray-500 dark:text-gray-400"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-3 flex-1"><h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Request Status', 'درخواست کی صورتحال')}</h1><span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${getStatusBadge(request.status)}`}>{request.status}</span></div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {booking?.provider && (
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl shadow-lg shadow-purple-500/20 p-5 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">{booking.provider.user?.avatar_url ? <img src={booking.provider.user.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-7 h-7 text-white" />}</div>
              <div className="flex-1"><p className="font-semibold text-lg">{booking.provider.user?.full_name || 'Provider'}</p><div className="flex items-center gap-2 text-sm text-white/70"><span className="capitalize">{isRide ? `${request.vehicle_type || ''} Ride` : request.service_type}</span>{booking.provider.plan === 'pro' && (<span className="text-xs px-2 py-0.5 bg-yellow-400 text-yellow-900 rounded-full font-bold">PRO</span>)}</div></div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 space-y-3">
          <div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}><Icon className="w-5 h-5 text-white" /></div><div><h2 className="font-semibold text-gray-900 dark:text-white capitalize">{isRide ? `${request.vehicle_type || ''} Ride` : request.service_type}</h2><div className="flex items-center gap-2 text-xs text-gray-500"><Calendar className="w-3.5 h-3.5" /><span>{request.preferred_date} • {(() => { if (!request.preferred_time) return ''; const [h, m] = request.preferred_time.split(':'); const hour = parseInt(h); const ampm = hour >= 12 ? 'PM' : 'AM'; const h12 = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour); return `${h12}:${m} ${ampm}` })()}</span></div></div></div>
          {isRide ? (<><div className="flex items-start gap-3"><div className="w-3 h-3 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" /><span className="text-sm text-gray-700 dark:text-gray-300">{request.pickup_location}</span></div><div className="flex items-start gap-3"><div className="w-3 h-3 rounded-full bg-red-500 mt-1.5 flex-shrink-0" /><span className="text-sm text-gray-700 dark:text-gray-300">{request.dropoff_location}</span></div></>) : (<div className="flex items-start gap-3"><MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" /><span className="text-sm text-gray-700 dark:text-gray-300">{request.parsed_intent?.location || 'Jand'}</span></div>)}
          <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-xl p-3">{request.raw_text}</p>
          {request.parsed_intent?.voice_note_url && (<div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3"><div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 font-medium mb-2"><Play className="w-4 h-4" /> {t('Voice Note', 'وائس نوٹ')}</div><audio src={request.parsed_intent.voice_note_url} controls className="w-full h-10" /></div>)}
        </div>

        {['pending', 'parsed', 'contacting'].includes(request.status) && (
          <div className="flex justify-center">
            <button onClick={() => setCancelModal(true)} disabled={actionLoading} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-medium bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:bg-red-50 hover:text-red-500 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all"><X className="w-4 h-4" /> {t('Cancel Request', 'درخواست منسوخ کریں')}</button>
          </div>
        )}

        {request.status === 'confirmed' && booking?.provider && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => navigate(`/customer/chat/${booking.id}`)} className="py-3 rounded-2xl text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2"><MessageCircle className="w-4 h-4" /> {t('Chat in App', 'ایپ میں چیٹ')}</button>
              <a href={`https://wa.me/${booking.provider.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(`Assalam-o-Alaikum, I booked you through Zaria for ${isRide ? 'a ride' : request.service_type}`)}`} target="_blank" className="py-3 rounded-2xl text-sm font-medium bg-green-500 hover:bg-green-600 text-white flex items-center justify-center gap-2"><MessageCircle className="w-4 h-4" /> WhatsApp</a>
            </div>
            {booking.provider.plan === 'pro' && (<a href={`tel:${booking.provider.phone}`} className="w-full py-3 rounded-2xl text-sm font-medium bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 border-2 border-purple-200 dark:border-purple-800 flex items-center justify-center gap-2 hover:bg-purple-50 transition-colors"><Phone className="w-4 h-4" /> {t('Call Provider', 'پرووائیڈر کو کال کریں')}</a>)}
            <button onClick={handleMarkDone} disabled={actionLoading} className="w-full py-4 rounded-2xl text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"><Check className="w-5 h-5" /> {t('Mark as Done', 'مکمل کے طور پر نشان زد کریں')}</button>
            <div className="flex justify-center">
              <button onClick={() => setCancelBookingModal(true)} disabled={actionLoading} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-medium bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:bg-red-50 hover:text-red-500 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all"><X className="w-4 h-4" /> {t('Cancel Booking', 'بکنگ منسوخ کریں')}</button>
            </div>
          </div>
        )}
      </div>

      {cancelModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"><div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center"><div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-7 h-7 text-red-500" /></div><h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('Cancel Request?', 'درخواست منسوخ کریں؟')}</h3><p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('This cannot be undone.', 'یہ واپس نہیں ہو سکتا۔')}</p><div className="flex gap-3"><button onClick={() => setCancelModal(false)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium">{t('Keep', 'رہنے دیں')}</button><button onClick={confirmCancelRequest} disabled={actionLoading} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2">{actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}{t('Cancel', 'منسوخ کریں')}</button></div></div></div>)}
      {cancelBookingModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"><div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center"><div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-7 h-7 text-red-500" /></div><h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('Cancel Booking?', 'بکنگ منسوخ کریں؟')}</h3><p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('The provider will be notified.', 'پرووائیڈر کو اطلاع کر دی جائے گی۔')}</p><div className="flex gap-3"><button onClick={() => setCancelBookingModal(false)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium">{t('Keep', 'رہنے دیں')}</button><button onClick={confirmCancelBooking} disabled={actionLoading} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2">{actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}{t('Cancel', 'منسوخ کریں')}</button></div></div></div>)}
    </div>
  )
}