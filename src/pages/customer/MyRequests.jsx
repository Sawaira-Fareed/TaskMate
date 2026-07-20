import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, ChevronRight, ArrowLeft, X, Check, Wrench, Plug, ShoppingBag, Monitor } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { getCurrentUser } from '@/lib/auth'

const serviceColors = {
  plumber: 'from-blue-500 to-cyan-400',
  electrician: 'from-amber-500 to-orange-400',
  grocery: 'from-emerald-500 to-teal-400',
  computer_repair: 'from-violet-500 to-purple-400',
}

const serviceIcons = { plumber: Wrench, electrician: Plug, grocery: ShoppingBag, computer_repair: Monitor }

export default function MyRequests() {
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('active')

  const t = (en, ur) => (lang === 'ur' ? ur : en)
  const toggleLanguage = (l) => { setLang(l); localStorage.setItem('zaria-language', l) }

  useEffect(() => {
    loadRequests()
    const interval = setInterval(loadRequests, 5000)
    return () => clearInterval(interval)
  }, [])

  async function loadRequests() {
    try {
      const user = await getCurrentUser()
      if (!user) return
      const { data } = await supabase.from('requests').select('*').eq('customer_id', user.id).order('created_at', { ascending: false })
      setRequests(data || [])
    } catch (err) { console.error('Failed to load:', err.message) }
    finally { setLoading(false) }
  }

  async function cancelRequest(id) {
    if (!confirm(t('Cancel this request?', 'درخواست منسوخ کریں؟'))) return
    await supabase.from('requests').update({ status: 'cancelled' }).eq('id', id)
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r))
  }

  const tabs = [
    { id: 'active', en: 'Active', ur: 'فعال', filter: (r) => ['pending', 'parsed', 'contacting', 'offered'].includes(r.status) },
    { id: 'confirmed', en: 'Confirmed', ur: 'تصدیق شدہ', filter: (r) => r.status === 'confirmed' },
    { id: 'completed', en: 'Completed', ur: 'مکمل', filter: (r) => r.status === 'completed' },
    { id: 'cancelled', en: 'Cancelled', ur: 'منسوخ', filter: (r) => ['cancelled', 'expired', 'declined', 'no_provider'].includes(r.status) },
  ]

  const statusBadge = (status) => {
    const map = {
      pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      parsed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      contacting: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      offered: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      expired: 'bg-gray-100 text-gray-600',
      declined: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      no_provider: 'bg-gray-100 text-gray-600',
    }
    return map[status] || 'bg-gray-100 text-gray-600'
  }

  const statusIcon = (status) => {
    if (['completed', 'confirmed'].includes(status)) return <Check className="w-3 h-3" />
    if (['cancelled', 'declined', 'expired', 'no_provider'].includes(status)) return <X className="w-3 h-3" />
    return <Clock className="w-3 h-3" />
  }

  const activeTabObj = tabs.find(tab => tab.id === activeTab)
  const filtered = requests.filter(activeTabObj?.filter || (() => true))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/customer/dashboard', { replace: true })} className="text-gray-500 dark:text-gray-400"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('My Requests', 'میری درخواستیں')}</h1>
        </div>
        <div className="flex items-center gap-1 bg-purple-50 dark:bg-purple-900/30 p-1 rounded-lg">
          <button onClick={() => toggleLanguage('en')} className={`px-2 py-1 text-xs font-medium rounded ${lang === 'en' ? 'bg-purple-600 text-white' : 'text-purple-600 dark:text-purple-400'}`}>EN</button>
          <button onClick={() => toggleLanguage('ur')} className={`px-2 py-1 text-xs font-medium rounded ${lang === 'ur' ? 'bg-purple-600 text-white' : 'text-purple-600 dark:text-purple-400'}`}>اردو</button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        <div className="flex gap-1 mb-4 bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-100 dark:border-gray-700 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap px-2 ${activeTab === tab.id ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
              {lang === 'ur' ? tab.ur : tab.en}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('No requests found', 'کوئی درخواست نہیں ملی')}</p>
            <button onClick={() => navigate('/customer/create-request')} className="text-sm text-purple-600 dark:text-purple-400 font-medium mt-2">{t('Create Request', 'درخواست بنائیں')}</button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(req => {
              const gradient = serviceColors[req.service_type] || 'from-purple-500 to-pink-500'
              const Icon = serviceIcons[req.service_type] || Wrench
              return (
                <div key={req.id} className="relative bg-purple-100 dark:bg-gray-800 rounded-2xl border border-purple-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all">
                  <div className="absolute top-0 right-0 w-[25%] h-full" style={{ clipPath: 'polygon(35% 0, 100% 0, 100% 100%, 0% 100%)' }}>
                    <div className={`w-full h-full bg-gradient-to-br ${gradient} opacity-70 dark:opacity-50`} />
                  </div>
                  <div className="relative p-4">
                    <button onClick={() => navigate(`/customer/request/${req.id}`, { replace: true })} className="w-full text-left">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{req.service_type || t('Request', 'درخواست')}</span>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${statusBadge(req.status)}`}>
                          {statusIcon(req.status)}{req.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{req.raw_text}</p>
                      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                        <span>{new Date(req.created_at).toLocaleDateString()}</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </button>
                    {['pending', 'parsed', 'contacting', 'offered'].includes(req.status) && (
                      <button onClick={(e) => { e.stopPropagation(); cancelRequest(req.id) }} className="mt-2 w-full py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                        {t('Cancel', 'منسوخ کریں')}
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