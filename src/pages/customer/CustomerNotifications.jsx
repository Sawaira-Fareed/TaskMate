import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, MessageCircle, CheckCircle, XCircle, Clock, User } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { getCurrentUser } from '@/lib/auth'

export default function CustomerNotifications() {
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 5000)
    return () => clearInterval(interval)
  }, [])

  const markAllAsRead = async () => {
    const user = await getCurrentUser()
    if (!user) return
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  async function loadNotifications() {
    const user = await getCurrentUser()
    if (!user) return
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50)
    setNotifications(data || [])
    setLoading(false)
  }

  const handleClick = async (n) => {
    if (!n.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', n.id)
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x))
    }
    if (n.action_url) navigate(n.action_url)
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  const getIcon = (type) => {
    if (type?.includes('message') || type?.includes('chat')) return <MessageCircle className="w-5 h-5 text-purple-500" />
    if (type?.includes('confirmed') || type?.includes('accepted')) return <CheckCircle className="w-5 h-5 text-emerald-500" />
    if (type?.includes('declined') || type?.includes('cancelled')) return <XCircle className="w-5 h-5 text-red-500" />
    return <Bell className="w-5 h-5 text-amber-500" />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => navigate('/customer/dashboard', { replace: true })} className="text-gray-500 dark:text-gray-400"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex items-center gap-2 flex-1">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Notifications', 'اطلاعات')}</h1>
          {unreadCount > 0 && (
            <>
              <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">{unreadCount}</span>
              <button onClick={markAllAsRead} className="text-xs text-purple-600 dark:text-purple-400 font-medium hover:underline ml-auto">
                {t('Mark all read', 'سب کو پڑھا ہوا کریں')}
              </button>
            </>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('No notifications', 'کوئی اطلاع نہیں')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left p-4 rounded-2xl border transition-all hover:shadow-md ${
                  n.is_read
                    ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                    : 'bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-800 dark:to-purple-900 border-purple-300 dark:border-purple-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    n.is_read ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'
                  }`}>
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{n.title}</span>
                      <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{n.message}</p>
                    {!n.is_read && (
                      <div className="flex items-center gap-1 mt-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400" />
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">{t('New', 'نیا')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}