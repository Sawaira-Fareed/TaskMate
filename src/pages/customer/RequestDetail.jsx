import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Clock, MapPin, DollarSign, Calendar, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from "../../lib/supabaseClient";

export default function RequestDetail() {
  const { id } = useParams()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [request, setRequest] = useState(null)
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  useEffect(() => {
    async function load() {
      const { data: req } = await supabase.from('requests').select('*').eq('id', id).single()
      const { data: res } = await supabase.from('provider_responses').select('*, providers(*)').eq('request_id', id)
      setRequest(req)
      setResponses(res || [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>
  if (!request) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Request not found</p></div>

  return (
    <div className="min-h-screen bg-gray-50" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <header className="bg-white border-b border-gray-200 px-4 h-16 flex items-center gap-3 sticky top-0 z-30">
        <Link to="/my-requests" className="text-gray-500"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-lg font-semibold text-gray-900">{t('Request Detail', 'درخواست کی تفصیل')}</h1>
      </header>
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
          <div className="flex items-center justify-between"><span className="text-xs text-gray-500">{t('Status', 'اسٹیٹس')}</span><span className="text-xs px-2.5 py-1 rounded-full font-medium bg-purple-50 text-purple-700">{request.status}</span></div>
          <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4 text-gray-400" /><span>{request.preferred_date} • {request.preferred_time}</span></div>
          <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-gray-400" /><span>{request.parsed_intent?.location || 'Jand'}</span></div>
          <div className="flex items-center gap-2 text-sm"><DollarSign className="w-4 h-4 text-gray-400" /><span>PKR {request.parsed_intent?.price || 'N/A'}</span></div>
          <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{request.raw_text}</p>
        </div>

        {responses.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">{t('Provider Responses', 'پرووائیڈر کے جوابات')}</h3>
            <div className="space-y-2">
              {responses.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm font-medium">{r.response_type}</span>
                  {r.proposed_time && <span className="text-xs text-gray-500">{r.proposed_time}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}