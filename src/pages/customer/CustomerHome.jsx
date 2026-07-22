import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, Clock, CheckCircle, Star, ChevronRight, LogOut, Home, ClipboardList, Calendar, Bell, User, Search, Wrench, Plug, ShoppingBag, Monitor, Car, Briefcase } from 'lucide-react'
import { getCurrentUser, signOut } from '@/lib/auth'
import { supabase } from '@/lib/supabaseClient'
import ThemeToggle from '@/components/ThemeToggle'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { usePushNotifications } from '@/hooks/usePushNotifications'


const serviceColors = {
  plumber: 'from-blue-500 to-cyan-400',
  electrician: 'from-amber-500 to-orange-400',
  grocery: 'from-emerald-500 to-teal-400',
  computer_repair: 'from-violet-500 to-purple-400',
}

export default function CustomerHome() {
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [activeRequests, setActiveRequests] = useState([])
  const [recentBookings, setRecentBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showSignout, setShowSignout] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const { subscribe, isSubscribed, isSupported } = usePushNotifications(user?.id)
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
      } catch (err) { console.error('Failed to load dashboard:', err) }
      finally { setLoading(false) }
    }
    loadData()
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
    if (!user?.id) return
    const bookingsChannel = supabase.channel('customer-bookings').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings', filter: `customer_id=eq.${user.id}` }, () => {
      supabase.from('bookings').select('*').eq('customer_id', user.id).order('created_at', { ascending: false }).limit(5).then(({ data }) => { if (data) setRecentBookings(data) })
    }).subscribe()
    const requestsChannel = supabase.channel('customer-requests').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'requests', filter: `customer_id=eq.${user.id}` }, () => {
      supabase.from('requests').select('*').eq('customer_id', user.id).in('status', ['pending', 'parsed', 'contacting', 'offered']).order('created_at', { ascending: false }).limit(5).then(({ data }) => { if (data) setActiveRequests(data) })
    }).subscribe()
    return () => { supabase.removeChannel(bookingsChannel); supabase.removeChannel(requestsChannel) }
  }, [user])

  const handleSignOut = async () => { await signOut(); navigate('/login') }

  const statusBadge = (status) => {
    const styles = {
      confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      offered: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    }
    return styles[status] || 'bg-gray-100 text-gray-600'
  }

  const sidebarLinks = [
    { icon: Home, label: t('Dashboard', 'ڈیش بورڈ'), path: '/customer/dashboard' },
    { icon: Search, label: t('Providers', 'پرووائیڈرز'), path: '/customer/providers' },
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
      {/* DESKTOP SIDEBAR */}
      {!isMobile && (
        <aside className={`fixed lg:static inset-y-0 left-0 z-40 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
          <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-100 dark:border-gray-800">
            <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0"><span className="text-white font-bold text-sm">Z</span></div>
            {sidebarOpen && <span className="text-lg font-bold text-gray-900 dark:text-white">Zaria</span>}
          </div>
          <nav className="p-3 space-y-1">
            {sidebarLinks.map((link, i) => {
              const isActive = link.path !== '/customer/dashboard' && location.pathname === link.path
              return (
                <button key={i} onClick={() => { if (!isActive) navigate(link.path, { replace: true }) }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${isActive ? 'bg-purple-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-purple-600 hover:text-white'}`}>
                  <link.icon className="w-5 h-5 flex-shrink-0" />{sidebarOpen && <span>{link.label}</span>}
                </button>
              )
            })}
            <button onClick={() => setShowSignout(true)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400">
              <LogOut className="w-5 h-5 flex-shrink-0" />{sidebarOpen && <span>{t('Sign Out', 'سائن آؤٹ')}</span>}
            </button>
          </nav>
        </aside>
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30">
          <div className="px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-xs">Z</span></div>
              <h1 className="font-bold text-gray-900 dark:text-white">{t('Dashboard', 'ڈیش بورڈ')}</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 bg-purple-50 dark:bg-purple-900/30 p-1 rounded-lg">
                <button onClick={() => toggleLanguage('en')} className={`px-2 py-1 text-xs font-medium rounded ${lang === 'en' ? 'bg-purple-600 text-white' : 'text-purple-600 dark:text-purple-400'}`}>EN</button>
                <button onClick={() => toggleLanguage('ur')} className={`px-2 py-1 text-xs font-medium rounded ${lang === 'ur' ? 'bg-purple-600 text-white' : 'text-purple-600 dark:text-purple-400'}`}>اردو</button>
              </div>
              <ThemeToggle />
              <button onClick={() => navigate('/customer/notifications')} className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </button>
              {isSupported && !isSubscribed && (
  <button onClick={subscribe} className="text-xs text-purple-600 dark:text-purple-400 font-medium hover:underline px-2">
    {t('Enable Alerts', 'الرٹس فعال کریں')}
  </button>
)}
              <button onClick={() => navigate('/customer/profile')} className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center"><span className="text-purple-600 dark:text-purple-400 font-semibold text-xs">{initial}</span></button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 space-y-5 max-w-5xl mx-auto w-full">
          {/* TOP: Active Requests — Purple Card */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl shadow-lg shadow-purple-500/20 p-5 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2"><Clock className="w-5 h-5" /> {t('Active Requests', 'فعال درخواستیں')}</h3>
              <button onClick={() => navigate('/customer/my-requests')} className="text-sm text-white/70 hover:text-white font-medium flex items-center gap-1">{t('View All', 'سب')} <ChevronRight className="w-4 h-4" /></button>
            </div>
            {activeRequests.length === 0 ? (
              <div className="text-center py-6">
                <Clock className="w-8 h-8 text-white/30 mx-auto mb-2" />
                <p className="text-sm text-white/60">{t('No active requests', 'کوئی فعال درخواست نہیں')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeRequests.map(req => (
                  <button key={req.id} onClick={() => navigate(`/customer/request/${req.id}`)} className="w-full flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-left group">
                    <div>
                      <p className="text-sm font-medium text-white capitalize">{req.service_type}</p>
                      <p className="text-xs text-white/60">{new Date(req.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium bg-white/20 text-white`}>{req.status}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

         {/* MIDDLE: New Request Button (75%) + Stats (25%) */}
<div className="flex flex-col lg:flex-row gap-4">
  {/* New Request — Big Purple Button with Modal */}
  <button onClick={() => setShowRequestModal(true)} className="w-full lg:w-[75%] bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 rounded-2xl p-6 text-white text-left transition-all shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 active:scale-[0.98] flex items-center gap-5">
    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
      <Plus className="w-8 h-8" />
    </div>
    <div>
      <p className="text-xl font-bold">{t('New Request', 'نئی درخواست')}</p>
      <p className="text-sm text-white/70 mt-1">{t('Book a service or ride', 'سروس یا سواری بک کریں')}</p>
    </div>
  </button>

            {/* Stats — Stacked on right */}
            <div className="w-full lg:w-[25%] grid grid-cols-2 lg:grid-cols-1 gap-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{activeRequests.length}</p>
                  <p className="text-[10px] text-gray-500">{t('Active', 'فعال')}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{recentBookings.filter(b => b.status === 'completed').length}</p>
                  <p className="text-[10px] text-gray-500">{t('Done', 'مکمل')}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Search className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{t('Find', 'تلاش')}</p>
                  <p className="text-[10px] text-gray-500">{t('Providers', 'پرووائیڈرز')}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Star className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">4.8</p>
                  <p className="text-[10px] text-gray-500">{t('Rating', 'ریٹنگ')}</p>
                </div>
              </div>
            </div>
          </div>

         {/* BOTTOM: Recent Bookings */}
<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
  <div className="flex items-center justify-between mb-4">
    <h3 className="font-semibold text-gray-900 dark:text-white">{t('Recent Bookings', 'حالیہ بکنگز')}</h3>
    <button onClick={() => navigate('/customer/bookings')} className="text-sm text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">{t('View All', 'سب')} <ChevronRight className="w-4 h-4" /></button>
  </div>
  {recentBookings.length === 0 ? (
    <div className="text-center py-6"><Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-500">{t('No bookings yet', 'ابھی تک کوئی بکنگ نہیں')}</p></div>
  ) : (
    <div className="space-y-2">
      {recentBookings.map(booking => {
        const gradient = serviceColors[booking.service_type] || 'from-purple-500 to-pink-500'
        return (
          <button key={booking.id} onClick={() => navigate(`/customer/request/${booking.request_id || booking.id}`)} className="relative bg-purple-100 dark:bg-gray-800 rounded-2xl border border-purple-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all active:scale-[0.98] w-full text-left">
            <div className="absolute top-0 right-0 w-[25%] h-full" style={{ clipPath: 'polygon(35% 0, 100% 0, 100% 100%, 0% 100%)' }}>
              <div className={`w-full h-full bg-gradient-to-br ${gradient} opacity-70 dark:opacity-50`} />
            </div>
            <div className="relative p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{booking.service_type}</p>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge(booking.status)}`}>{booking.status}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{booking.scheduled_date} • {(() => { if (!booking.scheduled_time) return ''; const [h, m] = booking.scheduled_time.split(':'); const hour = parseInt(h); const ampm = hour >= 12 ? 'PM' : 'AM'; const h12 = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour); return `${h12}:${m} ${ampm}` })()}</p>
            </div>
          </button>
        )
      })}
    </div>
  )}

</div>
{(!userProfile?.role?.includes('provider')) && (
  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-5 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
        <Briefcase className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          {t('Want to earn with Zaria?', 'زریعہ کے ساتھ کمانا چاہتے ہیں؟')}
        </p>
        <p className="text-xs text-emerald-600 dark:text-emerald-500">
          {t('Become a provider — it\'s free!', 'پرووائیڈر بنیں — یہ مفت ہے!')}
        </p>
      </div>
    </div>
    <button onClick={() => navigate('/become-provider')}
      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors flex-shrink-0">
      {t('Get Started', 'شروع کریں')}
    </button>
  </div>
)}
        </main>
      </div>

      {/* REQUEST TYPE MODAL */}
{showRequestModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">{t('What do you need?', 'آپ کو کیا چاہیے؟')}</h3>
      <div className="space-y-3">
        <button onClick={() => { setShowRequestModal(false); navigate('/customer/create-request') }}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl text-base font-semibold flex items-center justify-center gap-3 hover:shadow-lg transition-all active:scale-95">
          <Wrench className="w-6 h-6" /> {t('Book a Service', 'سروس بک کریں')}
        </button>
        <button onClick={() => { setShowRequestModal(false); navigate('/customer/book-ride') }}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl text-base font-semibold flex items-center justify-center gap-3 hover:shadow-lg transition-all active:scale-95">
          <Car className="w-6 h-6" /> {t('Book a Ride', 'سواری بک کریں')}
        </button>
      </div>
      <button onClick={() => setShowRequestModal(false)} className="mt-4 text-sm text-gray-500 hover:text-gray-700">{t('Cancel', 'منسوخ')}</button>
    </div>
  </div>
)}

      {/* SIGN OUT MODAL */}
      {showSignout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4"><LogOut className="w-7 h-7 text-red-500" /></div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('Sign Out', 'سائن آؤٹ')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('Are you sure?', 'کیا آپ واقعی سائن آؤٹ کرنا چاہتے ہیں؟')}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowSignout(false)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium">{t('No', 'نہیں')}</button>
              <button onClick={handleSignOut} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium">{t('Yes', 'ہاں')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}