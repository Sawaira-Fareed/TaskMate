import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, MapPin, DollarSign, Calendar, Play, Check, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function RequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [request, setRequest] = useState(null)
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  useEffect(() => {
    loadRequest()

    // Subscribe to realtime updates on this request
    const channel = supabase
      .channel(`request-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'requests', filter: `id=eq.${id}` },
        (payload) => {
          setRequest(payload.new)
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'provider_responses', filter: `request_id=eq.${id}` },
        () => {
          loadResponses()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  async function loadRequest() {
    const { data: req } = await supabase.from('requests').select('*').eq('id', id).single()
    setRequest(req)
    setLoading(false)
  }

  async function loadResponses() {
    const { data: res } = await supabase.from('provider_responses').select('*, provider:provider_id(user:user_id(full_name))').eq('request_id', id).order('created_at', { ascending: true })
    setResponses(res || [])
  }

  async function handleCancelRequest() {
  if (!confirm(t('Cancel this request?', 'کیا آپ یہ درخواست منسوخ کرنا چاہتے ہیں؟'))) return
  setActionLoading(true)
  try {
    await supabase.from('requests').update({ status: 'cancelled' }).eq('id', id)
    await supabase.from('audit_logs').insert({
      request_id: id,
      customer_id: request.customer_id,
      event_type: 'booking_cancelled',
      status_before: request.status,
      status_after: 'cancelled'
    })
    navigate('/customer/my-requests')
  } catch (err) {
    alert('Failed: ' + err.message)
  } finally {
    setActionLoading(false)
  }
}

async function handleMarkDone() {
  if (!confirm(t('Mark this job as completed?', 'کیا یہ کام مکمل ہو گیا ہے؟'))) return
  setActionLoading(true)
  try {
    await supabase.from('bookings').update({ status: 'completed' }).eq('request_id', id)
    await supabase.from('requests').update({ status: 'completed' }).eq('id', id)
    await supabase.from('audit_logs').insert({
      request_id: id,
      customer_id: request.customer_id,
      event_type: 'booking_completed',
      status_before: 'confirmed',
      status_after: 'completed'
    })
    navigate('/customer/bookings')
  } catch (err) {
    alert('Failed: ' + err.message)
  } finally {
    setActionLoading(false)
  }
}

  async function handleCounterResponse(accepted) {
    setActionLoading(true)
    try {
      // Find the latest counter-offer
      const counterOffer = responses.find(r => r.response_type === 'counter_offer' && !r.customer_response)
      if (!counterOffer) return

      // Update the response with customer's decision
      await supabase
        .from('provider_responses')
        .update({ customer_response: accepted ? 'accepted' : 'declined' })
        .eq('id', counterOffer.id)

      if (accepted) {
        // Create booking
        await supabase.from('bookings').insert({
          request_id: id,
          customer_id: request.customer_id,
          provider_id: counterOffer.provider_id,
          service_type: request.service_type,
          scheduled_date: request.preferred_date,
          scheduled_time: counterOffer.proposed_time || request.preferred_time,
          status: 'confirmed'
        })
        await supabase.from('requests').update({ status: 'confirmed' }).eq('id', id)
        await supabase.from('audit_logs').insert({
          request_id: id,
          customer_id: request.customer_id,
          provider_id: counterOffer.provider_id,
          event_type: 'counter_accepted',
          event_data: { response_id: counterOffer.id },
          status_before: 'offered',
          status_after: 'confirmed'
        })
      } else {
        // Trigger next provider in loop
        await supabase.from('requests').update({ status: 'contacting' }).eq('id', id)
        await supabase.from('audit_logs').insert({
          request_id: id,
          customer_id: request.customer_id,
          provider_id: counterOffer.provider_id,
          event_type: 'counter_declined',
          event_data: { response_id: counterOffer.id },
          status_before: 'offered',
          status_after: 'contacting'
        })
      }
    } catch (err) {
      alert('Failed: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  function getStatusDisplay() {
    const statusMap = {
      pending: { icon: Clock, color: 'text-amber-600 bg-amber-50', label: t('Pending', 'زیر التواء') },
      parsed: { icon: Clock, color: 'text-blue-600 bg-blue-50', label: t('Processing', 'پروسیسنگ') },
      contacting: { icon: Loader2, color: 'text-purple-600 bg-purple-50', label: t('Finding Provider', 'پرووائیڈر تلاش ہو رہا ہے'), spin: true },
      offered: { icon: Clock, color: 'text-orange-600 bg-orange-50', label: t('Counter Offer Received', 'جوابی پیشکش موصول') },
      confirmed: { icon: Check, color: 'text-emerald-600 bg-emerald-50', label: t('Confirmed', 'تصدیق شدہ') },
      declined: { icon: X, color: 'text-red-600 bg-red-50', label: t('Declined', 'مسترد') },
      expired: { icon: X, color: 'text-gray-600 bg-gray-50', label: t('Expired', 'معیاد ختم') },
      no_provider: { icon: X, color: 'text-red-600 bg-red-50', label: t('No Provider Found', 'کوئی پرووائیڈر نہیں ملا') },
      completed: { icon: Check, color: 'text-emerald-600 bg-emerald-50', label: t('Completed', 'مکمل') },
      cancelled: { icon: X, color: 'text-red-600 bg-red-50', label: t('Cancelled', 'منسوخ') },
    }
    return statusMap[request?.status] || statusMap.pending
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!request) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <p className="text-gray-500 dark:text-gray-400">Request not found</p>
    </div>
  )

  const statusDisplay = getStatusDisplay()
  const StatusIcon = statusDisplay.icon

  // Check if there's a pending counter-offer
  const pendingCounter = responses.find(r => r.response_type === 'counter_offer' && !r.customer_response)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Request Status', 'درخواست کی صورتحال')}</h1>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Status Banner */}
        <div className={`rounded-2xl p-5 flex items-center gap-4 ${statusDisplay.color}`}>
          <StatusIcon className={`w-8 h-8 ${statusDisplay.spin ? 'animate-spin' : ''}`} />
          <div>
            <p className="font-semibold text-lg">{statusDisplay.label}</p>
            {request.status === 'contacting' && (
              <p className="text-sm opacity-75">{t(`Contacting provider ${request.provider_count || 1}...`, `پرووائیڈر ${request.provider_count || 1} سے رابطہ ہو رہا ہے...`)}</p>
            )}
            {request.status === 'confirmed' && (
              <p className="text-sm opacity-75">{t('Provider is on the way!', 'پرووائیڈر راستے میں ہے!')}</p>
            )}
          </div>
        </div>

        {/* Request Info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-white capitalize">{request.service_type}</h2>
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span>{request.preferred_date} • {(() => { if (!request.preferred_time) return ''; const [h, m] = request.preferred_time.split(':'); const hour = parseInt(h); const ampm = hour >= 12 ? 'PM' : 'AM'; const h12 = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour); return `${h12}:${m} ${ampm}` })()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span>{request.parsed_intent?.location || 'Jand'}</span>
          </div>
          
          <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-xl p-3">{request.raw_text}</p>

          {request.parsed_intent?.voice_note_url && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3">
              <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 font-medium mb-2">
                <Play className="w-4 h-4" /> {t('Voice Note', 'وائس نوٹ')}
              </div>
              <audio src={request.parsed_intent.voice_note_url} controls className="w-full h-10" />
            </div>
          )}
        </div>

                {/* Action Buttons */}
        {['pending', 'parsed', 'contacting', 'offered'].includes(request.status) && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <button
              onClick={handleCancelRequest}
              disabled={actionLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <X className="w-4 h-4" />
              {t('Cancel Request', 'درخواست منسوخ کریں')}
            </button>
          </div>
        )}

        {request.status === 'confirmed' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <button
              onClick={handleMarkDone}
              disabled={actionLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            >
              <Check className="w-4 h-4" />
              {t('Mark as Done', 'مکمل کے طور پر نشان زد کریں')}
            </button>
          </div>
        )}

        {/* Pending Counter Offer */}
        {pendingCounter && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-2 border-orange-300 dark:border-orange-700 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('Counter Offer', 'جوابی پیشکش')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {pendingCounter.provider?.user?.full_name || t('Provider', 'پرووائیڈر')} {t('suggests', 'تجویز کرتا ہے')}:
            </p>
            <p className="text-xl font-bold text-orange-600 dark:text-orange-400 mb-4">{pendingCounter.proposed_time}</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleCounterResponse(true)}
                disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 text-sm font-medium"
              >
                <Check className="w-4 h-4" /> {t('Accept', 'قبول کریں')}
              </button>
              <button
                onClick={() => handleCounterResponse(false)}
                disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl py-3 text-sm font-medium"
              >
                <X className="w-4 h-4" /> {t('Decline', 'مسترد کریں')}
              </button>
            </div>
          </div>
        )}

        {/* All Responses Timeline */}
        {responses.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('Response Timeline', 'جوابی ٹائم لائن')}</h3>
            <div className="space-y-2">
              {responses.map((r, i) => (
                <div key={r.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className={`w-2 h-2 rounded-full ${
                    r.response_type === 'accepted' ? 'bg-emerald-500' :
                    r.response_type === 'declined' ? 'bg-red-500' :
                    'bg-orange-500'
                  }`} />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {r.provider?.user?.full_name || `Provider ${i + 1}`}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      {r.response_type === 'accepted' ? t('Accepted', 'قبول کر لیا') :
                       r.response_type === 'declined' ? t('Declined', 'مسترد کر دیا') :
                       t('Offered', 'پیشکش کی')}
                    </span>
                  </div>
                 {r.proposed_time && (
  <span className="text-xs font-medium text-orange-600 dark:text-orange-400">{r.proposed_time}</span>
)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}