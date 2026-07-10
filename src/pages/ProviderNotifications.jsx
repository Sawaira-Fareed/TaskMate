import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Bell } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { getCurrentUser } from '../../lib/auth'

export default function ProviderNotifications() {
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  useEffect(() => {
    async function load() {
      try {
        const user = await getCurrentUser()
        const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50)
        setNotifications(data || [])
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <header className="bg-white border-b border-gray-200 px-4 h-16 flex items-center gap-3 sticky top-0 z-30">
        <Link to="/provider-dashboard" className="text-gray-500"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-lg font-semibold text-gray-900">{t('Notifications', 'اطلاعات')}</h1>
      </header>
      <div className="max-w-2xl mx-auto p-4">
        {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>
        : notifications.length === 0 ? <div className="text-center py-20"><Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-500">{t('No notifications', 'کوئی اطلاع نہیں')}</p></div>
        : <div className="space-y-2">{notifications.map(n => (
          <div key={n.id} className={`p-4 rounded-2xl border ${n.is_read ? 'bg-white border-gray-100' : 'bg-purple-50 border-purple-100'}`}>
            <div className="flex items-center justify-between mb-1"><span className="text-sm font-medium text-gray-900">{n.title}</span>{!n.is_read && <span className="w-2 h-2 rounded-full bg-purple-600" />}</div>
            <p className="text-xs text-gray-500">{n.message}</p>
          </div>
        ))}</div>}
      </div>
    </div>
  )
}