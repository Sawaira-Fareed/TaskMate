import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Navigation, Bike, Car, Users, X, Check, Clock, Star, Phone, MessageCircle, Loader2, Send } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { getCurrentUser } from '@/lib/auth'

const jandLocations = [
  'Mohalla Ghousia', 'Jand Chowk', 'Jand Bus Stand',
  'Jand Railway Station', 'Mohalla Islamia', 'Mohalla Azam',
  'Jand Degree College', 'Jand Hospital', 'Jand Bazaar',
  'Thatti', 'Langar', 'Mial', 'Jhamat', 'Dhok'
]

const vehicleTypes = [
  { id: 'bike', icon: Bike, label: 'Bike', labelUr: 'بائیک', color: 'from-orange-500 to-red-500', bg: 'bg-orange-50 dark:bg-orange-900/20', textColor: 'text-orange-600 dark:text-orange-400' },
  { id: 'rickshaw', icon: Users, label: 'Rickshaw', labelUr: 'رکشہ', color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', textColor: 'text-emerald-600 dark:text-emerald-400' },
  { id: 'car', icon: Car, label: 'Car', labelUr: 'کار', color: 'from-blue-500 to-indigo-500', bg: 'bg-blue-50 dark:bg-blue-900/20', textColor: 'text-blue-600 dark:text-blue-400' },
]
function sanitize(str) {
  if (!str) return str
  return str.replace(/[<>{}]/g, '').trim()
}

export default function BookRide() {
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [step, setStep] = useState('form') // form | offers | confirmed
  const [vehicle, setVehicle] = useState('')
  const [pickup, setPickup] = useState('')
  const [dropoff, setDropoff] = useState('')
  const [pickupSuggestions, setPickupSuggestions] = useState([])
  const [dropoffSuggestions, setDropoffSuggestions] = useState([])
  const [showPickupDropdown, setShowPickupDropdown] = useState(false)
  const [showDropoffDropdown, setShowDropoffDropdown] = useState(false)
  const [gettingPickup, setGettingPickup] = useState(false)
  const [offers, setOffers] = useState([])
  const [selectedOffer, setSelectedOffer] = useState(null)
  const [requestId, setRequestId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expiringOffers, setExpiringOffers] = useState([])
  const pickupRef = useRef(null)
  const dropoffRef = useRef(null)

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  // Filter locations for autocomplete
  function filterLocations(query) {
    if (!query) return []
    return jandLocations.filter(l => l.toLowerCase().includes(query.toLowerCase()))
  }

  // Get current location via GPS
  function getCurrentPickup() {
    if (!navigator.geolocation) { alert('GPS not supported'); return }
    setGettingPickup(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPickup(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`)
        setGettingPickup(false)
      },
      () => { alert('Could not get location'); setGettingPickup(false) },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Submit ride request
  async function submitRideRequest() {
    if (!vehicle || !pickup || !dropoff) { setError(t('Fill all fields', 'تمام فیلڈز بھریں')); return }
    setLoading(true)
    setError('')
    try {
      const user = await getCurrentUser()

      const sanitizedPickup = sanitize(pickup)
const sanitizedDropoff = sanitize(dropoff)

const { data: req, error: insertErr } = await supabase.from('requests').insert({
  customer_id: user.id,
  raw_text: sanitize(`${vehicle} ride from ${pickup} to ${dropoff}`),
  service_type: 'ride',
  is_ride: true,
  pickup_location: sanitizedPickup,
  dropoff_location: sanitizedDropoff,
  vehicle_type: vehicle,
  city: 'Jand',
  status: 'contacting',
  preferred_date: new Date().toISOString().split('T')[0],
  preferred_time: new Date().toTimeString().slice(0, 5),
  parsed_intent: { pickup: sanitizedPickup, dropoff: sanitizedDropoff, vehicle },
  expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
}).select().single()

      if (insertErr) throw insertErr
      setRequestId(req.id)
      setStep('offers')
      // Start polling for offers
      pollOffers(req.id)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  // Poll for incoming offers
  function pollOffers(rid) {
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('provider_responses')
        .select('*, provider:provider_id(id, user:user_id(full_name, phone), vehicle_type, avg_rating)')
        .eq('request_id', rid)
        .eq('response_type', 'counter_offer')
        .order('fare_offer', { ascending: true })

      if (data?.length) {
        setOffers(data)
        // Mark expiring offers (older than 8 seconds)
        const now = Date.now()
        setExpiringOffers(data.filter(o => now - new Date(o.created_at).getTime() > 8000).map(o => o.id))
      }
    }, 2000)

    // Clear after 10 minutes
    setTimeout(() => clearInterval(interval), 10 * 60 * 1000)
  }
async function acceptOffer(offer) {
  setLoading(true)
  try {
    await supabase.from('provider_responses').update({ response_type: 'accepted', customer_response: 'accepted' }).eq('id', offer.id)
    
    // Get the request to find customer_id
    const { data: req } = await supabase.from('requests').select('customer_id').eq('id', requestId).single()
    
    const { error: bookingErr } = await supabase.from('bookings').insert({
      request_id: requestId,
      customer_id: req?.customer_id,
      provider_id: offer.provider_id,
      service_type: 'ride',
      scheduled_date: new Date().toISOString().split('T')[0],
      scheduled_time: new Date().toTimeString().slice(0, 5),
      status: 'confirmed'
    })
    
    if (bookingErr) throw bookingErr
    
    await supabase.from('requests').update({ status: 'confirmed' }).eq('id', requestId)
    navigate(`/customer/request/${requestId}`, { replace: true })
  } catch (err) { alert('Failed: ' + err.message) }
  finally { setLoading(false) }
}
  // Cancel ride
  async function cancelRide() {
    if (!confirm(t('Cancel ride?', 'سواری منسوخ کریں؟'))) return
    await supabase.from('requests').update({ status: 'cancelled' }).eq('id', requestId)
    navigate('/customer/dashboard', { replace: true })
  }

  const vehicleInfo = vehicleTypes.find(v => v.id === vehicle)
  const VehicleIcon = vehicleInfo?.icon || Bike

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-gray-400"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Book a Ride', 'سواری بک کریں')}</h1>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* STATE 1: FORM */}
        {step === 'form' && (
          <>
            {/* Vehicle Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{t('Select Vehicle', 'گاڑی منتخب کریں')}</h3>
              <div className="grid grid-cols-3 gap-2">
                {vehicleTypes.map(v => (
                  <button key={v.id} onClick={() => setVehicle(v.id)}
                    className={`p-4 rounded-2xl text-center transition-all duration-200 ${vehicle === v.id ? `${v.bg} border-2 border-current ${v.textColor} shadow-md` : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
                    <v.icon className="w-7 h-7 mx-auto mb-1.5" />
                    <p className="text-xs font-semibold">{lang === 'ur' ? v.labelUr : v.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Pickup & Dropoff */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 space-y-4">
              {/* Pickup */}
              <div className="relative" ref={pickupRef}>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" /> {t('Pickup Location', 'سواری کی جگہ')}
                </label>
                <div className="flex gap-2">
                  <input type="text" value={pickup} onChange={(e) => { setPickup(e.target.value); setPickupSuggestions(filterLocations(e.target.value)); setShowPickupDropdown(true) }} onFocus={() => setShowPickupDropdown(true)}
                    placeholder={t('Enter pickup location', 'سواری کی جگہ لکھیں')}
                    className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl px-3.5 py-3 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                  <button onClick={getCurrentPickup} disabled={gettingPickup} className="px-4 py-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl text-xs font-medium hover:bg-purple-200">
                    {gettingPickup ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                  </button>
                </div>
                {showPickupDropdown && pickupSuggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                    {pickupSuggestions.map(loc => (
                      <button key={loc} onClick={() => { setPickup(loc); setShowPickupDropdown(false) }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20">
                        <MapPin className="w-3.5 h-3.5 inline mr-2 text-gray-400" />{loc}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dropoff */}
              <div className="relative" ref={dropoffRef}>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" /> {t('Dropoff Location', 'منزل')}
                </label>
                <input type="text" value={dropoff} onChange={(e) => { setDropoff(e.target.value); setDropoffSuggestions(filterLocations(e.target.value)); setShowDropoffDropdown(true) }} onFocus={() => setShowDropoffDropdown(true)}
                  placeholder={t('Enter dropoff location', 'منزل لکھیں')}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3.5 py-3 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
                {showDropoffDropdown && dropoffSuggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                    {dropoffSuggestions.map(loc => (
                      <button key={loc} onClick={() => { setDropoff(loc); setShowDropoffDropdown(false) }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20">
                        <MapPin className="w-3.5 h-3.5 inline mr-2 text-gray-400" />{loc}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {error && <div className="bg-red-50 text-red-600 text-xs rounded-xl p-3">{error}</div>}

            <button onClick={submitRideRequest} disabled={loading || !vehicle || !pickup || !dropoff}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-2xl text-base font-semibold transition-all shadow-lg shadow-purple-500/20 active:scale-95">
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t('Find Rides', 'سواری تلاش کریں')}
            </button>
          </>
        )}

        {/* STATE 2: OFFERS */}
        {step === 'offers' && (
          <>
            <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-5 text-white text-center shadow-lg">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-white/70" />
              <h3 className="font-semibold text-lg">{t('Finding Rides...', 'سواریاں تلاش ہو رہی ہیں...')}</h3>
              <p className="text-sm text-white/60 mt-1">{t('Drivers are being notified', 'ڈرائیورز کو اطلاع دی جا رہی ہے')}</p>
              <button onClick={cancelRide} className="mt-4 text-sm text-white/70 hover:text-white underline">{t('Cancel', 'منسوخ کریں')}</button>
            </div>

            {offers.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">{t('Offers', 'پیشکشیں')} ({offers.length})</h3>
                {offers.map(offer => (
                  <div key={offer.id} className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 transition-all duration-500 ${expiringOffers.includes(offer.id) ? 'opacity-50 scale-95' : 'opacity-100'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${vehicleInfo?.bg || 'bg-purple-100'}`}>
                          <VehicleIcon className={`w-5 h-5 ${vehicleInfo?.textColor || 'text-purple-600'}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{offer.provider?.user?.full_name || 'Driver'}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span>{offer.provider?.avg_rating || '--'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-purple-600">PKR {offer.fare_offer}</p>
                        <button onClick={() => acceptOffer(offer)} disabled={loading}
                          className="mt-2 px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors">
                          {t('Accept', 'قبول کریں')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* STATE 3: CONFIRMED */}
        {step === 'confirmed' && selectedOffer && (
          <div className="space-y-4">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 text-center border border-emerald-200 dark:border-emerald-800">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{t('Ride Confirmed!', 'سواری کنفرم!')}</h3>
              <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-1">PKR {selectedOffer.fare_offer}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${vehicleInfo?.bg || 'bg-purple-100'}`}>
                  <VehicleIcon className={`w-7 h-7 ${vehicleInfo?.textColor || 'text-purple-600'}`} />
                </div>
                <div>
                  <p className="font-bold text-lg text-gray-900 dark:text-white">{selectedOffer.provider?.user?.full_name}</p>
                  <div className="flex items-center gap-1 text-sm text-amber-600">
                    <Star className="w-4 h-4 fill-amber-400" /> {selectedOffer.provider?.avg_rating || '--'}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {selectedOffer.provider?.user?.phone && (
                  <a href={`https://wa.me/${selectedOffer.provider.user.phone.replace(/\D/g, '')}`} target="_blank"
                    className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1.5">
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </a>
                )}
                {selectedOffer.provider?.user?.phone && (
                  <a href={`tel:${selectedOffer.provider.user.phone}`}
                    className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1.5">
                    <Phone className="w-4 h-4" /> {t('Call', 'کال')}
                  </a>
                )}
              </div>
            </div>

            <button onClick={cancelRide}
              className="w-full py-3 bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-800 rounded-2xl text-sm font-medium">
              {t('Cancel Ride', 'سواری منسوخ کریں')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}