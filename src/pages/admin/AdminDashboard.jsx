import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Users, UserCheck, Clock, CheckCircle, LogOut, Home, Settings, Crown, Bell, WifiOff, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react'
import { getCurrentUser, signOut } from '@/lib/auth'
import { supabase } from '@/lib/supabaseClient'
import ThemeToggle from '@/components/ThemeToggle'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({ totalUsers: 0, pendingProviders: 0, totalCustomers: 0, totalRequests: 0, pendingProUpgrades: 0 })
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [adminName, setAdminName] = useState('')
  const [adminUserId, setAdminUserId] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showSignout, setShowSignout] = useState(false)
  const { isOnline, isSlow } = useNetworkStatus()

  const t = (en, ur) => (lang === 'ur' ? ur : en)
  const toggleLanguage = (l) => { setLang(l); localStorage.setItem('zaria-language', l) }
  const { subscribe, isSubscribed, isSupported } = usePushNotifications(adminUserId)

  useEffect(() => {
    async function load() {
      try {
        const user = await getCurrentUser()
        setAdminUserId(user?.id)
        setAdminName(user?.user_metadata?.full_name || 'Admin')
        const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true })
        const { count: pendingProviders } = await supabase.from('providers').select('*', { count: 'exact', head: true }).eq('is_approved', false)
        const { count: totalCustomers } = await supabase.from('users').select('*', { count: 'exact', head: true }).contains('role', ['customer'])
        const { count: totalRequests } = await supabase.from('requests').select('*', { count: 'exact', head: true })
        const { count: pendingProUpgrades } = await supabase.from('pro_upgrade_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending')
        setStats({ totalUsers: totalUsers || 0, pendingProviders: pendingProviders || 0, totalCustomers: totalCustomers || 0, totalRequests: totalRequests || 0, pendingProUpgrades: pendingProUpgrades || 0 })
        setError(null)
      } catch (err) { setError(err.message) }
      finally { setLoading(false) }
    }
    load()
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

  const handleSignOut = async () => { await signOut(); navigate('/login') }
  const firstName = adminName.split(' ')[0]
  const initial = firstName?.charAt(0)?.toUpperCase() || 'A'

  const sidebarLinks = [
    { icon: Home, label: t('Dashboard', 'ڈیش بورڈ'), path: '/admin/dashboard' },
    { icon: UserCheck, label: t('Approvals', 'منظوریاں'), path: '/admin/approvals' },
    { icon: Crown, label: t('Pro Upgrades', 'پرو اپ گریڈ'), path: '/admin/pro-upgrades' },
    { icon: Settings, label: t('Platform', 'پلیٹ فارم'), path: '/admin/platform' },
  ]

  if (!isOnline) {
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4"><div className="text-center"><WifiOff className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" /><h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('No Internet', 'انٹرنیٹ نہیں ہے')}</h3><button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium">{t('Retry', 'دوبارہ کوشش کریں')}</button></div></div>)
  }

  if (loading) return (<div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-purple-600 animate-spin" /></div>)
  if (error) return (<div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4"><div className="text-center"><AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" /><p className="text-sm text-gray-500 mb-2">{error}</p><button onClick={() => window.location.reload()} className="inline-flex items-center gap-1 text-sm text-purple-600 font-medium"><RefreshCw className="w-4 h-4" /> {t('Retry', 'دوبارہ کوشش کریں')}</button></div></div>)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      {isSlow && (<div className="sticky top-0 z-50 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs text-center py-1.5">{t('Slow connection', 'انٹرنیٹ سست ہے')}</div>)}

      <div className="flex flex-1">
        <aside className={`fixed lg:static inset-y-0 left-0 z-40 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} hidden lg:block`}>
          <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-100 dark:border-gray-800"><div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-sm">Z</span></div>{sidebarOpen && <span className="text-lg font-bold text-gray-900 dark:text-white">Admin</span>}</div>
          <nav className="p-3 space-y-1 flex flex-col h-[calc(100%-4rem)]">
            <div className="flex-1 space-y-1">
              {sidebarLinks.map((link, i) => {
                const isActive = location.pathname === link.path
                return (<button key={i} onClick={() => { if (!isActive) navigate(link.path) }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${isActive ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-gray-800 hover:text-purple-600 dark:hover:text-purple-400'}`}><link.icon className="w-5 h-5 flex-shrink-0" />{sidebarOpen && <span>{link.label}</span>}</button>)
              })}
            </div>
            <button onClick={() => setShowSignout(true)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"><LogOut className="w-5 h-5 flex-shrink-0" />{sidebarOpen && <span>{t('Sign Out', 'سائن آؤٹ')}</span>}</button>
          </nav>
        </aside>

        <div className="flex-1 flex flex-col min-h-0">
          <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 lg:px-6 h-16 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-3"><button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:block text-gray-500 dark:text-gray-400">☰</button><h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Dashboard', 'ڈیش بورڈ')}</h1></div>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/admin/notifications')} className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />{unreadCount > 0 && (<span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>)}</button>
              {isSupported && !isSubscribed && (<button onClick={subscribe} className="text-xs text-purple-600 dark:text-purple-400 font-medium hover:underline px-2">{t('Enable Alerts', 'الرٹس فعال کریں')}</button>)}
              <div className="flex items-center gap-1 bg-purple-50 dark:bg-purple-900/30 p-1 rounded-lg"><button onClick={() => toggleLanguage('en')} className={`px-2 py-1 text-xs font-medium rounded ${lang === 'en' ? 'bg-purple-600 text-white' : 'text-purple-600 dark:text-purple-400'}`}>EN</button><button onClick={() => toggleLanguage('ur')} className={`px-2 py-1 text-xs font-medium rounded ${lang === 'ur' ? 'bg-purple-600 text-white' : 'text-purple-600 dark:text-purple-400'}`}>اردو</button></div>
              <ThemeToggle />
              <button onClick={() => setShowSignout(true)} className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center"><span className="text-purple-600 dark:text-purple-400 font-semibold text-xs">{initial}</span></button>
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
              <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-4 text-white shadow-lg shadow-purple-500/20"><div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-2"><Users className="w-5 h-5" /></div><p className="text-2xl font-bold">{stats.totalUsers}</p><p className="text-xs text-white/70">{t('Total Users', 'کل صارفین')}</p></div>
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white shadow-lg shadow-amber-500/20"><div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-2"><Clock className="w-5 h-5" /></div><p className="text-2xl font-bold">{stats.pendingProviders}</p><p className="text-xs text-white/70">{t('Pending', 'زیر التواء')}</p></div>
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-4 text-white shadow-lg shadow-blue-500/20"><div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-2"><CheckCircle className="w-5 h-5" /></div><p className="text-2xl font-bold">{stats.totalCustomers}</p><p className="text-xs text-white/70">{t('Customers', 'کسٹمرز')}</p></div>
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white shadow-lg shadow-emerald-500/20"><div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-2"><Settings className="w-5 h-5" /></div><p className="text-2xl font-bold">{stats.totalRequests}</p><p className="text-xs text-white/70">{t('Requests', 'درخواستیں')}</p></div>
              <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl p-4 text-white shadow-lg shadow-yellow-500/20"><div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-2"><Crown className="w-5 h-5" /></div><p className="text-2xl font-bold">{stats.pendingProUpgrades}</p><p className="text-xs text-white/70">{t('Pro Upgrades', 'پرو اپ گریڈ')}</p></div>
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Nav — ALL options */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-40">
        <div className="flex items-center justify-around py-2 px-1">
          <button onClick={() => navigate('/admin/dashboard')} className={`flex flex-col items-center gap-0.5 px-1 py-1 rounded-lg text-[10px] font-medium ${location.pathname === '/admin/dashboard' ? 'text-purple-600' : 'text-gray-500 dark:text-gray-400'}`}><Home className="w-5 h-5" /><span>{t('Home', 'ہوم')}</span></button>
          <button onClick={() => navigate('/admin/approvals')} className={`flex flex-col items-center gap-0.5 px-1 py-1 rounded-lg text-[10px] font-medium ${location.pathname === '/admin/approvals' ? 'text-purple-600' : 'text-gray-500 dark:text-gray-400'}`}><UserCheck className="w-5 h-5" /><span>{t('Approvals', 'منظوری')}</span></button>
          <button onClick={() => navigate('/admin/pro-upgrades')} className={`flex flex-col items-center gap-0.5 px-1 py-1 rounded-lg text-[10px] font-medium ${location.pathname === '/admin/pro-upgrades' ? 'text-purple-600' : 'text-gray-500 dark:text-gray-400'}`}><Crown className="w-5 h-5" /><span>{t('Pro', 'پرو')}</span></button>
          <button onClick={() => navigate('/admin/notifications')} className={`flex flex-col items-center gap-0.5 px-1 py-1 rounded-lg text-[10px] font-medium relative ${location.pathname === '/admin/notifications' ? 'text-purple-600' : 'text-gray-500 dark:text-gray-400'}`}><Bell className="w-5 h-5" />{unreadCount > 0 && (<span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>)}<span>{t('Alerts', 'الرٹس')}</span></button>
          <button onClick={() => setShowSignout(true)} className="flex flex-col items-center gap-0.5 px-1 py-1 rounded-lg text-[10px] font-medium text-gray-500 dark:text-gray-400"><LogOut className="w-5 h-5" /><span>{t('Sign Out', 'سائن آؤٹ')}</span></button>
        </div>
      </div>

      {/* Sign Out Modal */}
      {showSignout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4"><LogOut className="w-7 h-7 text-red-500" /></div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('Sign Out', 'سائن آؤٹ')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('Are you sure?', 'کیا آپ واقعی سائن آؤٹ کرنا چاہتے ہیں؟')}</p>
            <div className="flex gap-3"><button onClick={() => setShowSignout(false)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium">{t('No', 'نہیں')}</button><button onClick={handleSignOut} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium">{t('Yes', 'ہاں')}</button></div>
          </div>
        </div>
      )}
    </div>
  )
}