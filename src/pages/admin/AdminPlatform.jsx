import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function AdminPlatform() {
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [announcement, setAnnouncement] = useState('')
  const [sent, setSent] = useState(false)

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  const sendAnnouncement = async () => {
    if (!announcement) return
    const { data: users } = await supabase.from('users').select('id')
    const notifications = (users || []).map(u => ({ user_id: u.id, type: 'upgrade_offer', title: 'Platform Announcement', message: announcement }))
    await supabase.from('notifications').insert(notifications)
    setSent(true)
    setAnnouncement('')
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <header className="bg-white border-b border-gray-200 px-4 h-16 flex items-center gap-3 sticky top-0 z-30">
        <Link to="/admin-dashboard" className="text-gray-500"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-lg font-semibold text-gray-900">{t('Platform Management', 'پلیٹ فارم مینجمنٹ')}</h1>
      </header>
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">{t('Send Announcement', 'اعلان بھیجیں')}</h3>
          <textarea rows={4} value={announcement} onChange={(e) => setAnnouncement(e.target.value)} placeholder={t('Type announcement...', 'اعلان لکھیں...')} className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/50 focus:border-transparent resize-none mb-3" />
          <button onClick={sendAnnouncement} disabled={!announcement} className="inline-flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 disabled:bg-purple-300 transition-all">
            <Send className="w-4 h-4" /> {sent ? t('Sent!', 'بھیج دیا!') : t('Send to All Users', 'تمام صارفین کو بھیجیں')}
          </button>
        </div>
      </div>
    </div>
  )
}