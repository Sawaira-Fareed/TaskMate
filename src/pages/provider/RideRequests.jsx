import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Navigation, Bike, Car, Users, Send, Clock, X, DollarSign } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { getCurrentUser } from '@/lib/auth'

const vehicleIcons = { bike: Bike, rickshaw: Users, car: Car }
const vehicleColors = {
  bike: 'from-orange-500 to-red-500',
  rickshaw: 'from-emerald-500 to-teal-500',
  car: 'from-blue-500 to-indigo-500',
}

export default function RideRequests() {
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [requests, setRequests] = useState([])
  const [provider, setProvider] = useState(null)
  const [loading, setLoading] = useState(true)
  const [offerModal, setOfferModal] = useState(null)
  const [fareAmount, setFareAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 3000)
    return () => clearInterval(interval)
  }, [])

  async function loadData() {
    try {
      const user = await getCurrentUser()
      const { data: prov } = await supabase.from('providers').select('id, vehicle_type').eq('user_id', user.id).single()
      if (!prov?.vehicle_type) { setLoading(false); return }
      setProvider(prov)

      // Get requests matching provider's vehicle type
      const { data: reqs } = await supabase
        .from('requests')
        .select('*')
        .eq('is_ride', true)
        .eq('vehicle_type', prov.vehicle_type)
        .eq('city', 'Jand')
        .in('status', ['pending', 'contacting'])
        .order('created_at', { ascending: false })

      // Filter out already responded
      const { data: responded } = await supabase
        .from('provider_responses')
        .select('request_id')
        .eq('provider_id', prov.id)

      const respondedIds = (responded || []).map(r => r.request_id)
      setRequests((reqs || []).filter(r => !respondedIds.includes(r.id)))
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function submitOffer() {
    if (!fareAmount || parseInt(fareAmount) < 20) {
      alert(t('Enter a valid fare (min PKR 20)', 'درست کرایہ درج کریں (کم از کم 20 روپے)'))
      return
    }
    setSubmitting(true)
    try {
      await supabase.from('provider_responses').insert({
        request_id: offerModal.id,
        provider_id: provider.id,
        response_type: 'counter_offer',
        fare_offer: parseInt(fareAmount),
        contact_order: 1,
        responded_at: new Date().toISOString()
      })
      // Remove from list
      setRequests(prev => prev.filter(r => r.id !== offerModal.id))
      setOfferModal(null)
      setFareAmount('')
    } catch (err) { alert('Failed: ' + err.message) }
    finally { setSubmitting(false) }
  }

  const VehicleIcon = vehicleIcons[provider?.vehicle_type] || Car
  const gradient = vehicleColors[provider?.vehicle_type] || 'from-purple-500 to-pink-500'

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-gray-400"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Ride Requests', 'سواری کی درخواستیں')}</h1>
      </header>

      <div className="max-w-lg mx-auto p-4">
        {!provider?.vehicle_type ? (
          <div className="text-center py-20">
            <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">{t('Set your vehicle type in profile', 'پروفائل میں گاڑی کی قسم سیٹ کریں')}</p>
            <button onClick={() => navigate('/provider/profile')} className="text-sm text-purple-600 font-medium mt-2">{t('Go to Profile', 'پروفائل پر جائیں')}</button>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">{t('No ride requests yet', 'ابھی تک کوئی سواری کی درخواست نہیں')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(req => (
              <div key={req.id} className={`bg-gradient-to-br ${gradient} rounded-2xl shadow-lg p-5 text-white`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <VehicleIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold capitalize">{req.vehicle_type} {t('Ride', 'سواری')}</p>
                    <p className="text-xs text-white/60">{new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-white/80">{req.pickup_location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-white/80">{req.dropoff_location}</span>
                  </div>
                </div>

                <button onClick={() => setOfferModal(req)}
                  className="w-full py-2.5 bg-white hover:bg-white/90 text-purple-700 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                  <DollarSign className="w-4 h-4" /> {t('Offer Your Fare', 'اپنا کرایہ پیش کریں')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fare Offer Modal */}
      {offerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('Offer Your Fare', 'کرایہ پیش کریں')}</h3>
              <button onClick={() => { setOfferModal(null); setFareAmount('') }} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 mb-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-gray-700 dark:text-gray-300">{offerModal.pickup_location}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-gray-700 dark:text-gray-300">{offerModal.dropoff_location}</span>
              </div>
            </div>

            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Your Fare (PKR)', 'آپ کا کرایہ (روپے)')}</label>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg font-bold text-gray-500">PKR</span>
              <input type="number" value={fareAmount} onChange={(e) => setFareAmount(e.target.value)} placeholder="100"
                className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-lg font-bold bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>

            <button onClick={submitOffer} disabled={submitting}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
              {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              {t('Submit Offer', 'پیشکش جمع کریں')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}