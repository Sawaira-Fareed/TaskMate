import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Star, Calendar, MapPin, ChevronRight } from 'lucide-react'
import { supabase } from "../../lib/supabaseClient";
import { getCurrentUser } from '@/lib/auth'

export default function MyBookings() {
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upcoming')

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

  const statusBadge = (s) => ({ confirmed: 'bg-emerald-50 text-emerald-700', completed: 'bg-blue-50 text-blue-700', cancelled: 'bg-red-50 text-red-700' }[s] || 'bg-gray-50 text-gray-600')

  const filtered = bookings.filter(b => activeTab === 'upcoming' ? b.status === 'confirmed' : activeTab === 'completed' ? b.status === 'completed' : b.status === 'cancelled')

  return (
    <div className="min-h-screen bg-gray-50" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <header className="bg-white border-b border-gray-200 px-4 h-16 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3"><Link to="/customer-home" className="text-gray-500"><ArrowLeft className="w-5 h-5" /></Link><h1 className="text-lg font-semibold text-gray-900">{t('My Bookings', 'میری بکنگز')}</h1></div>
        <div className="flex items-center gap-1 bg-purple-50 p-1 rounded-lg">
          <button onClick={() => toggleLanguage('en')} className={`px-2 py-1 text-xs font-medium rounded ${lang === 'en' ? 'bg-purple-600 text-white' : 'text-purple-600'}`}>EN</button>
          <button onClick={() => toggleLanguage('ur')} className={`px-2 py-1 text-xs font-medium rounded ${lang === 'ur' ? 'bg-purple-600 text-white' : 'text-purple-600'}`}>اردو</button>
        </div>
      </header>
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex gap-2 mb-4 bg-white rounded-xl p-1 border border-gray-100">
          {['upcoming', 'completed', 'cancelled'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === tab ? 'bg-purple-600 text-white' : 'text-gray-500'}`}>{t(tab.charAt(0).toUpperCase() + tab.slice(1), tab)}</button>
          ))}
        </div>
        {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>
        : filtered.length === 0 ? <div className="text-center py-20"><Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-500">{t('No bookings', 'کوئی بکنگ نہیں')}</p></div>
        : <div className="space-y-3">{filtered.map(b => (
          <div key={b.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2"><span className="text-sm font-semibold text-gray-900">{b.service_type}</span><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge(b.status)}`}>{b.status}</span></div>
            <div className="space-y-1 text-xs text-gray-500"><div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {b.scheduled_date} • {b.scheduled_time}</div></div>
            {b.status === 'completed' && !b.rating && <Link to={`/rate/${b.id}`} className="flex items-center gap-1 text-sm text-purple-600 font-medium mt-3"><Star className="w-4 h-4" /> {t('Rate Provider', 'پرووائیڈر کو ریٹ کریں')}</Link>}
          </div>
        ))}</div>}
      </div>
    </div>
  )
}