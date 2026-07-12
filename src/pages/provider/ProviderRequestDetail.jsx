import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Calendar, DollarSign, Check, X, Clock, Play } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { getCurrentUser } from '@/lib/auth'

export default function ProviderRequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [counterPrice, setCounterPrice] = useState('')
  const [showCounter, setShowCounter] = useState(false)
  const [alreadyResponded, setAlreadyResponded] = useState(false)

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.from('requests').select('*').eq('id', id).single()
        setRequest(data)

        // Check if provider already responded
        const user = await getCurrentUser()
        const { data: provider } = await supabase.from('providers').select('id').eq('user_id', user.id).single()
        if (provider) {
          const { data: existing } = await supabase.from('provider_responses').select('id').eq('request_id', id).eq('provider_id', provider.id).maybeSingle()
          if (existing) setAlreadyResponded(true)
        }
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [id])

  async function logAudit(eventType, providerId) {
    await supabase.from('audit_logs').insert({
      request_id: id,
      provider_id: providerId,
      event_type: eventType,
      event_data: { responded_at: new Date().toISOString() },
      status_before: request?.status,
      status_after: eventType === 'provider_accepted' ? 'confirmed' : request?.status,
    })
  }

  const handleAccept = async () => {
    if (alreadyResponded) return
    setActionLoading(true)
    try {
      const user = await getCurrentUser()
      const { data: provider } = await supabase.from('providers').select('id').eq('user_id', user.id).single()

      await supabase.from('provider_responses').insert({ request_id: id, provider_id: provider.id, response_type: 'accepted' })
      await supabase.from('bookings').insert({ request_id: id, customer_id: request.customer_id, provider_id: provider.id, service_type: request.service_type, scheduled_date: request.preferred_date, scheduled_time: request.preferred_time, status: 'confirmed' })
      await supabase.from('requests').update({ status: 'confirmed' }).eq('id', id)
      await logAudit('provider_accepted', provider.id)
      navigate('/provider/dashboard')
    } catch (err) {
      alert('Failed: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDecline = async () => {
    if (alreadyResponded) return
    setActionLoading(true)
    try {
      const user = await getCurrentUser()
      const { data: provider } = await supabase.from('providers').select('id').eq('user_id', user.id).single()
      await supabase.from('provider_responses').insert({ request_id: id, provider_id: provider.id, response_type: 'declined' })
      await logAudit('provider_declined', provider.id)
      navigate('/provider/dashboard')
    } catch (err) {
      alert('Failed: ' + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCounter = async () => {
    if (alreadyResponded || !counterPrice) return
    setActionLoading(true)
    try {
      const user = await getCurrentUser()
      const { data: provider } = await supabase.from('providers').select('id').eq('user_id', user.id).single()
      await supabase.from('provider_responses').insert({ request_id: id, provider_id: provider.id, response_type: 'counter_offer', proposed_time: counterPrice })
      await logAudit('counter_offered', provider.id)
      navigate('/provider/dashboard')
    } catch (err) {
      alert('Failed: ' + err.message)
    } finally {
      setActionLoading(false)
    }
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Request Detail', 'درخواست کی تفصیل')}</h1>
      </header>
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">{request.service_type}</h2>
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" /><span>{request.preferred_date} • {request.preferred_time}</span></div>
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" /><span>{request.parsed_intent?.location || 'Jand'}</span></div>
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><DollarSign className="w-4 h-4 text-gray-400 dark:text-gray-500" /><span className="font-semibold">PKR {request.parsed_intent?.price || 'N/A'}</span></div>
          <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-xl p-3">{request.raw_text}</p>
          {request.parsed_intent?.voice_note_url && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3">
              <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 font-medium mb-2"><Play className="w-4 h-4" /> {t('Voice Note', 'وائس نوٹ')}</div>
              <audio src={request.parsed_intent.voice_note_url} controls className="w-full h-10" />
            </div>
          )}
        </div>

        {alreadyResponded && (
          <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm rounded-xl p-4 text-center border border-amber-200 dark:border-amber-800">
            {t('You have already responded to this request.', 'آپ اس درخواست کا جواب دے چکے ہیں۔')}
          </div>
        )}

        {!alreadyResponded && (
          <>
            {showCounter && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Your Price (PKR)', 'آپ کی قیمت (روپے)')}</label>
                <input type="number" value={counterPrice} onChange={(e) => setCounterPrice(e.target.value)} placeholder="800" className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-3" />
                <button onClick={handleCounter} disabled={!counterPrice || actionLoading} className="w-full bg-purple-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                  {t('Submit Counter Offer', 'جوابی پیشکش جمع کریں')}
                </button>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleAccept} disabled={actionLoading} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 text-sm font-medium"><Check className="w-4 h-4" /> {t('Accept', 'قبول کریں')}</button>
              <button onClick={() => setShowCounter(!showCounter)} className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl py-3 text-sm font-medium"><Clock className="w-4 h-4" /> {t('Counter', 'جوابی')}</button>
              <button onClick={handleDecline} disabled={actionLoading} className="flex-1 flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl py-3 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30"><X className="w-4 h-4" /> {t('Decline', 'مسترد')}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}