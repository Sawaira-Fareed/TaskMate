import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, MapPin, DollarSign, Calendar, Play } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function RequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [request, setRequest] = useState(null)
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  useEffect(() => {
    async function load() {
      const { data: req } = await supabase.from('requests').select('*').eq('id', id).single()
      const { data: res } = await supabase.from('provider_responses').select('*').eq('request_id', id)
      setRequest(req)
      setResponses(res || [])
      setLoading(false)
    }
    load()
  }, [id])

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
        {/* Request Info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('Status', 'اسٹیٹس')}</span>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">{request.status}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span>{request.preferred_date} • {request.preferred_time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span>{request.parsed_intent?.location || 'Jand'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <DollarSign className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span>PKR {request.parsed_intent?.price || 'N/A'}</span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-xl p-3">{request.raw_text}</p>

          {/* Voice Note */}
          {request.parsed_intent?.voice_note_url && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3">
              <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 font-medium mb-2">
                <Play className="w-4 h-4" /> {t('Voice Note', 'وائس نوٹ')}
              </div>
              <audio src={request.parsed_intent.voice_note_url} controls className="w-full h-10" />
            </div>
          )}
        </div>

        {/* Provider Responses */}
        {responses.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('Provider Responses', 'پرووائیڈر کے جوابات')}</h3>
            <div className="space-y-2">
              {responses.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">{r.response_type?.replace('_', ' ')}</span>
                  {r.proposed_time && <span className="text-xs text-gray-500 dark:text-gray-400">{r.proposed_time}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}