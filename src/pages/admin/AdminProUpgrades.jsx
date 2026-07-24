import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, X, Crown, ExternalLink, User, Mail, Loader2, WifiOff, AlertTriangle, RefreshCw, PartyPopper } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

export default function AdminProUpgrades() {
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [upgrades, setUpgrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [celebrate, setCelebrate] = useState(null)
  const { isOnline, isSlow } = useNetworkStatus()

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  async function loadUpgrades() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('pro_upgrade_requests')
        .select('*, provider:provider_id(id, user:user_id(full_name, email, avatar_url), plan, tier)')
        .order('created_at', { ascending: false })
      setUpgrades(data || [])
      setError(null)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadUpgrades() }, [])
  useEffect(() => {
    const channel = supabase
      .channel('pro-upgrades')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pro_upgrade_requests' }, () => loadUpgrades())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function handleApprove(upgrade) {
    setActionLoading(true)
    try {
      await supabase.from('pro_upgrade_requests').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', upgrade.id)
      await supabase.from('providers').update({ plan: 'pro' }).eq('id', upgrade.provider_id)
      await supabase.from('notifications').insert({
        user_id: upgrade.provider?.user_id,
        type: 'upgrade_offer',
        title: '🎉 ' + t('Pro Upgrade Approved!', 'پرو اپ گریڈ منظور!'),
        message: t('Congratulations! You are now a PRO provider. Enjoy unlimited bookings, priority matching, and all PRO features. Welcome to the PRO family!', 'مبارک ہو! آپ اب پرو پرووائیڈر ہیں۔ لامحدود بکنگ، ترجیحی میچنگ، اور تمام پرو فیچرز کا لطف اٹھائیں۔ پرو فیملی میں خوش آمدید!'),
        action_url: '/provider/dashboard'
      })
      setCelebrate(upgrade.provider?.user?.full_name)
      setSuccessMsg(t('Upgrade approved!', 'اپ گریڈ منظور!'))
      setTimeout(() => { setCelebrate(null); setSuccessMsg('') }, 4000)
      setUpgrades(prev => prev.map(u => u.id === upgrade.id ? { ...u, status: 'approved' } : u))
    } catch (err) { alert('Failed: ' + err.message) }
    finally { setActionLoading(false) }
  }

  async function handleReject() {
    if (!rejectReason.trim()) { alert(t('Enter a reason', 'وجہ درج کریں')); return }
    setActionLoading(true)
    try {
      await supabase.from('pro_upgrade_requests').update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        admin_note: rejectReason
      }).eq('id', rejectModal)

      const { data: upgrade } = await supabase
        .from('pro_upgrade_requests')
        .select('provider:provider_id(user_id)')
        .eq('id', rejectModal)
        .single()

      if (upgrade?.provider?.user_id) {
        await supabase.from('notifications').insert({
          user_id: upgrade.provider.user_id,
          type: 'upgrade_offer',
          title: t('Pro Upgrade Rejected', 'پرو اپ گریڈ مسترد'),
          message: rejectReason,
          action_url: '/provider/profile'
        })
      }
      setSuccessMsg(t('Upgrade rejected.', 'اپ گریڈ مسترد۔'))
      setTimeout(() => setSuccessMsg(''), 3000)
      setUpgrades(prev => prev.map(u => u.id === rejectModal ? { ...u, status: 'rejected', admin_note: rejectReason } : u))
      setRejectModal(null); setRejectReason('')
    } catch (err) { alert('Failed: ' + err.message) }
    finally { setActionLoading(false) }
  }

  const pending = upgrades.filter(u => u.status === 'pending')
  const reviewed = upgrades.filter(u => u.status !== 'pending')

  if (!isOnline) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <WifiOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">{t('No Internet', 'انٹرنیٹ نہیں ہے')}</h3>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-2">{error}</p>
          <button onClick={loadUpgrades} className="text-sm text-purple-600 font-medium">
            <RefreshCw className="w-4 h-4 inline" /> {t('Retry', 'دوبارہ کوشش')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      {isSlow && (
        <div className="sticky top-0 z-50 bg-amber-50 text-amber-700 text-xs text-center py-1.5">
          {t('Slow connection', 'انٹرنیٹ سست ہے')}
        </div>
      )}

      {successMsg && !celebrate && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-lg text-sm font-medium">
          <Check className="w-4 h-4 inline mr-1" /> {successMsg}
        </div>
      )}

      {/* Celebration overlay */}
      {celebrate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setCelebrate(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 text-center shadow-2xl max-w-sm mx-4 animate-bounce">
            <PartyPopper className="w-16 h-16 text-yellow-500 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">🎉 {t('Congratulations!', 'مبارک ہو!')}</h2>
            <p className="text-lg font-semibold text-purple-600 mb-1">{celebrate}</p>
            <p className="text-sm text-gray-500">{t('is now a PRO provider!', 'اب پرو پرووائیڈر ہے!')}</p>
          </div>
        </div>
      )}

      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-gray-400"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Pro Upgrades', 'پرو اپ گریڈ')}</h1>
      </header>

      <div className="max-w-3xl mx-auto p-4">
        {pending.length === 0 && reviewed.length === 0 ? (
          <div className="text-center py-20">
            <Crown className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">{t('No upgrade requests', 'کوئی اپ گریڈ کی درخواست نہیں')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pending.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('Pending', 'زیر التواء')} ({pending.length})</h3>
                <div className="space-y-3">
                  {pending.map(u => (
                    <div key={u.id} className="relative bg-purple-50/50 dark:bg-gray-800 rounded-2xl shadow-sm border border-purple-100/40 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all p-5">
                      <div className="absolute top-0 right-0 w-[20%] h-full bg-gradient-to-br from-purple-200/30 to-transparent dark:from-purple-800/10" style={{ clipPath: 'polygon(35% 0, 100% 0, 100% 100%, 0% 100%)' }} />
                      <div className="relative">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center overflow-hidden">
                            {u.provider?.user?.avatar_url ? <img src={u.provider.user.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-purple-600" />}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{u.provider?.user?.full_name || 'Provider'}</p>
                            <p className="text-xs text-gray-500">{u.provider?.user?.email}</p>
                          </div>
                        </div>
                        {u.screenshot_url ? (
                          <a href={u.screenshot_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-purple-600 hover:underline mb-4">
                            <ExternalLink className="w-3.5 h-3.5" /> {t('View Screenshot', 'اسکرین شاٹ دیکھیں')}
                          </a>
                        ) : (
                          <p className="text-xs text-gray-400 mb-4">{t('No screenshot', 'کوئی اسکرین شاٹ نہیں')}</p>
                        )}
                        <div className="flex gap-2">
                          <button onClick={() => handleApprove(u)} disabled={actionLoading} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors">
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}{t('Approve', 'منظور')}
                          </button>
                          <button onClick={() => { setRejectModal(u.id); setRejectReason('') }} className="flex-1 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                            <X className="w-4 h-4" />{t('Reject', 'مسترد')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {reviewed.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('Reviewed', 'جائزہ لیا گیا')} ({reviewed.length})</h3>
                <div className="space-y-2">
                  {reviewed.map(u => (
                    <div key={u.id} className={`rounded-xl border p-4 transition-all ${
                      u.status === 'approved'
                        ? 'bg-emerald-50/30 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'
                        : 'bg-red-50/30 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {u.status === 'approved' ? <Check className="w-5 h-5 text-emerald-500" /> : <X className="w-5 h-5 text-red-500" />}
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{u.provider?.user?.full_name}</span>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          u.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>{u.status}</span>
                      </div>
                      {u.admin_note && (
                        <p className="text-xs text-gray-500 ml-8">{t('Reason:', 'وجہ:')} {u.admin_note}</p>
                      )}
                      {u.screenshot_url && (
                        <a href={u.screenshot_url} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-600 hover:underline ml-8 inline-flex items-center gap-1 mt-1">
                          <ExternalLink className="w-3 h-3" />{t('View Screenshot', 'اسکرین شاٹ')}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('Rejection Reason', 'مسترد کرنے کی وجہ')}</h3>
            <textarea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder={t('Explain why...', 'وجہ بتائیں...')} className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none mb-4" />
            <div className="flex gap-2">
              <button onClick={() => { setRejectModal(null); setRejectReason('') }} className="flex-1 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-600 dark:text-gray-400">{t('Cancel', 'منسوخ')}</button>
              <button onClick={handleReject} disabled={actionLoading} className="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1">{actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}{t('Reject', 'مسترد کریں')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}