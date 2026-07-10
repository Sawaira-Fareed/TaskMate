import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, X, User } from 'lucide-react'
import { supabase } from "../../lib/supabaseClient";

export default function AdminApprovals() {
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.from('providers').select('*, users!inner(email, full_name)').eq('is_approved', false)
        setProviders(data || [])
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const handleApprove = async (id) => {
    await supabase.from('providers').update({ is_approved: true }).eq('id', id)
    setProviders(prev => prev.filter(p => p.id !== id))
  }

  const handleReject = async (id) => {
    await supabase.from('providers').delete().eq('id', id)
    setProviders(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <header className="bg-white border-b border-gray-200 px-4 h-16 flex items-center gap-3 sticky top-0 z-30">
        <Link to="/admin-dashboard" className="text-gray-500"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-lg font-semibold text-gray-900">{t('Pending Approvals', 'زیر التواء منظوریاں')}</h1>
      </header>
      <div className="max-w-3xl mx-auto p-4">
        {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>
        : providers.length === 0 ? <div className="text-center py-20"><User className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-500">{t('No pending providers', 'کوئی زیر التواء پرووائیڈر نہیں')}</p></div>
        : <div className="space-y-3">{providers.map(p => (
          <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-900">{p.users?.full_name || 'Provider'}</p>
                <p className="text-xs text-gray-500">{p.users?.email}</p>
                <p className="text-xs text-gray-400 mt-1">{p.service_types?.join(', ')}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleApprove(p.id)} className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2 text-sm font-medium"><Check className="w-4 h-4" /> {t('Approve', 'منظور کریں')}</button>
              <button onClick={() => handleReject(p.id)} className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl py-2 text-sm font-medium"><X className="w-4 h-4" /> {t('Reject', 'مسترد کریں')}</button>
            </div>
          </div>
        ))}</div>}
      </div>
    </div>
  )
}