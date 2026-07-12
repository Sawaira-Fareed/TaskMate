import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { getCurrentUser } from '@/lib/auth'

export default function ProviderJobs() {
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  useEffect(() => {
    async function load() {
      try {
        const user = await getCurrentUser()
        const { data: provider } = await supabase.from('providers').select('id').eq('user_id', user.id).single()
        const { data } = await supabase.from('bookings').select('*').eq('provider_id', provider?.id).order('created_at', { ascending: false })
        setJobs(data || [])
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('My Jobs', 'میرے کام')}</h1>
      </header>
      <div className="max-w-2xl mx-auto p-4">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('No jobs yet', 'ابھی تک کوئی کام نہیں')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map(j => (
              <div key={j.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{j.service_type}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    j.status === 'completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    j.status === 'confirmed' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>{j.status}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{j.scheduled_date} • {j.scheduled_time}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}