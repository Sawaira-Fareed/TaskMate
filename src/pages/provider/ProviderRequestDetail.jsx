import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Calendar, DollarSign, Check, X, Clock } from 'lucide-react'
import { supabase } from "../../lib/supabaseClient";
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

  const t = (en, ur) => (lang === 'ur' ? ur : en)
  

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.from('requests').select('*').eq('id', id).single()
        setRequest(data)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [id])

  const handleAccept = async () => {
    setActionLoading(true)
    const user = await getCurrentUser()
    const { data: provider } = await supabase.from('providers').select('id').eq('user_id', user.id).single()
    await supabase.from('provider_responses').insert({ request_id: id, provider_id: provider.id, response_type: 'accepted' })
    await supabase.from('bookings').insert({ request_id: id, customer_id: request.customer_id, provider_id: provider.id, service_type: request.service_type, scheduled_date: request.preferred_date, scheduled_time: request.preferred_time, status: 'confirmed' })
    await supabase.from('requests').update({ status: 'confirmed' }).eq('id', id)
    navigate('/provider/dashboard')
  }

  const handleDecline = async () => {
    setActionLoading(true)
    const user = await getCurrentUser()
    const { data: provider } = await supabase.from('providers').select('id').eq('user_id', user.id).single()
    await supabase.from('provider_responses').insert({ request_id: id, provider_id: provider.id, response_type: 'declined' })
    navigate('/provider/dashboard')
  }

  const handleCounter = async () => {
    setActionLoading(true)
    const user = await getCurrentUser()
    const { data: provider } = await supabase.from('providers').select('id').eq('user_id', user.id).single()
    await supabase.from('provider_responses').insert({ request_id: id, provider_id: provider.id, response_type: 'counter_offer', proposed_time: counterPrice })
    navigate('/provider/dashboard')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>
  if (!request) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Request not found</p></div>

  return (
    <div className="min-h-screen bg-gray-50" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <header className="bg-white border-b border-gray-200 px-4 h-16 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="text-gray-500"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-semibold text-gray-900">{t('Request Detail', 'درخواست کی تفصیل')}</h1>
      </header>
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
          <h2 className="font-semibold text-gray-900">{request.service_type}</h2>
          <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4 text-gray-400" /><span>{request.preferred_date} • {request.preferred_time}</span></div>
          <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-gray-400" /><span>{request.parsed_intent?.location || 'Jand'}</span></div>
          <div className="flex items-center gap-2 text-sm"><DollarSign className="w-4 h-4 text-gray-400" /><span className="font-semibold">PKR {request.parsed_intent?.price || 'N/A'}</span></div>
          <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{request.raw_text}</p>
        </div>

        {showCounter && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <label className="block text-xs font-medium text-gray-700 mb-1">{t('Your Price (PKR)', 'آپ کی قیمت (روپے)')}</label>
            <input type="number" value={counterPrice} onChange={(e) => setCounterPrice(e.target.value)} placeholder="800" className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm mb-3" />
            <button onClick={handleCounter} disabled={!counterPrice || actionLoading} className="w-full bg-purple-600 text-white rounded-xl py-2.5 text-sm font-medium">{t('Submit Counter Offer', 'جوابی پیشکش جمع کریں')}</button>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={handleAccept} disabled={actionLoading} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 text-sm font-medium"><Check className="w-4 h-4" /> {t('Accept', 'قبول کریں')}</button>
          <button onClick={() => setShowCounter(!showCounter)} className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl py-3 text-sm font-medium"><Clock className="w-4 h-4" /> {t('Counter', 'جوابی')}</button>
          <button onClick={handleDecline} disabled={actionLoading} className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl py-3 text-sm font-medium"><X className="w-4 h-4" /> {t('Decline', 'مسترد')}</button>
        </div>
      </div>
    </div>
  )
}