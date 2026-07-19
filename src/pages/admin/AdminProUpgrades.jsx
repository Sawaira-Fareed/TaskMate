import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, X, User, Crown, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function AdminProUpgrades() {
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [upgrades, setUpgrades] = useState([])
  const [loading, setLoading] = useState(true)

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  useEffect(() => {
    loadUpgrades()
    const channel = supabase
      .channel('pro-upgrades')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pro_upgrade_requests' }, () => loadUpgrades())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadUpgrades() {
    const { data } = await supabase
      .from('pro_upgrade_requests')
      .select('*, provider:provider_id(id, user:user_id(full_name, email))')
      .order('created_at', { ascending: false })
    setUpgrades(data || [])
    setLoading(false)
  }

  async function handleApprove(upgrade) {
    if (!confirm(t('Approve this upgrade?', 'کیا یہ اپ گریڈ منظور کرنا چاہتے ہیں؟'))) return
    await supabase.from('pro_upgrade_requests').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', upgrade.id)
    await supabase.from('providers').update({ plan: 'pro' }).eq('id', upgrade.provider_id)
    await supabase.from('notifications').insert({
      user_id: upgrade.user_id,
      type: 'upgrade_offer',
      title: t('Pro Upgrade Approved!', 'پرو اپ گریڈ منظور!'),
      message: t('You are now a PRO provider. Enjoy unlimited bookings!', 'آپ اب پرو پرووائیڈر ہیں۔ لامحدود بکنگ کا لطف اٹھائیں!'),
      action_url: '/provider/dashboard'
    })
    setUpgrades(prev => prev.map(u => u.id === upgrade.id ? { ...u, status: 'approved' } : u))
  }

  async function handleReject(upgrade) {
    if (!confirm(t('Reject this upgrade?', 'کیا یہ اپ گریڈ مسترد کرنا چاہتے ہیں؟'))) return
    await supabase.from('pro_upgrade_requests').update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', upgrade.id)
    await supabase.from('notifications').insert({
      user_id: upgrade.user_id,
      type: 'upgrade_offer',
      title: t('Pro Upgrade Rejected', 'پرو اپ گریڈ مسترد'),
      message: t('Your transaction screenshot could not be verified. Please try again.', 'آپ کا ٹرانزیکشن اسکرین شاٹ تصدیق نہیں ہو سکا۔ براہ کرم دوبارہ کوشش کریں۔'),
      action_url: '/provider/profile'
    })
    setUpgrades(prev => prev.map(u => u.id === upgrade.id ? { ...u, status: 'rejected' } : u))
  }

  const pending = upgrades.filter(u => u.status === 'pending')
  const reviewed = upgrades.filter(u => u.status !== 'pending')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-gray-400"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Pro Upgrade Requests', 'پرو اپ گریڈ کی درخواستیں')}</h1>
      </header>

      <div className="max-w-3xl mx-auto p-4">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : pending.length === 0 && reviewed.length === 0 ? (
          <div className="text-center py-20">
            <Crown className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">{t('No upgrade requests', 'کوئی اپ گریڈ کی درخواست نہیں')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pending.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('Pending', 'زیر التواء')}</h3>
                <div className="space-y-3">
                  {pending.map(u => (
                    <div key={u.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <Crown className="w-5 h-5 text-yellow-500" />
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{u.provider?.user?.full_name || 'Provider'}</p>
                          <p className="text-xs text-gray-500">{u.provider?.user?.email}</p>
                        </div>
                      </div>
                      <a href={u.transaction_screenshot} target="_blank" className="inline-flex items-center gap-1 text-sm text-purple-600 hover:underline mb-4">
                        <ExternalLink className="w-3.5 h-3.5" /> {t('View Screenshot', 'اسکرین شاٹ دیکھیں')}
                      </a>
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(u)} className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1.5"><Check className="w-4 h-4" /> {t('Approve', 'منظور')}</button>
                        <button onClick={() => handleReject(u)} className="flex-1 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5"><X className="w-4 h-4" /> {t('Reject', 'مسترد')}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {reviewed.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('Reviewed', 'جائزہ لیا گیا')}</h3>
                <div className="space-y-2">
                  {reviewed.map(u => (
                    <div key={u.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {u.status === 'approved' ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-red-500" />}
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{u.provider?.user?.full_name}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{u.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}