import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Clock, CheckCircle, DollarSign, Star, ChevronRight, LogOut, Home, ClipboardList, Bell, User, TrendingUp, Zap } from 'lucide-react'
import { getCurrentUser, signOut } from '@/lib/auth'
import { supabase } from '@/lib/supabaseClient'
import ThemeToggle from '@/components/ThemeToggle'
import { useRealtimeRequests } from '@/hooks/useRealtimeRequests'

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
    if (!provider?.id) return
    async function loadJobs() {
      const { data: bookings } = await supabase.from('bookings').select('*').eq('provider_id', provider.id).order('created_at', { ascending: false }).limit(20)
      setMyJobs(bookings || [])
      const total = (bookings || []).filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.amount_paid || 0), 0)
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

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex page-enter" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
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
            <button onClick={() => navigate('/provider/profile')} className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 hover:shadow-md">
              <span className="text-purple-600 dark:text-purple-400 font-semibold text-xs">{initial}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 space-y-5 max-w-4xl mx-auto w-full">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{incomingRequests.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('New Requests', 'نئی درخواستیں')}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{myJobs.filter(j => j.status === 'completed').length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('Completed', 'مکمل')}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-2">
                <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">PKR {earnings.toLocaleString()}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('Earnings', 'آمدنی')}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-2">
                <Star className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{provider?.avg_rating || '--'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('Rating', 'ریٹنگ')}</p>
            </div>
          </div>
          
          {/* Upgrade Line */}
          {!isPro && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              {t('Want unlimited access?', 'لامحدود رسائی چاہیے؟')}{' '}
              <button onClick={() => navigate('/provider/profile')} className="text-purple-600 dark:text-purple-400 font-medium hover:underline">
                {t('Upgrade to PRO from your profile', 'اپنے پروفائل سے پرو میں اپ گریڈ کریں')}
              </button>
            </p>
          )}


          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{provider?.total_jobs || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('Total Jobs', 'کل کام')}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">{provider?.tier || 'bronze'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('Tier', 'درجہ')}</p>
              </div>
            </div>
          </div>
          {/* Incoming Requests */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-5 pb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('Incoming Requests', 'آنے والی درخواستیں')}</h3>
            </div>
            {incomingRequests.length === 0 ? (
              <div className="text-center py-10 px-5">
                <Clock className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('No new requests', 'کوئی نئی درخواست نہیں')}</p>
              </div>
            ) : (
              <div className="px-5 pb-4 space-y-2">
                {incomingRequests.map(req => (
                  <button key={req.id} onClick={() => navigate(`/provider/request/${req.id}`)} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 text-left group">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{req.service_type}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{req.preferred_date} • {req.preferred_time}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500 transition-colors" />
                  </button>
                ))}
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