import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Clock, CheckCircle, DollarSign, Star, ChevronRight, LogOut, Home, ClipboardList, Bell, User } from 'lucide-react'
import { getCurrentUser, signOut } from '@/lib/auth'
import { supabase } from '@/lib/supabaseClient'
import ThemeToggle from '@/components/ThemeToggle'

export default function ProviderDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [user, setUser] = useState(null)
  const [provider, setProvider] = useState(null)
  const [incomingRequests, setIncomingRequests] = useState([])
  const [myJobs, setMyJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const t = (en, ur) => (lang === 'ur' ? ur : en)
  const toggleLanguage = (l) => { setLang(l); localStorage.setItem('zaria-language', l) }

  useEffect(() => {
    async function load() {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)

        const { data: providerData } = await supabase.from('providers').select('*').eq('user_id', currentUser.id).single()
        setProvider(providerData)

        // Only fetch requests matching provider's service types
        if (providerData?.service_types?.length > 0) {
          const { data: requests } = await supabase
            .from('requests')
            .select('*')
            .in('status', ['pending', 'contacting'])
            .in('service_type', providerData.service_types)
            .eq('city', 'Jand')
            .order('created_at', { ascending: false })
            .limit(10)
          setIncomingRequests(requests || [])
        }

        const { data: bookings } = await supabase
          .from('bookings')
          .select('*')
          .eq('provider_id', providerData?.id)
          .order('created_at', { ascending: false })
          .limit(10)
        setMyJobs(bookings || [])
      } catch (err) {
        console.error('Failed to load:', err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSignOut = async () => { await signOut(); navigate('/login') }

  const displayName = user?.user_metadata?.full_name || 'Provider'
  const firstName = displayName.split(' ')[0]
  const initial = firstName?.charAt(0)?.toUpperCase() || 'P'

  const sidebarLinks = [
    { icon: Home, label: t('Dashboard', 'ڈیش بورڈ'), path: '/provider/dashboard' },
    { icon: ClipboardList, label: t('My Jobs', 'میرے کام'), path: '/provider/jobs' },
    { icon: Bell, label: t('Notifications', 'اطلاعات'), path: '/provider/notifications' },
    { icon: User, label: t('Profile', 'پروفائل'), path: '/provider/profile' },
  ]

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} hidden lg:block`}>
        <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-100 dark:border-gray-800">
          <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0"><span className="text-white font-bold text-sm">Z</span></div>
          {sidebarOpen && <span className="text-lg font-bold text-gray-900 dark:text-white">Zaria</span>}
        </div>
        <nav className="p-3 space-y-1">
          {sidebarLinks.map((link, i) => {
            const isActive = link.path !== '/provider/dashboard' && location.pathname === link.path
            return (
              <button key={i} onClick={() => { if (!isActive) navigate(link.path) }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${isActive ? 'bg-purple-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-purple-600 hover:text-white'}`}>
                <link.icon className="w-5 h-5 flex-shrink-0" />{sidebarOpen && <span>{link.label}</span>}
              </button>
            )
          })}
        </nav>
        <div className="absolute bottom-4 left-0 right-0 px-3">
          <button onClick={handleSignOut} className="inline-flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-purple-600 hover:text-white transition-all">
            <LogOut className="w-5 h-5 flex-shrink-0" />{sidebarOpen && <span>{t('Sign Out', 'سائن آؤٹ')}</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 lg:px-6 h-16 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:block text-gray-500 dark:text-gray-400">☰</button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Provider Dashboard', 'پرووائیڈر ڈیش بورڈ')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-purple-50 dark:bg-purple-900/30 p-1 rounded-lg">
              <button onClick={() => toggleLanguage('en')} className={`px-2 py-1 text-xs font-medium rounded ${lang === 'en' ? 'bg-purple-600 text-white' : 'text-purple-600 dark:text-purple-400'}`}>EN</button>
              <button onClick={() => toggleLanguage('ur')} className={`px-2 py-1 text-xs font-medium rounded ${lang === 'ur' ? 'bg-purple-600 text-white' : 'text-purple-600 dark:text-purple-400'}`}>اردو</button>
            </div>
            <ThemeToggle />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-400 font-medium text-xs">{initial}</span>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">{firstName}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center"><Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" /></div>
              <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{incomingRequests.length}</p><p className="text-xs text-gray-500 dark:text-gray-400">{t('New Requests', 'نئی درخواستیں')}</p></div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center"><CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" /></div>
              <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{myJobs.filter(j => j.status === 'completed').length}</p><p className="text-xs text-gray-500 dark:text-gray-400">{t('Completed', 'مکمل')}</p></div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center"><DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" /></div>
              <div><p className="text-2xl font-bold text-gray-900 dark:text-white">0</p><p className="text-xs text-gray-500 dark:text-gray-400">{t('Earnings', 'آمدنی')}</p></div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center"><Star className="w-6 h-6 text-purple-600 dark:text-purple-400" /></div>
              <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{provider?.avg_rating || '--'}</p><p className="text-xs text-gray-500 dark:text-gray-400">{t('Rating', 'ریٹنگ')}</p></div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('Incoming Requests', 'آنے والی درخواستیں')}</h3>
            {incomingRequests.length === 0 ? (
              <div className="text-center py-8"><Clock className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" /><p className="text-sm text-gray-500 dark:text-gray-400">{t('No new requests', 'کوئی نئی درخواست نہیں')}</p></div>
            ) : (
              <div className="space-y-2">{incomingRequests.map(req => (
                <button key={req.id} onClick={() => navigate(`/provider/request/${req.id}`)} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
                  <div><p className="text-sm font-medium text-gray-900 dark:text-white">{req.service_type}</p><p className="text-xs text-gray-500 dark:text-gray-400">{req.preferred_date} • {req.preferred_time}</p></div>
                  <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </button>
              ))}</div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}