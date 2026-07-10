import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Clock, CheckCircle, XCircle, Star, ChevronRight, LogOut, Home, ClipboardList, Calendar, Bell, User, Settings, Search } from 'lucide-react'
import { getCurrentUser, signOut } from '@/lib/auth'
import { supabase } from "../../lib/supabaseClient";
import ThemeToggle from '@/components/ThemeToggle'


export default function CustomerHome() {
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [user, setUser] = useState(null)
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

        // Fetch active requests
        const { data: requests } = await supabase
          .from('requests')
          .select('*')
          .eq('customer_id', currentUser.id)
          .in('status', ['pending', 'parsed', 'contacting', 'offered'])
          .order('created_at', { ascending: false })
          .limit(5)
        setActiveRequests(requests || [])

        // Fetch recent bookings
        const { data: bookings } = await supabase
          .from('bookings')
          .select('*')
          .eq('customer_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(5)
        setRecentBookings(bookings || [])
      } catch (err) {
        console.error('Failed to load dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const statusBadge = (status) => {
    const styles = {
      confirmed: 'bg-emerald-50 text-emerald-700',
      completed: 'bg-blue-50 text-blue-700',
      cancelled: 'bg-red-50 text-red-700',
      pending: 'bg-amber-50 text-amber-700',
      offered: 'bg-purple-50 text-purple-700',
    }
    return styles[status] || 'bg-gray-50 text-gray-600'
  }

  const sidebarLinks = [
    { icon: Home, label: t('Dashboard', 'ڈیش بورڈ'), active: true, path: '/customer-home' },
    { icon: ClipboardList, label: t('My Requests', 'میری درخواستیں'), path: '/my-requests' },
    { icon: Calendar, label: t('Bookings', 'بکنگز'), path: '/my-bookings' },
    { icon: Bell, label: t('Notifications', 'اطلاعات'), path: '/notifications' },
    { icon: User, label: t('Profile', 'پروفائل'), path: '/profile' },
    { icon: Settings, label: t('Settings', 'ترتیبات'), path: '/settings' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">{t('Loading...', 'لوڈ ہو رہا ہے...')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 bg-white border-r border-gray-200 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} hidden lg:block`}>
        <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-100">
          <div className="w-9 h-9 bg-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">Z</span>
          </div>
          {sidebarOpen && <span className="text-lg font-bold text-gray-900">Zaria</span>}
        </div>
        <nav className="p-3 space-y-1">
          {sidebarLinks.map((link, i) => (
            <Link
              key={i}
              to={link.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${link.active ? 'bg-purple-50 text-purple-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <link.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{link.label}</span>}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-0 right-0 px-3">
          <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all ">
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>{t('Sign Out', 'سائن آؤٹ')}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 h-16 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:block text-gray-500 hover:text-gray-700">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="2" rx="1" fill="currentColor"/><rect x="2" y="9" width="16" height="2" rx="1" fill="currentColor"/><rect x="2" y="14" width="16" height="2" rx="1" fill="currentColor"/></svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">{t('Dashboard', 'ڈیش بورڈ')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-purple-50 p-1 rounded-lg">
              <button onClick={() => toggleLanguage('en')} className={`px-2 py-1 text-xs font-medium rounded transition-all ${lang === 'en' ? 'bg-purple-600 text-white' : 'text-purple-600'}`}>EN</button>
              <button onClick={() => toggleLanguage('ur')} className={`px-2 py-1 text-xs font-medium rounded transition-all ${lang === 'ur' ? 'bg-purple-600 text-white' : 'text-purple-600'}`}>اردو</button>
    
            </div>
            <ThemeToggle />
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-medium text-xs">{user?.email?.[0]?.toUpperCase() || 'U'}</span>
            </div>
          </div>
         
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 space-y-6">
          {/* Welcome */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900">{t('Welcome back', 'خوش آمدید')}, {user?.user_metadata?.full_name || 'User'} 👋</h2>
            <p className="text-sm text-gray-500 mt-1">{t('Need something done? Create a request and get offers from verified providers.', 'کچھ کروانا ہے؟ درخواست بنائیں اور تصدیق شدہ پرووائیڈرز سے پیشکشیں حاصل کریں۔')}</p>
          </div>

          {/* Quick Actions */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/create-request" className="bg-purple-600 hover:bg-purple-700 text-white rounded-2xl p-5 transition-all hover:shadow-lg hover:shadow-purple-200/30 flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><Plus className="w-6 h-6" /></div>
              <div><p className="font-semibold">{t('New Request', 'نئی درخواست')}</p><p className="text-xs text-purple-200">{t('Get started', 'شروع کریں')}</p></div>
            </Link>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center"><Clock className="w-6 h-6 text-amber-600" /></div>
              <div><p className="text-2xl font-bold text-gray-900">{activeRequests.length}</p><p className="text-xs text-gray-500">{t('Active Requests', 'فعال درخواستیں')}</p></div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center"><CheckCircle className="w-6 h-6 text-emerald-600" /></div>
              <div><p className="text-2xl font-bold text-gray-900">{recentBookings.filter(b => b.status === 'completed').length}</p><p className="text-xs text-gray-500">{t('Completed', 'مکمل')}</p></div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center"><Star className="w-6 h-6 text-purple-600" /></div>
              <div><p className="text-2xl font-bold text-gray-900">4.8</p><p className="text-xs text-gray-500">{t('Your Rating', 'آپ کی ریٹنگ')}</p></div>
            </div>
          </div>
         

          {/* Active Requests */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{t('Active Requests', 'فعال درخواستیں')}</h3>
              <Link to="/my-requests" className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">{t('View All', 'سب دیکھیں')} <ChevronRight className="w-4 h-4" /></Link>
            </div>
            {activeRequests.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">{t('No active requests', 'کوئی فعال درخواست نہیں')}</p>
                <Link to="/create-request" className="text-sm text-purple-600 font-medium mt-1 inline-block">{t('Create one now', 'ابھی بنائیں')}</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {activeRequests.map(req => (
                  <div key={req.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{req.service_type || t('Request', 'درخواست')}</p>
                      <p className="text-xs text-gray-500">{new Date(req.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge(req.status)}`}>{req.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Bookings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{t('Recent Bookings', 'حالیہ بکنگز')}</h3>
              <Link to="/my-bookings" className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">{t('View All', 'سب دیکھیں')} <ChevronRight className="w-4 h-4" /></Link>
            </div>
            {recentBookings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">{t('No bookings yet', 'ابھی تک کوئی بکنگ نہیں')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentBookings.map(booking => (
                  <div key={booking.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{booking.service_type}</p>
                      <p className="text-xs text-gray-500">{booking.scheduled_date} • {booking.scheduled_time}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge(booking.status)}`}>{booking.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}