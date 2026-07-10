import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Users, UserCheck, Clock, CheckCircle, XCircle, LogOut, Home, ClipboardList, Settings } from 'lucide-react'
import { getCurrentUser, signOut } from '../lib/auth'
import { supabase } from '../lib/supabaseClient'
import ThemeToggle from '../components/ThemeToggle'
export default function AdminDashboard() {
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalUsers: 0, pendingProviders: 0, pendingCustomers: 0, totalRequests: 0 })
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const t = (en, ur) => (lang === 'ur' ? ur : en)
  const toggleLanguage = (l) => { setLang(l); localStorage.setItem('zaria-language', l) }

  useEffect(() => {
    async function load() {
      try {
        const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true })
        const { count: pendingProviders } = await supabase.from('providers').select('*', { count: 'exact', head: true }).eq('is_approved', false)
        const { count: pendingCustomers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'customer')
        const { count: totalRequests } = await supabase.from('requests').select('*', { count: 'exact', head: true })
        setStats({ totalUsers: totalUsers || 0, pendingProviders: pendingProviders || 0, pendingCustomers: pendingCustomers || 0, totalRequests: totalRequests || 0 })
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const handleSignOut = async () => { await signOut(); navigate('/login') }

  const sidebarLinks = [
    { icon: Home, label: t('Dashboard', 'ڈیش بورڈ'), active: true, path: '/admin-dashboard' },
    { icon: UserCheck, label: t('Approvals', 'منظوریاں'), path: '/admin-approvals' },
    { icon: Settings, label: t('Platform', 'پلیٹ فارم'), path: '/admin-platform' },
  ]

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="min-h-screen bg-gray-50 flex" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 bg-white border-r border-gray-200 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} hidden lg:block`}>
        <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-100"><div className="w-9 h-9 bg-purple-600 flex items-center justify-center"><span className="text-white font-bold text-sm">Z</span></div>{sidebarOpen && <span className="text-lg font-bold text-gray-900">Admin</span>}</div>
        <nav className="p-3 space-y-1">
          {sidebarLinks.map((link, i) => (
            <Link key={i} to={link.path} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${link.active ? 'bg-purple-50 text-purple-600' : 'text-gray-600 hover:bg-gray-50'}`}><link.icon className="w-5 h-5" />{sidebarOpen && <span>{link.label}</span>}</Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-0 right-0 px-3"><button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 "><LogOut className="w-5 h-5" />{sidebarOpen && <span>{t('Sign Out', 'سائن آؤٹ')}</span>}</button></div>
      </aside>

      <div className="flex-1">
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 h-16 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3"><button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:block text-gray-500">☰</button><h1 className="text-lg font-semibold text-gray-900">{t('Admin Dashboard', 'ایڈمن ڈیش بورڈ')}</h1></div>
          <div className="flex items-center gap-1 bg-purple-50 p-1 rounded-lg">
            <button onClick={() => toggleLanguage('en')} className={`px-2 py-1 text-xs font-medium rounded ${lang === 'en' ? 'bg-purple-600 text-white' : 'text-purple-600'}`}>EN</button>
            <button onClick={() => toggleLanguage('ur')} className={`px-2 py-1 text-xs font-medium rounded ${lang === 'ur' ? 'bg-purple-600 text-white' : 'text-purple-600'}`}>اردو</button>
              <ThemeToggle />
          </div>
        
    
        </header>
        <main className="p-4 lg:p-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4"><div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center"><Users className="w-6 h-6 text-purple-600" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p><p className="text-xs text-gray-500">{t('Total Users', 'کل صارفین')}</p></div></div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4"><div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center"><Clock className="w-6 h-6 text-amber-600" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.pendingProviders}</p><p className="text-xs text-gray-500">{t('Pending Providers', 'زیر التواء پرووائیڈرز')}</p></div></div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4"><div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center"><CheckCircle className="w-6 h-6 text-blue-600" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.pendingCustomers}</p><p className="text-xs text-gray-500">{t('Customers', 'کسٹمرز')}</p></div></div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4"><div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center"><ClipboardList className="w-6 h-6 text-emerald-600" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p><p className="text-xs text-gray-500">{t('Total Requests', 'کل درخواستیں')}</p></div></div>
          </div>
        </main>
      </div>
    </div>
  )
}