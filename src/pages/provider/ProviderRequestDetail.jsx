import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Calendar, Play, Check, X, ExternalLink, Wrench, Plug, ShoppingBag, Monitor, Clock, User } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { getCurrentUser } from '@/lib/auth'
import { handleProviderResponse } from '@/api/handleProviderResponse'

const serviceIcons = { plumber: Wrench, electrician: Plug, grocery: ShoppingBag, computer_repair: Monitor }

export default function ProviderRequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [alreadyResponded, setAlreadyResponded] = useState(false)
  const [showAcceptOverlay, setShowAcceptOverlay] = useState(false)

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.from('requests').select('*').eq('id', id).single()
        setRequest(data)
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

  const handleAccept = async () => {
    if (alreadyResponded) return
    setShowAcceptOverlay(true)
    setActionLoading(true)
    try {
      const user = await getCurrentUser()
      const { data: provider } = await supabase.from('providers').select('id').eq('user_id', user.id).single()
      
      // Atomic: handleProviderResponse checks for duplicate responses server-side
      const result = await handleProviderResponse(id, provider.id, 'accepted')
      
      if (result?.action === 'booked') {
        setTimeout(() => navigate('/provider/jobs'), 800)
      }
    } catch (err) {
      if (err.message.includes('already responded')) {
        setAlreadyResponded(true)
      }
      alert('Failed: ' + err.message)
      setShowAcceptOverlay(false)
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
      await handleProviderResponse(id, provider.id, 'declined')
      navigate('/provider/dashboard')
    } catch (err) { alert('Failed: ' + err.message) }
    finally { setActionLoading(false) }
  }

  const Icon = serviceIcons[request?.service_type] || Wrench

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!request) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <p className="text-gray-500 dark:text-gray-400">Request not found</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      {/* Accept Processing Overlay */}
      {showAcceptOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center max-w-sm w-full shadow-2xl mx-4">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {t('Request Accepted!', 'درخواست قبول کر لی!')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {t('Redirecting to your jobs...', 'آپ کے کاموں پر لے جایا جا رہا ہے...')}
            </p>
            <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </div>
      )}

      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-gray-400"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Request Detail', 'درخواست کی تفصیل')}</h1>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Service Hero Card */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl shadow-lg shadow-purple-500/20 p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Icon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold capitalize">{request.service_type}</h2>
          <div className="flex items-center justify-center gap-3 mt-2 text-sm text-white/70">
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {request.preferred_date}</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {request.preferred_time}</span>
          </div>
        </div>

        {/* Details Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 space-y-4">
          {/* Location */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-0.5">{t('Location', 'مقام')}</p>
              <p className="text-sm text-gray-900 dark:text-white">{request.parsed_intent?.location || 'Jand'}</p>
              {request.parsed_intent?.coordinates && (
                <a href={`https://www.google.com/maps?q=${request.parsed_intent.coordinates}`} target="_blank" className="inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 font-medium hover:underline mt-1">
                  <ExternalLink className="w-3 h-3" /> {t('Open in Maps', 'نقشے میں کھولیں')}
                </a>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-0.5">{t('Description', 'تفصیل')}</p>
              <p className="text-sm text-gray-900 dark:text-white">{request.raw_text}</p>
            </div>
          </div>

          {/* Voice Note */}
          {request.parsed_intent?.voice_note_url && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 font-medium mb-2"><Play className="w-4 h-4" /> {t('Voice Note', 'وائس نوٹ')}</div>
              <audio src={request.parsed_intent.voice_note_url} controls className="w-full h-10" />
            </div>
          )}
        </div>

        {/* Already Responded */}
        {alreadyResponded && (
          <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm rounded-2xl p-4 text-center border border-amber-200 dark:border-amber-800">
            {t('You have already responded to this request.', 'آپ اس درخواست کا جواب دے چکے ہیں۔')}
          </div>
        )}

        {/* Action Buttons */}
        {!alreadyResponded && (
          <div className="flex gap-3">
            <button onClick={handleAccept} disabled={actionLoading} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
              <Check className="w-5 h-5" /> {t('Accept', 'قبول کریں')}
            </button>
            <button onClick={handleDecline} disabled={actionLoading} className="flex-1 py-4 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 border-2 border-red-200 dark:border-red-800 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-95">
              <X className="w-5 h-5" /> {t('Decline', 'مسترد کریں')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}