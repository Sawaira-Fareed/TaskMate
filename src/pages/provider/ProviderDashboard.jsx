import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Clock, CheckCircle, DollarSign, Star, ChevronRight, LogOut, Home, ClipboardList, Bell, User, TrendingUp, Zap, Wrench, Plug, ShoppingBag, Monitor } from 'lucide-react'
import { getCurrentUser, signOut } from '@/lib/auth'
import { supabase } from '@/lib/supabaseClient'
import ThemeToggle from '@/components/ThemeToggle'
import { useRealtimeRequests } from '@/hooks/useRealtimeRequests'

const serviceIcons = { plumber: Wrench, electrician: Plug, grocery: ShoppingBag, computer_repair: Monitor }

export default function ProviderDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [user, setUser] = useState(null)
  const [provider, setProvider] = useState(null)
  const [myJobs, setMyJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showSignout, setShowSignout] = useState(false)
  const [earnings, setEarnings] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)

  const t = (en, ur) => (lang === 'ur' ? ur : en)
  const toggleLanguage = (l) => { setLang(l); localStorage.setItem('zaria-language', l) }

  const { requests: incomingRequests, loading: requestsLoading } = useRealtimeRequests(user?.id)

  useEffect(() => {
    async function loadProvider() {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      const { data: providerData } = await supabase.from('providers').select('*, avg_rating, total_jobs, plan').eq('user_id', currentUser.id).single()
      setProvider(providerData)
    }
    loadProvider()
  }, [])

  useEffect(() => {
    async function fetchUnread() {
      const user = await getCurrentUser()
      if (!user) return
      const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false)
      setUnreadCount(count || 0)
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!provider?.id) return
    async function loadJobs() {
      const { data: bookings } = await supabase.from('bookings').select('*').eq('provider_id', provider.id).order('created_at', { ascending: false }).limit(20)
      setMyJobs(bookings || [])
      const total = (bookings || []).filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.provider_earnings || 0), 0)
      setEarnings(total)
    }
    loadJobs()
  }, [provider])

  useEffect(() => {
    if (user && provider && !requestsLoading) setLoading(false)
  }, [user, provider, requestsLoading])

  const handleSignOut = async () => { await signOut(); navigate('/login') }

  const displayName = user?.user_metadata?.full_name || 'Provider'
  const firstName = displayName.split(' ')[0]
  const initial = firstName?.charAt(0)?.toUpperCase() || 'P'
  const isPro = provider?.plan === 'pro'

  const sidebarLinks = [
    { icon: Home, label: t('Dashboard', 'ڈیش بورڈ'), path: '/provider/dashboard' },
    { icon: ClipboardList, label: t('My Jobs', 'میرے کام'), path: '/provider/jobs' },
    { icon: Bell, label: t('Notifications', 'اطلاعات'), path: '/provider/notifications' },
    { icon: User, label: t('Profile', 'پروفائل'), path: '/provider/profile' },
  ]

  const confirmedJobs = myJobs.filter(j => j.status === 'confirmed')

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      {/* Desktop Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} hidden lg:block`}>
        <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-100 dark:border-gray-800">
          <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20">
            <span className="text-white font-bold text-sm">Z</span>
          </div>
          {sidebarOpen && <span className="text-lg font-bold text-gray-900 dark:text-white">Zaria</span>}
        </div>
        <nav className="p-3 space-y-1 flex flex-col h-[calc(100%-4rem)]">
          <div className="flex-1 space-y-1">
            {sidebarLinks.map((link, i) => {
              const isActive = location.pathname === link.path
              return (
                <button key={i} onClick={() => { if (!isActive) navigate(link.path) }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left ${isActive ? 'bg-purple-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-gray-800 hover:text-purple-600 dark:hover:text-purple-400'}`}>
                  <link.icon className="w-5 h-5 flex-shrink-0" />{sidebarOpen && <span>{link.label}</span>}
                </button>
              )
            })}
          </div>
          <button onClick={() => setShowSignout(true)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400">
            <LogOut className="w-5 h-5 flex-shrink-0" />{sidebarOpen && <span>{t('Sign Out', 'سائن آؤٹ')}</span>}
          </button>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 lg:px-6 h-16 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:block text-gray-500 dark:text-gray-400">☰</button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Dashboard', 'ڈیش بورڈ')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 bg-purple-50 dark:bg-purple-900/30 p-1 rounded-lg">
              <button onClick={() => toggleLanguage('en')} className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${lang === 'en' ? 'bg-purple-600 text-white shadow-sm' : 'text-purple-600 dark:text-purple-400'}`}>EN</button>
              <button onClick={() => toggleLanguage('ur')} className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${lang === 'ur' ? 'bg-purple-600 text-white shadow-sm' : 'text-purple-600 dark:text-purple-400'}`}>اردو</button>
            </div>
            <ThemeToggle />
            <button onClick={() => navigate('/provider/notifications')} className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button onClick={() => navigate('/provider/profile')} className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <span className="text-purple-600 dark:text-purple-400 font-semibold text-xs">{initial}</span>
            </button>
          </div>
        </header>

<main className="flex-1 p-4 lg:p-6 space-y-5 max-w-5xl mx-auto w-full">
  {/* TOP SECTION: Incoming Requests + Stats */}
  <div className="flex flex-col lg:flex-row gap-4">
    {/* Incoming Requests — Purple Card */}
    <div className="w-full lg:w-[60%] bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl shadow-lg shadow-purple-500/20 p-5">
      <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5" /> {t('Incoming Requests', 'آنے والی درخواستیں')}
      </h3>
      {incomingRequests.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-10 h-10 text-white/30 mx-auto mb-2" />
          <p className="text-sm text-white/60">{t('No new requests', 'کوئی نئی درخواست نہیں')}</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {incomingRequests.slice(0, 6).map(req => {
            const Icon = serviceIcons[req.service_type] || Wrench
            return (
              <button key={req.id} onClick={() => navigate(`/provider/request/${req.id}`)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-left group shadow-sm">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{req.service_type}</p>
                  <p className="text-xs text-gray-500">{req.preferred_date} • {req.preferred_time}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors flex-shrink-0" />
              </button>
            )
          })}
        </div>
      )}
    </div>

    {/* Stats — 4 small cards */}
    <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 w-full lg:w-[40%]">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
          <Star className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{provider?.avg_rating || '--'}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('Rating', 'ریٹنگ')}</p>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{provider?.total_jobs || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('Jobs Done', 'مکمل کام')}</p>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">PKR {earnings.toLocaleString()}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('Earnings', 'آمدنی')}</p>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
          <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">{provider?.tier || 'bronze'}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('Tier', 'درجہ')} {isPro && '⭐'}</p>
        </div>
      </div>
    </div>
  </div>

  {/* UPGRADE PROMPT */}
  {!isPro && (
    <p className="text-center text-sm text-gray-500 dark:text-gray-400">
      {t('Want unlimited access?', 'لامحدود رسائی چاہیے؟')}{' '}
      <button onClick={() => navigate('/provider/profile')} className="text-purple-600 dark:text-purple-400 font-medium hover:underline">
        {t('Upgrade to PRO from your profile', 'اپنے پروفائل سے پرو میں اپ گریڈ کریں')}
      </button>
    </p>
  )}

  {/* BOTTOM: Confirmed Jobs */}
  <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl shadow-lg shadow-purple-500/20 p-5">
    <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
      <CheckCircle className="w-5 h-5" /> {t('Confirmed Jobs', 'تصدیق شدہ کام')}
    </h3>
    {confirmedJobs.length === 0 ? (
      <div className="text-center py-8">
        <CheckCircle className="w-10 h-10 text-white/30 mx-auto mb-2" />
        <p className="text-sm text-white/60">{t('No confirmed jobs', 'کوئی تصدیق شدہ کام نہیں')}</p>
      </div>
    ) : (
      <div className="space-y-2">
        {confirmedJobs.slice(0, 5).map(job => {
          const Icon = serviceIcons[job.service_type] || Wrench
          return (
            <button key={job.id} onClick={() => navigate(`/provider/chat/${job.id}`)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-left group shadow-sm">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{job.service_type}</p>
               <p className="text-xs text-gray-500">{job.scheduled_date} • {(() => { if (!job.scheduled_time) return ''; const [h, m] = job.scheduled_time.split(':'); const hour = parseInt(h); const ampm = hour >= 12 ? 'PM' : 'AM'; const h12 = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour); return `${h12}:${m} ${ampm}` })()}</p>
              </div>
              <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full font-medium flex-shrink-0">{t('Confirmed', 'تصدیق شدہ')}</span>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors flex-shrink-0" />
            </button>
          )
        })}
      </div>
    )}
  </div>
</main>
      </div>

      {/* Sign Out Modal */}
      {showSignout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('Sign Out', 'سائن آؤٹ')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('Are you sure you want to sign out?', 'کیا آپ واقعی سائن آؤٹ کرنا چاہتے ہیں؟')}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowSignout(false)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">{t('No, Stay', 'نہیں، رہنا ہے')}</button>
              <button onClick={handleSignOut} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-all hover:shadow-lg hover:shadow-red-500/25">{t('Yes, Sign Out', 'ہاں، سائن آؤٹ')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}