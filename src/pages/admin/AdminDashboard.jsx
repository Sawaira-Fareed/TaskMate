import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Users, UserCheck, Clock, CheckCircle, LogOut, Home, Settings, Crown, Bell } from 'lucide-react'
import { getCurrentUser, signOut } from '@/lib/auth'
import { supabase } from '@/lib/supabaseClient'
import ThemeToggle from '@/components/ThemeToggle'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalUsers: 0, pendingProviders: 0, totalCustomers: 0, totalRequests: 0, pendingProUpgrades: 0 })
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [adminName, setAdminName] = useState('')
  const [adminUserId, setAdminUserId] = useState(null)

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
        const { count: totalCustomers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'customer')
        const { count: totalRequests } = await supabase.from('requests').select('*', { count: 'exact', head: true })
        const { count: pendingProUpgrades } = await supabase.from('pro_upgrade_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending')

        setStats({
          totalUsers: totalUsers || 0,
          pendingProviders: pendingProviders || 0,
          totalCustomers: totalCustomers || 0,
          totalRequests: totalRequests || 0,
          pendingProUpgrades: pendingProUpgrades || 0,
        })
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
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

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} hidden lg:block`}>
        <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-100 dark:border-gray-800">
          <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-sm">Z</span></div>
          {sidebarOpen && <span className="text-lg font-bold text-gray-900 dark:text-white">Admin</span>}
        </div>
        <nav className="p-3 space-y-1">
          {sidebarLinks.map((link, i) => {
            const isActive = location.pathname === link.path
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

      <div className="flex-1">
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 lg:px-6 h-16 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:block text-gray-500 dark:text-gray-400">☰</button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Admin Dashboard', 'ایڈمن ڈیش بورڈ')}</h1>
          </div>
          <div className="flex items-center gap-3">
            {isSupported && !isSubscribed && (
              <button onClick={subscribe} className="text-xs text-purple-600 dark:text-purple-400 font-medium hover:underline">
                <Bell className="w-4 h-4 inline mr-1" />{t('Enable Alerts', 'الرٹس فعال کریں')}
              </button>
            )}
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

        <main className="p-4 lg:p-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center"><Users className="w-6 h-6 text-purple-600 dark:text-purple-400" /></div>
              <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p><p className="text-xs text-gray-500 dark:text-gray-400">{t('Total Users', 'کل صارفین')}</p></div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center"><Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" /></div>
              <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingProviders}</p><p className="text-xs text-gray-500 dark:text-gray-400">{t('Pending Providers', 'زیر التواء')}</p></div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center"><CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" /></div>
              <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCustomers}</p><p className="text-xs text-gray-500 dark:text-gray-400">{t('Customers', 'کسٹمرز')}</p></div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center"><Settings className="w-6 h-6 text-emerald-600 dark:text-emerald-400" /></div>
              <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalRequests}</p><p className="text-xs text-gray-500 dark:text-gray-400">{t('Total Requests', 'کل درخواستیں')}</p></div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-yellow-200 dark:border-yellow-800 p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center"><Crown className="w-6 h-6 text-yellow-600 dark:text-yellow-400" /></div>
              <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingProUpgrades}</p><p className="text-xs text-gray-500 dark:text-gray-400">{t('Pro Upgrades', 'پرو اپ گریڈ')}</p></div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}