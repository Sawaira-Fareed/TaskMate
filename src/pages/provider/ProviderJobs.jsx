import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, CheckCircle, Clock, XCircle, Star } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { getCurrentUser } from '@/lib/auth'


export default function ProviderJobs() {
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  useEffect(() => {
    loadJobs()

    // Realtime subscription
    const channel = supabase
      .channel('provider-jobs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => loadJobs()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadJobs() {
    try {
      const user = await getCurrentUser()
      const { data: provider } = await supabase.from('providers').select('id').eq('user_id', user.id).single()
      if (!provider) return
      const { data } = await supabase
        .from('bookings')
        .select('*, customer:customer_id(full_name, phone)')
        .eq('provider_id', provider.id)
        .order('created_at', { ascending: false })
      setJobs(data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const statusBadge = (status) => ({
    confirmed: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    cancelled: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }[status] || 'bg-gray-50 text-gray-600')

  const statusIcon = (status) => {
    if (status === 'completed') return <CheckCircle className="w-4 h-4 text-emerald-500" />
    if (status === 'confirmed') return <Clock className="w-4 h-4 text-blue-500" />
    return <XCircle className="w-4 h-4 text-red-500" />
  }

  const tabs = [
    { id: 'all', en: 'All', ur: 'تمام' },
    { id: 'confirmed', en: 'Upcoming', ur: 'آنے والے' },
    { id: 'completed', en: 'Completed', ur: 'مکمل' },
    { id: 'cancelled', en: 'Cancelled', ur: 'منسوخ' },
  ]

  const filtered = activeTab === 'all' ? jobs : jobs.filter(j => j.status === activeTab)

  const stats = {
    total: jobs.length,
    completed: jobs.filter(j => j.status === 'completed').length,
    upcoming: jobs.filter(j => j.status === 'confirmed').length,
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-gray-400">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('My Jobs', 'میرے کام')}</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center border border-gray-100 dark:border-gray-700">
            <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('Total', 'کل')}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center border border-gray-100 dark:border-gray-700">
            <p className="text-xl font-bold text-blue-600">{stats.upcoming}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('Upcoming', 'آنے والے')}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center border border-gray-100 dark:border-gray-700">
            <p className="text-xl font-bold text-emerald-600">{stats.completed}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('Done', 'مکمل')}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-100 dark:border-gray-700">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === tab.id ? 'bg-purple-600 text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              {lang === 'ur' ? tab.ur : tab.en}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('No jobs found', 'کوئی کام نہیں ملا')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(j => (
              <div key={j.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {statusIcon(j.status)}
                    <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{j.service_type}</span>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge(j.status)}`}>{j.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{j.scheduled_date} • {j.scheduled_time}</p>
{j.rating && (
  <div className="flex items-center gap-1 mt-1">
    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
    <span className="text-xs text-amber-600 dark:text-amber-400">{j.rating}/5</span>
  </div>
)}
                  {j.customer?.full_name && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">{j.customer.full_name}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}