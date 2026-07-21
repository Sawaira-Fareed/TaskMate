import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, CheckCircle, Clock, XCircle, Star, MessageCircle, User, DollarSign, Wrench, Plug, ShoppingBag, Monitor, Bike, Car, Users } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { getCurrentUser } from '@/lib/auth'

const serviceIcons = { plumber: Wrench, electrician: Plug, grocery: ShoppingBag, computer_repair: Monitor, ride: Car }
const rideIcons = { bike: Bike, rickshaw: Users, car: Car }

export default function ProviderJobs() {
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('confirmed')

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  useEffect(() => {
    loadJobs()
    const channel = supabase.channel('provider-jobs').on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => loadJobs()).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadJobs() {
    try {
      const user = await getCurrentUser()
      const { data: provider } = await supabase.from('providers').select('id').eq('user_id', user.id).single()
      if (!provider) return
      const { data: bookings } = await supabase.from('bookings').select('*, customer:customer_id(full_name, phone)').eq('provider_id', provider.id).order('created_at', { ascending: false })

      const requestIds = (bookings || []).map(b => b.request_id).filter(Boolean)
      if (requestIds.length > 0) {
        const { data: requests } = await supabase.from('requests').select('id, is_ride, pickup_location, dropoff_location, vehicle_type').in('id', requestIds)
        const requestMap = (requests || []).reduce((acc, r) => { acc[r.id] = r; return acc }, {})
        const merged = (bookings || []).map(b => ({ ...b, request: requestMap[b.request_id] || null }))
        setJobs(merged)
      } else {
        setJobs(bookings || [])
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const statusBadge = (s) => ({
    confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }[s] || 'bg-gray-100 text-gray-600')

 const tabs = [
  { id: 'confirmed', en: 'Incoming', ur: 'آنے والے', icon: Clock },
  { id: 'rides', en: 'Rides', ur: 'سواریاں', icon: Car, filter: (j) => j.request?.is_ride },
  { id: 'completed', en: 'Completed', ur: 'مکمل', icon: CheckCircle },
  { id: 'cancelled', en: 'Cancelled', ur: 'منسوخ', icon: XCircle },
]

 const filtered = jobs.filter(j => {
  if (activeTab === 'all') return true
  if (activeTab === 'rides') return j.request?.is_ride
  return j.status === activeTab
})

  const stats = {
    confirmed: jobs.filter(j => j.status === 'confirmed').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    earnings: jobs.filter(j => j.status === 'completed').reduce((sum, j) => sum + (j.provider_earnings || 0), 0),
    total: jobs.length,
  }

  function formatTime(time) {
    if (!time) return ''
    const [h, m] = time.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const h12 = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)
    return `${h12}:${m} ${ampm}`
  }

  function getIcon(job) {
    if (job.request?.is_ride) {
      return rideIcons[job.request?.vehicle_type] || Car
    }
    return serviceIcons[job.service_type] || Wrench
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/provider/dashboard', { replace: true })} className="text-gray-500 dark:text-gray-400"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('My Jobs', 'میرے کام')}</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center border"><p className="text-lg font-bold text-blue-600">{stats.confirmed}</p><p className="text-[10px] text-gray-500">{t('Incoming', 'آنے والے')}</p></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center border"><p className="text-lg font-bold text-emerald-600">{stats.completed}</p><p className="text-[10px] text-gray-500">{t('Done', 'مکمل')}</p></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center border"><p className="text-lg font-bold text-amber-600">PKR {stats.earnings}</p><p className="text-[10px] text-gray-500">{t('Earned', 'کمایا')}</p></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center border"><p className="text-lg font-bold text-gray-900 dark:text-white">{stats.total}</p><p className="text-[10px] text-gray-500">{t('Total', 'کل')}</p></div>
        </div>

        <div className="flex gap-1 mb-4 bg-white dark:bg-gray-800 rounded-xl p-1 border">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-2.5 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 ${activeTab === tab.id ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400'}`}>
              <tab.icon className="w-3.5 h-3.5" /> {lang === 'ur' ? tab.ur : tab.en}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20"><Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-500">{t('No jobs found', 'کوئی کام نہیں ملا')}</p></div>
        ) : (
          <div className="space-y-3">
            {filtered.map(j => {
              const Icon = getIcon(j)
              const isRide = j.request?.is_ride
              return (
                <div key={j.id} className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl shadow-lg shadow-purple-500/20 p-4 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold capitalize">
                          {isRide ? `${j.request?.vehicle_type || ''} Ride` : j.service_type}
                        </p>
                        {j.customer?.full_name && <p className="text-xs text-white/60">{j.customer.full_name}</p>}
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge(j.status)}`}>{j.status}</span>
                  </div>

                  {isRide ? (
                    <div className="flex items-center gap-2 text-xs text-white/70 mb-2">
                      <span>{j.request?.pickup_location}</span>
                      <span>→</span>
                      <span>{j.request?.dropoff_location}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-xs text-white/70 mb-2">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {j.scheduled_date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime(j.scheduled_time)}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    {j.rating && (
                      <div className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /><span className="text-xs font-medium">{j.rating}/5</span></div>
                    )}
                    {j.provider_earnings && (
                      <div className="flex items-center gap-1 text-xs font-medium"><DollarSign className="w-3 h-3" /><span>PKR {j.provider_earnings}</span></div>
                    )}
                  </div>

                  {j.status === 'confirmed' && (
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/provider/chat/${j.id}`) }} className="mt-3 w-full py-2.5 bg-white hover:bg-white/90 text-purple-600 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors">
                      <MessageCircle className="w-4 h-4" /> {t('Chat with Customer', 'گاہک سے چیٹ کریں')}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}