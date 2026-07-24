import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, CheckCircle, Clock, XCircle, Star, MessageCircle, User, DollarSign, Wrench, Plug, ShoppingBag, Monitor, Bike, Car, Users, AlertTriangle, Loader2, WifiOff, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { getCurrentUser } from '@/lib/auth'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

const serviceIcons = { plumber: Wrench, electrician: Plug, grocery: ShoppingBag, computer_repair: Monitor, ride: Car }
const rideIcons = { bike: Bike, rickshaw: Users, car: Car }

export default function ProviderJobs() {
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('confirmed')
  const [cancelModal, setCancelModal] = useState(null)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [providerServices, setProviderServices] = useState([])
  const { isOnline, isSlow } = useNetworkStatus()

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  useEffect(() => {
    loadJobs()
    loadProviderInfo()
    const channel = supabase.channel('provider-jobs').on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => loadJobs()).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadProviderInfo() {
    const user = await getCurrentUser()
    const { data: provider } = await supabase.from('providers').select('service_types').eq('user_id', user.id).single()
    if (provider) setProviderServices(provider.service_types || [])
  }

  async function loadJobs() {
    try {
      const user = await getCurrentUser()
      const { data: provider } = await supabase.from('providers').select('id').eq('user_id', user.id).single()
      if (!provider) return
      const { data: bookings } = await supabase.from('bookings').select('*, customer:customer_id(full_name, phone)').eq('provider_id', provider.id).order('created_at', { ascending: false })
      const requestIds = (bookings || []).map(b => b.request_id).filter(Boolean)
      if (requestIds.length > 0) {
        const { data: requests } = await supabase.from('requests').select('id, is_ride, pickup_location, dropoff_location, vehicle_type, status').in('id', requestIds)
        const requestMap = (requests || []).reduce((acc, r) => { acc[r.id] = r; return acc }, {})
        const merged = (bookings || []).map(b => ({ ...b, request: requestMap[b.request_id] || null }))
        setJobs(merged)
      } else {
        setJobs(bookings || [])
      }
      setError(null)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function confirmCancelJob(jobId, requestId) {
    setCancelLoading(true)
    try {
      if (requestId) await supabase.from('requests').update({ status: 'cancelled' }).eq('id', requestId)
      await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', jobId)
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'cancelled' } : j))
      setSuccessMsg(t('Job cancelled', 'کام منسوخ کر دیا گیا'))
      setCancelModal(null)
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) { alert('Failed: ' + err.message) }
    finally { setCancelLoading(false) }
  }

  const hasRideService = providerServices.includes('ride')

  const tabs = [
    { id: 'confirmed', en: 'Incoming', ur: 'آنے والے', icon: Clock },
    ...(hasRideService ? [{ id: 'rides', en: 'Rides', ur: 'سواریاں', icon: Car }] : []),
    { id: 'completed', en: 'Completed', ur: 'مکمل', icon: CheckCircle },
    { id: 'cancelled', en: 'Cancelled', ur: 'منسوخ', icon: XCircle },
  ]

  const filtered = jobs.filter(j => {
    if (activeTab === 'rides') return j.request?.is_ride
    return j.status === activeTab
  })

  const stats = {
    confirmed: jobs.filter(j => j.status === 'confirmed').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    earnings: jobs.filter(j => j.status === 'completed').reduce((sum, j) => sum + (j.provider_earnings || 0), 0),
    total: jobs.length,
    monthlyEarnings: jobs.filter(j => j.status === 'completed' && new Date(j.created_at).getMonth() === new Date().getMonth()).reduce((sum, j) => sum + (j.provider_earnings || 0), 0),
  }

  const statusBadge = (s) => ({
    confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }[s] || 'bg-gray-100 text-gray-600')

  function formatTime(time) {
    if (!time) return ''
    const [h, m] = time.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const h12 = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)
    return `${h12}:${m} ${ampm}`
  }

  function getIcon(job) {
    if (job.request?.is_ride) return rideIcons[job.request?.vehicle_type] || Car
    return serviceIcons[job.service_type] || Wrench
  }

  if (!isOnline) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center"><WifiOff className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" /><h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('No Internet', 'انٹرنیٹ نہیں ہے')}</h3><button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium">{t('Retry', 'دوبارہ کوشش کریں')}</button></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      {isSlow && (<div className="sticky top-0 z-50 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs text-center py-1.5">{t('Slow connection', 'انٹرنیٹ سست ہے')}</div>)}
      {successMsg && (<div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-lg text-sm font-medium animate-pulse"><CheckCircle className="w-4 h-4 inline mr-1" /> {successMsg}</div>)}

      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3"><button onClick={() => navigate('/provider/dashboard', { replace: true })} className="text-gray-500 dark:text-gray-400"><ArrowLeft className="w-5 h-5" /></button><h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('My Jobs', 'میرے کام')}</h1></div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center border"><p className="text-lg font-bold text-blue-600">{stats.confirmed}</p><p className="text-[10px] text-gray-500">{t('Incoming', 'آنے والے')}</p></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center border"><p className="text-lg font-bold text-emerald-600">{stats.completed}</p><p className="text-[10px] text-gray-500">{t('Done', 'مکمل')}</p></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center border"><p className="text-lg font-bold text-amber-600">PKR {stats.earnings}</p><p className="text-[10px] text-gray-500">{t('Earned', 'کمایا')}</p></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center border"><p className="text-lg font-bold text-purple-600">PKR {stats.monthlyEarnings}</p><p className="text-[10px] text-gray-500">{t('This Month', 'اس ماہ')}</p></div>
        </div>

        <div className="flex gap-1 mb-4 bg-white dark:bg-gray-800 rounded-xl p-1 border">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-2.5 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 ${activeTab === tab.id ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400'}`}>
              <tab.icon className="w-3.5 h-3.5" /> {lang === 'ur' ? tab.ur : tab.en}
            </button>
          ))}
        </div>

        {loading && (
          <div className="space-y-3">{[1,2,3].map(i => (<div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 animate-pulse"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" /><div className="flex-1 space-y-2"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" /><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" /></div></div></div>))}</div>
        )}

        {!loading && error && (
          <div className="text-center py-20"><AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" /><p className="text-sm text-gray-500 mb-2">{error}</p><button onClick={loadJobs} className="inline-flex items-center gap-1 text-sm text-purple-600 font-medium"><RefreshCw className="w-4 h-4" /> {t('Retry', 'دوبارہ کوشش کریں')}</button></div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-20"><Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-500">{t('No jobs found', 'کوئی کام نہیں ملا')}</p></div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map(j => {
              const Icon = getIcon(j)
              const isRide = j.request?.is_ride
              const isChatDisabled = j.request?.status === 'cancelled' || j.request?.status === 'completed'
              return (
                <div key={j.id} className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl shadow-lg shadow-purple-500/20 p-4 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2"><div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center"><Icon className="w-4 h-4 text-white" /></div><div><p className="text-sm font-semibold capitalize">{isRide ? `${j.request?.vehicle_type || ''} Ride` : j.service_type}</p>{j.customer?.full_name && <p className="text-xs text-white/60">{j.customer.full_name}</p>}</div></div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge(j.status)}`}>{j.status}</span>
                  </div>

                  {isRide ? (
                    <div className="flex items-center gap-2 text-xs text-white/70 mb-2"><span>{j.request?.pickup_location}</span><span>→</span><span>{j.request?.dropoff_location}</span></div>
                  ) : (
                    <div className="flex items-center gap-3 text-xs text-white/70 mb-2"><span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {j.scheduled_date}</span><span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime(j.scheduled_time)}</span></div>
                  )}

                  <div className="flex items-center gap-3">
                    {j.rating && (<div className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /><span className="text-xs font-medium">{j.rating}/5</span></div>)}
                    {j.provider_earnings && (<div className="flex items-center gap-1 text-xs font-medium"><DollarSign className="w-3 h-3" /><span>PKR {j.provider_earnings}</span></div>)}
                  </div>

                  {j.status === 'confirmed' && !isChatDisabled && (
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/provider/chat/${j.id}`) }} className="mt-3 w-full py-2.5 bg-white hover:bg-white/90 text-purple-600 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors">
                      <MessageCircle className="w-4 h-4" /> {t('Chat with Customer', 'گاہک سے چیٹ کریں')}
                    </button>
                  )}

                  {j.status === 'confirmed' && (
                    <div className="mt-2 flex justify-center">
                      <button onClick={(e) => { e.stopPropagation(); setCancelModal(j) }} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all">
                        <XCircle className="w-3.5 h-3.5" /> {t('Cancel', 'منسوخ کریں')}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-7 h-7 text-red-500" /></div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('Cancel Job?', 'کام منسوخ کریں؟')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('The customer will be notified.', 'گاہک کو اطلاع کر دی جائے گی۔')}</p>
            <div className="flex gap-3">
              <button onClick={() => setCancelModal(null)} disabled={cancelLoading} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium">{t('Keep', 'رہنے دیں')}</button>
              <button onClick={() => confirmCancelJob(cancelModal.id, cancelModal.request_id)} disabled={cancelLoading} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                {cancelLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}{t('Cancel', 'منسوخ کریں')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}