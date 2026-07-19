import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, CheckCircle, Clock, XCircle, Star, MessageCircle, User, DollarSign } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { getCurrentUser } from '@/lib/auth'

const serviceColors = {
  plumber: 'from-blue-400 to-cyan-300',
  electrician: 'from-amber-400 to-orange-300',
  grocery: 'from-emerald-400 to-teal-300',
  computer_repair: 'from-fuchsia-400 to-pink-300',
}

export default function ProviderJobs() {
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  useEffect(() => {
    loadJobs()
    const channel = supabase.channel('provider-jobs').on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => loadJobs()).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadJobs() {
    try {
      const user = await getCurrentUser()
      const { data: provider } = await supabase.from('providers').select('id').eq('user_id', user.id).single()
      if (!provider) return
      const { data } = await supabase.from('bookings').select('*, customer:customer_id(full_name, phone)').eq('provider_id', provider.id).order('created_at', { ascending: false })
      setJobs(data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const statusBadge = (s) => ({
    confirmed: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    cancelled: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }[s] || 'bg-gray-50 text-gray-600')

  const statusIcon = (s) => {
    if (s === 'completed') return <CheckCircle className="w-4 h-4 text-emerald-500" />
    if (s === 'confirmed') return <Clock className="w-4 h-4 text-blue-500" />
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

  function formatTime(time) {
    if (!time) return ''
    const [h, m] = time.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const h12 = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)
    return `${h12}:${m} ${ampm}`
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/provider/dashboard', { replace: true })} className="text-gray-500 dark:text-gray-400"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('My Jobs', 'میرے کام')}</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center border"><p className="text-xl font-bold text-gray-900 dark:text-white">{stats.total}</p><p className="text-xs text-gray-500">{t('Total', 'کل')}</p></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center border"><p className="text-xl font-bold text-blue-600">{stats.upcoming}</p><p className="text-xs text-gray-500">{t('Upcoming', 'آنے والے')}</p></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center border"><p className="text-xl font-bold text-emerald-600">{stats.completed}</p><p className="text-xs text-gray-500">{t('Done', 'مکمل')}</p></div>
        </div>

        <div className="flex gap-1 mb-4 bg-white dark:bg-gray-800 rounded-xl p-1 border">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-2 text-xs font-medium rounded-lg ${activeTab === tab.id ? 'bg-purple-600 text-white' : 'text-gray-500 dark:text-gray-400'}`}>{lang === 'ur' ? tab.ur : tab.en}</button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20"><Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" /><p className="text-sm text-gray-500">{t('No jobs found', 'کوئی کام نہیں ملا')}</p></div>
        ) : (
          <div className="space-y-3">
            {filtered.map(j => {
              const gradient = serviceColors[j.service_type] || 'from-purple-500 to-pink-500'
              return (
                <div key={j.id} className="relative bg-[#f5f0ff] dark:bg-gray-800 rounded-2xl shadow-sm border border-purple-100/40 dark:border-gray-700 overflow-hidden">
                  <div className="absolute top-0 right-0 w-[28%] h-full rounded-2xl overflow-hidden" style={{ clipPath: 'polygon(35% 0, 100% 0, 100% 100%, 0% 100%)' }}>
                    <div className={`w-full h-full bg-gradient-to-br ${gradient} opacity-100 dark:opacity-70`} />
                  </div>

                  <div className="relative p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {statusIcon(j.status)}
                        <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{j.service_type}</span>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge(j.status)}`}>{j.status}</span>
                    </div>

                    <div className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-purple-500" />
                      <span>{j.scheduled_date}</span>
                      <span className="text-gray-400">•</span>
                      <Clock className="w-3.5 h-3.5 text-purple-500" />
                      <span>{formatTime(j.scheduled_time)}</span>
                    </div>

                    {j.customer?.full_name && (
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <User className="w-3.5 h-3.5 text-purple-500" />
                        <span>{j.customer.full_name}</span>
                      </div>
                    )}

                    {j.rating && (
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-medium text-amber-600 dark:text-amber-400">{j.rating}/5</span>
                      </div>
                    )}

                    {j.provider_earnings && (
                      <div className="flex items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>PKR {j.provider_earnings}</span>
                      </div>
                    )}

                    {j.status === 'confirmed' && (
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/provider/chat/${j.id}`) }} className="mt-1 w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors">
                        <MessageCircle className="w-4 h-4" /> {t('Chat with Customer', 'گاہک سے چیٹ کریں')}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}