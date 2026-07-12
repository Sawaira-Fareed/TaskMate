import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, Clock, CheckCircle, Star, ChevronRight, LogOut, Home, ClipboardList, Calendar, Bell, User } from 'lucide-react'
import { getCurrentUser, signOut } from '@/lib/auth'
import { supabase } from '@/lib/supabaseClient'
import ThemeToggle from '@/components/ThemeToggle'

export default function CustomerHome() {
  const navigate = useNavigate()
  const location = useLocation()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [activeRequests, setActiveRequests] = useState([])
  const [recentBookings, setRecentBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const t = (en, ur) => (lang === 'ur' ? ur : en)
  const toggleLanguage = (l) => { setLang(l); localStorage.setItem('zaria-language', l) }

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)

        const { data: profile } = await supabase.from('users').select('*').eq('id', currentUser.id).single()
        setUserProfile(profile)

        const { data: requests } = await supabase.from('requests').select('*').eq('customer_id', currentUser.id).in('status', ['pending', 'parsed', 'contacting', 'offered']).order('created_at', { ascending: false }).limit(5)
        setActiveRequests(requests || [])

        const { data: bookings } = await supabase.from('bookings').select('*').eq('customer_id', currentUser.id).order('created_at', { ascending: false }).limit(5)
        setRecentBookings(bookings || [])
      } catch (err) {
        console.error('Failed to load dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleSignOut = async () => { await signOut(); navigate('/login') }

  const statusBadge = (status) => {
    const styles = {
      confirmed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      completed: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      cancelled: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      pending: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      offered: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    }
    return styles[status] || 'bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
  }

  const sidebarLinks = [
    { icon: Home, label: t('Dashboard', 'ڈیش بورڈ'), path: '/customer/dashboard' },
    { icon: ClipboardList, label: t('My Requests', 'میری درخواستیں'), path: '/customer/my-requests' },
    { icon: Calendar, label: t('Bookings', 'بکنگز'), path: '/customer/bookings' },
    { icon: Bell, label: t('Notifications', 'اطلاعات'), path: '/customer/notifications' },
    { icon: User, label: t('Profile', 'پروفائل'), path: '/customer/profile' },
  ]

  const displayName = userProfile?.full_name || user?.user_metadata?.full_name || 'User'
  const firstName = displayName.split(' ')[0]
  const initial = firstName?.charAt(0)?.toUpperCase() || 'U'

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('Loading...', 'لوڈ ہو رہا ہے...')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} hidden lg:block`}>
        <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-100 dark:border-gray-800">
          <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0"><span className="text-white font-bold text-sm">Z</span></div>
          {sidebarOpen && <span className="text-lg font-bold text-gray-900 dark:text-white">Zaria</span>}
        </div>
        <nav className="p-3 space-y-1">
          {sidebarLinks.map((link, i) => {
          const isActive = link.path !== '/customer/dashboard' && location.pathname === link.path
            return (
              <button
                key={i}
                onClick={() => { if (!isActive) navigate(link.path) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${isActive ? 'bg-purple-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-purple-600 hover:text-white'}`}
              >
                <link.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>{link.label}</span>}
              </button>
            )
          })}
        </nav>
        <div className="absolute bottom-4 left-0 right-0 px-3">
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-purple-600 hover:text-white transition-all"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>{t('Sign Out', 'سائن آؤٹ')}</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 lg:px-6 h-16 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:block text-gray-500 dark:text-gray-400">☰</button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Dashboard', 'ڈیش بورڈ')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-purple-50 dark:bg-purple-900/30 p-1 rounded-lg">
              <button onClick={() => toggleLanguage('en')} className={`px-2 py-1 text-xs font-medium rounded ${lang === 'en' ? 'bg-purple-600 text-white' : 'text-purple-600 dark:text-purple-400'}`}>EN</button>
              <button onClick={() => toggleLanguage('ur')} className={`px-2 py-1 text-xs font-medium rounded ${lang === 'ur' ? 'bg-purple-600 text-white' : 'text-purple-600 dark:text-purple-400'}`}>اردو</button>
            </div>
            <ThemeToggle />
            <div className="flex items-center gap-2">
              {userProfile?.avatar_url ? (
                <img src={userProfile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-400 font-medium text-xs">{initial}</span>
                </div>
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">{firstName}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('Welcome back', 'خوش آمدید')}, {firstName} 👋</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('Need something done? Create a request and get offers from verified providers.', 'کچھ کروانا ہے؟ درخواست بنائیں اور تصدیق شدہ پرووائیڈرز سے پیشکشیں حاصل کریں۔')}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button onClick={() => navigate('/customer/create-request')} className="bg-purple-600 hover:bg-purple-700 text-white rounded-2xl p-5 transition-all hover:shadow-lg flex items-center gap-4 text-left">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><Plus className="w-6 h-6" /></div>
              <div><p className="font-semibold">{t('New Request', 'نئی درخواست')}</p><p className="text-xs text-purple-200">{t('Get started', 'شروع کریں')}</p></div>
            </button>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center"><Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" /></div>
              <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{activeRequests.length}</p><p className="text-xs text-gray-500 dark:text-gray-400">{t('Active Requests', 'فعال درخواستیں')}</p></div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center"><CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" /></div>
              <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{recentBookings.filter(b => b.status === 'completed').length}</p><p className="text-xs text-gray-500 dark:text-gray-400">{t('Completed', 'مکمل')}</p></div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center"><Star className="w-6 h-6 text-purple-600 dark:text-purple-400" /></div>
              <div><p className="text-2xl font-bold text-gray-900 dark:text-white">4.8</p><p className="text-xs text-gray-500 dark:text-gray-400">{t('Your Rating', 'آپ کی ریٹنگ')}</p></div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('Active Requests', 'فعال درخواستیں')}</h3>
              <button onClick={() => navigate('/customer/my-requests')} className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium flex items-center gap-1">{t('View All', 'سب دیکھیں')} <ChevronRight className="w-4 h-4" /></button>
            </div>
            {activeRequests.length === 0 ? (
              <div className="text-center py-8"><Clock className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" /><p className="text-sm text-gray-500 dark:text-gray-400">{t('No active requests', 'کوئی فعال درخواست نہیں')}</p><button onClick={() => navigate('/customer/create-request')} className="text-sm text-purple-600 dark:text-purple-400 font-medium mt-1">{t('Create one now', 'ابھی بنائیں')}</button></div>
            ) : (
              <div className="space-y-2">{activeRequests.map(req => (
                <button key={req.id} onClick={() => navigate(`/customer/request/${req.id}`)} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
                  <div><p className="text-sm font-medium text-gray-900 dark:text-white">{req.service_type || t('Request', 'درخواست')}</p><p className="text-xs text-gray-500 dark:text-gray-400">{new Date(req.created_at).toLocaleDateString()}</p></div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge(req.status)}`}>{req.status}</span>
                </button>
              ))}</div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('Recent Bookings', 'حالیہ بکنگز')}</h3>
              <button onClick={() => navigate('/customer/bookings')} className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium flex items-center gap-1">{t('View All', 'سب دیکھیں')} <ChevronRight className="w-4 h-4" /></button>
            </div>
            {recentBookings.length === 0 ? (
              <div className="text-center py-8"><Calendar className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" /><p className="text-sm text-gray-500 dark:text-gray-400">{t('No bookings yet', 'ابھی تک کوئی بکنگ نہیں')}</p></div>
            ) : (
              <div className="space-y-2">{recentBookings.map(booking => (
                <div key={booking.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div><p className="text-sm font-medium text-gray-900 dark:text-white">{booking.service_type}</p><p className="text-xs text-gray-500 dark:text-gray-400">{booking.scheduled_date} • {booking.scheduled_time}</p></div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge(booking.status)}`}>{booking.status}</span>
                </div>
              ))}</div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}