import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, Calendar, Clock, User, Wrench, Plug, ShoppingBag, Monitor, CheckCircle, XCircle, AlertTriangle, Loader2, WifiOff, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { getCurrentUser } from '@/lib/auth'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

const serviceColors = {
  plumber: 'from-blue-400 to-cyan-300',
  electrician: 'from-amber-400 to-orange-300',
  grocery: 'from-emerald-400 to-teal-300',
  computer_repair: 'from-fuchsia-400 to-pink-300',
}

const serviceIcons = { plumber: Wrench, electrician: Plug, grocery: ShoppingBag, computer_repair: Monitor }

export default function MyBookings() {
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('upcoming')
  const { isOnline, isSlow } = useNetworkStatus()

  const t = (en, ur) => (lang === 'ur' ? ur : en)
  const toggleLanguage = (l) => { setLang(l); localStorage.setItem('zaria-language', l) }

  useEffect(() => {
    loadBookings()
    const interval = setInterval(loadBookings, 5000)
    return () => clearInterval(interval)
  }, [])

  async function loadBookings() {
    try {
      const user = await getCurrentUser()
      const { data: bookingsData } = await supabase.from('bookings').select('*').eq('customer_id', user.id).order('created_at', { ascending: false })

      if (!bookingsData?.length) {
        setBookings([])
        setError(null)
        setLoading(false)
        return
      }

      const providerIds = [...new Set(bookingsData.map(b => b.provider_id))]
      const { data: providersData } = await supabase.from('providers').select('id, avg_rating, user:user_id(full_name)').in('id', providerIds)

      const merged = bookingsData.map(b => ({ ...b, provider: providersData?.find(p => p.id === b.provider_id) || null }))
      setBookings(merged)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const statusBadge = (s) => ({
    confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-700',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-700',
  }[s] || 'bg-gray-100 text-gray-600 border-gray-200')

  const statusIcon = (s) => {
    if (s === 'completed') return <CheckCircle className="w-4 h-4 text-emerald-500" />
    if (s === 'confirmed') return <Clock className="w-4 h-4 text-blue-500" />
    return <XCircle className="w-4 h-4 text-red-500" />
  }

  const filtered = bookings.filter(b =>
    activeTab === 'upcoming' ? ['confirmed'].includes(b.status) :
    activeTab === 'completed' ? ['completed'].includes(b.status) :
    ['cancelled'].includes(b.status)
  )

  function formatTime(time) {
    if (!time) return ''
    const [h, m] = time.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const h12 = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)
    return `${h12}:${m} ${ampm}`
  }

  if (!isOnline) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <WifiOff className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('No Internet', 'انٹرنیٹ نہیں ہے')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('Check your connection', 'اپنا کنکشن چیک کریں')}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium">
            {t('Retry', 'دوبارہ کوشش کریں')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      {isSlow && (
        <div className="sticky top-0 z-50 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs text-center py-1.5">
          {t('Slow connection', 'انٹرنیٹ سست ہے')}
        </div>
      )}

      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/customer/dashboard', { replace: true })} className="text-gray-500 dark:text-gray-400"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('My Bookings', 'میری بکنگز')}</h1>
        </div>
        <div className="flex items-center gap-1 bg-purple-50 dark:bg-purple-900/30 p-1 rounded-lg">
          <button onClick={() => toggleLanguage('en')} className={`px-2 py-1 text-xs font-medium rounded ${lang === 'en' ? 'bg-purple-600 text-white' : 'text-purple-600 dark:text-purple-400'}`}>EN</button>
          <button onClick={() => toggleLanguage('ur')} className={`px-2 py-1 text-xs font-medium rounded ${lang === 'ur' ? 'bg-purple-600 text-white' : 'text-purple-600 dark:text-purple-400'}`}>اردو</button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        <div className="flex gap-2 mb-4 bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-100 dark:border-gray-700">
          {['upcoming', 'completed', 'cancelled'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === tab ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
              {tab === 'upcoming' ? t('Upcoming', 'آنے والے') : tab === 'completed' ? t('Completed', 'مکمل') : t('Cancelled', 'منسوخ')}
            </button>
          ))}
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-20">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{error}</p>
            <button onClick={loadBookings} className="inline-flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 font-medium">
              <RefreshCw className="w-4 h-4" /> {t('Retry', 'دوبارہ کوشش کریں')}
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-20">
            <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('No bookings', 'کوئی بکنگ نہیں')}</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map(b => {
              const service = b.service_type || 'plumber'
              const gradient = serviceColors[service] || 'from-purple-500 to-pink-500'

              return (
                <div key={b.id} className="relative bg-[#f5f0ff] dark:bg-gray-800 rounded-2xl shadow-sm border border-purple-100/40 dark:border-gray-700 overflow-hidden">
                  <div className="absolute top-0 right-0 w-[28%] h-full rounded-2xl overflow-hidden" style={{ clipPath: 'polygon(35% 0, 100% 0, 100% 100%, 0% 100%)' }}>
                    <div className={`w-full h-full bg-gradient-to-br ${gradient} opacity-100 dark:opacity-70`} />
                  </div>

                  <div className="relative p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {statusIcon(b.status)}
                        <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{service}</span>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${statusBadge(b.status)}`}>{b.status}</span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <Calendar className="w-3.5 h-3.5" /> {b.scheduled_date} • {formatTime(b.scheduled_time)}
                    </div>

                    {b.provider?.user?.full_name && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
                        <User className="w-3.5 h-3.5" /> {b.provider.user.full_name}
                        {b.provider.avg_rating && (
                          <span className="flex items-center gap-0.5 ml-1">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {b.provider.avg_rating}
                          </span>
                        )}
                      </div>
                    )}

                    {b.rating && (
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-xs text-amber-600 dark:text-amber-400">{b.rating}/5</span>
                      </div>
                    )}

                    {b.provider_earnings && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">PKR {b.provider_earnings}</p>
                    )}

                    {b.status === 'completed' && !b.rating && (
                      <button onClick={() => navigate(`/customer/rate/${b.id}`, { replace: true })} className="flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 font-medium hover:text-purple-700">
                        <Star className="w-4 h-4" /> {t('Rate Provider', 'پرووائیڈر کو ریٹ کریں')}
                      </button>
                    )}

                    {b.status === 'confirmed' && (
                      <button onClick={() => navigate(`/customer/request/${b.request_id}`)} className="mt-2 w-full py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                        {t('View Details', 'تفصیلات دیکھیں')}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}