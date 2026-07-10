import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock, CheckCircle, XCircle, AlertTriangle, ChevronRight, ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { getCurrentUser } from '../../lib/auth'

export default function MyRequests() {
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('active')

  const t = (en, ur) => (lang === 'ur' ? ur : en)
  const toggleLanguage = (l) => { setLang(l); localStorage.setItem('zaria-language', l) }

  useEffect(() => {
  async function load() {
    try {
      const user = await getCurrentUser()
      const { data, error } = await supabase.from('requests').select('*').eq('customer_id', user.id).order('created_at', { ascending: false })
      if (error) throw error
      setRequests(data || [])
    } catch (err) {
      console.error('Failed to load:', err.message)
    } finally {
      setLoading(false)
    }
  }
  load()
}, [])

  const tabs = [
    { id: 'active', en: 'Active', ur: 'فعال', filter: (r) => ['pending', 'parsed', 'contacting', 'offered'].includes(r.status) },
    { id: 'completed', en: 'Completed', ur: 'مکمل', filter: (r) => r.status === 'confirmed' },
    { id: 'cancelled', en: 'Cancelled', ur: 'منسوخ', filter: (r) => ['cancelled', 'expired', 'declined', 'no_provider'].includes(r.status) },
  ]

  const statusBadge = (status) => {
    const map = { pending: 'bg-amber-50 text-amber-700', parsed: 'bg-blue-50 text-blue-700', contacting: 'bg-purple-50 text-purple-700', offered: 'bg-purple-50 text-purple-700', confirmed: 'bg-emerald-50 text-emerald-700', completed: 'bg-emerald-50 text-emerald-700', cancelled: 'bg-red-50 text-red-700', expired: 'bg-gray-50 text-gray-600', declined: 'bg-red-50 text-red-700', no_provider: 'bg-gray-50 text-gray-600' }
    return map[status] || 'bg-gray-50 text-gray-600'
  }

  const filtered = requests.filter(tabs.find(tab => tab.id === activeTab)?.filter || (() => true))

  return (
    <div className="min-h-screen bg-gray-50" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <header className="bg-white border-b border-gray-200 px-4 h-16 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link to="/customer-home" className="text-gray-500"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-lg font-semibold text-gray-900">{t('My Requests', 'میری درخواستیں')}</h1>
        </div>
        <div className="flex items-center gap-1 bg-purple-50 p-1 rounded-lg">
          <button onClick={() => toggleLanguage('en')} className={`px-2 py-1 text-xs font-medium rounded ${lang === 'en' ? 'bg-purple-600 text-white' : 'text-purple-600'}`}>EN</button>
          <button onClick={() => toggleLanguage('ur')} className={`px-2 py-1 text-xs font-medium rounded ${lang === 'ur' ? 'bg-purple-600 text-white' : 'text-purple-600'}`}>اردو</button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        <div className="flex gap-2 mb-4 bg-white rounded-xl p-1 border border-gray-100">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === tab.id ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>{lang === 'ur' ? tab.ur : tab.en}</button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">{t('No requests found', 'کوئی درخواست نہیں ملی')}</p>
            <Link to="/create-request" className="text-sm text-purple-600 font-medium mt-2 inline-block">{t('Create Request', 'درخواست بنائیں')}</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(req => (
              <Link key={req.id} to={`/request/${req.id}`} className="block bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">{req.service_type || t('Service Request', 'سروس کی درخواست')}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge(req.status)}`}>{req.status}</span>
                </div>
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">{req.raw_text}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{new Date(req.created_at).toLocaleDateString()}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}