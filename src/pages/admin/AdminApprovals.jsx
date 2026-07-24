import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, X, User, Phone, Mail, FileText, Award, ExternalLink, ShieldOff, Loader2, WifiOff, RefreshCw, AlertTriangle, Crown, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

export default function AdminApprovals() {
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [activeTab, setActiveTab] = useState('pending')
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [blockModal, setBlockModal] = useState(null)
  const [blockReason, setBlockReason] = useState('')
  const [removeModal, setRemoveModal] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const { isOnline, isSlow } = useNetworkStatus()

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  async function loadProviders() {
    setLoading(true)
    try {
      let query = supabase
        .from('providers')
        .select('*, user:user_id(id, email, full_name, phone, cnic_number, cnic_front_url, cnic_back_url, address, avatar_url)')
        .order('created_at', { ascending: false })

      if (activeTab === 'pending') query = query.eq('is_approved', false).eq('is_blocked', false)
      else if (activeTab === 'approved') query = query.eq('is_approved', true).eq('is_blocked', false)
      else if (activeTab === 'pro') query = query.eq('plan', 'pro')

      const { data } = await query
      setProviders(data || [])
      setError(null)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadProviders() }, [activeTab])

  useEffect(() => {
    const channel = supabase
      .channel('admin-approvals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'providers' }, () => loadProviders())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [activeTab])

  const handleApprove = async (id) => {
    if (!confirm(t('Approve this provider?', 'کیا آپ اس پرووائیڈر کو منظور کرنا چاہتے ہیں؟'))) return
    setActionLoading(true)
    try {
      await supabase.from('providers').update({ is_approved: true, rejection_reason: null, rejected_at: null }).eq('id', id)
      const { data: p } = await supabase.from('providers').select('user_id').eq('id', id).single()
      if (p) {
        await supabase.from('notifications').insert({
          user_id: p.user_id, type: 'provider_approved',
          title: t('Registration Approved', 'رجسٹریشن منظور'),
          message: t('You are now active. Start receiving requests!', 'آپ اب فعال ہیں۔ درخواستیں وصول کرنا شروع کریں!'),
          action_url: '/provider/dashboard'
        })
      }
      setSuccessMsg(t('Provider Approved!', 'پرووائیڈر منظور!'))
      setTimeout(() => setSuccessMsg(''), 2500)
      setProviders(prev => prev.filter(p => p.id !== id))
      setSelectedProvider(null)
    } catch (err) { alert('Failed: ' + err.message) }
    finally { setActionLoading(false) }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) { alert(t('Please enter a reason', 'براہ کرم وجہ درج کریں')); return }
    setActionLoading(true)
    try {
      await supabase.from('providers').update({ is_approved: false, rejection_reason: rejectReason, rejected_at: new Date().toISOString() }).eq('id', rejectModal)
      const { data: p } = await supabase.from('providers').select('user_id').eq('id', rejectModal).single()
      if (p) {
        await supabase.from('notifications').insert({
          user_id: p.user_id, type: 'provider_rejected',
          title: t('Registration Rejected', 'رجسٹریشن مسترد'),
          message: rejectReason, action_url: '/provider/profile'
        })
      }
      setSuccessMsg(t('Provider Rejected', 'پرووائیڈر مسترد'))
      setTimeout(() => setSuccessMsg(''), 2500)
      setProviders(prev => prev.filter(p => p.id !== rejectModal))
      setRejectModal(null); setRejectReason(''); setSelectedProvider(null)
    } catch (err) { alert('Failed: ' + err.message) }
    finally { setActionLoading(false) }
  }

  const handleBlock = async () => {
    if (!blockReason.trim()) { alert(t('Please enter a reason', 'براہ کرم وجہ درج کریں')); return }
    setActionLoading(true)
    try {
      await supabase.from('providers').update({ is_blocked: true, blocked_reason: blockReason, is_approved: false }).eq('id', blockModal)
      const { data: p } = await supabase.from('providers').select('user_id').eq('id', blockModal).single()
      if (p) {
        await supabase.from('notifications').insert({
          user_id: p.user_id, type: 'provider_rejected',
          title: t('Account Blocked', 'اکاؤنٹ بلاک'),
          message: blockReason, action_url: '/provider/profile'
        })
      }
      setSuccessMsg(t('Provider Blocked', 'پرووائیڈر بلاک'))
      setTimeout(() => setSuccessMsg(''), 2500)
      setProviders(prev => prev.filter(p => p.id !== blockModal))
      setBlockModal(null); setBlockReason(''); setSelectedProvider(null)
    } catch (err) { alert('Failed: ' + err.message) }
    finally { setActionLoading(false) }
  }

  const handleRevoke = async (id) => {
    if (!confirm(t('Revoke approval? Provider will need to be re-approved.', 'منظوری منسوخ کریں؟ پرووائیڈر کو دوبارہ منظور کرنا ہوگا۔'))) return
    setActionLoading(true)
    try {
      await supabase.from('providers').update({ is_approved: false }).eq('id', id)
      setSuccessMsg(t('Approval Revoked', 'منظوری منسوخ'))
      setTimeout(() => setSuccessMsg(''), 2500)
      setProviders(prev => prev.filter(p => p.id !== id))
      setSelectedProvider(null)
    } catch (err) { alert('Failed: ' + err.message) }
    finally { setActionLoading(false) }
  }

  const handleRemove = async (id, userId) => {
    if (!confirm(t('PERMANENTLY DELETE this provider? All their data will be erased. This cannot be undone.', 'کیا آپ اس پرووائیڈر کو مستقل طور پر ڈیلیٹ کرنا چاہتے ہیں؟ ان کا تمام ڈیٹا مٹ جائے گا۔ یہ واپس نہیں ہو سکتا۔'))) return
    setActionLoading(true)
    try {
      await supabase.from('providers').delete().eq('id', id)
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'provider_rejected',
        title: t('Account Disabled', 'اکاؤنٹ غیر فعال'),
        message: t('Your provider account has been permanently removed by the admin. You can still use Zaria as a customer.', 'آپ کا پرووائیڈر اکاؤنٹ ایڈمن کے ذریعے مستقل طور پر ہٹا دیا گیا ہے۔ آپ اب بھی زریعہ کو بطور گاہک استعمال کر سکتے ہیں۔'),
        action_url: '/customer/dashboard'
      })
      setSuccessMsg(t('Provider Removed', 'پرووائیڈر ہٹا دیا'))
      setTimeout(() => setSuccessMsg(''), 2500)
      setProviders(prev => prev.filter(p => p.id !== id))
      setSelectedProvider(null)
    } catch (err) { alert('Failed: ' + err.message) }
    finally { setActionLoading(false) }
  }

  if (!isOnline) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <WifiOff className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('No Internet', 'انٹرنیٹ نہیں ہے')}</h3>
          <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium">{t('Retry', 'دوبارہ کوشش کریں')}</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      {isSlow && (
        <div className="sticky top-0 z-50 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs text-center py-1.5">
          {t('Slow connection', 'انٹرنیٹ سست ہے')}
        </div>
      )}

      {/* Success Celebration */}
      {successMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 text-center shadow-2xl animate-bounce">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-emerald-500" />
            </div>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{successMsg}</p>
          </div>
        </div>
      )}

      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-gray-400"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Provider Management', 'پرووائیڈر مینجمنٹ')}</h1>
      </header>

      <div className="max-w-4xl mx-auto p-4">
        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-100 dark:border-gray-700">
          <button onClick={() => { setActiveTab('pending'); setSelectedProvider(null) }}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === 'pending' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-purple-100 dark:hover:bg-purple-900/20 hover:text-purple-600'}`}>
            {t('Pending', 'زیر التواء')}
          </button>
          <button onClick={() => { setActiveTab('approved'); setSelectedProvider(null) }}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === 'approved' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-purple-100 dark:hover:bg-purple-900/20 hover:text-purple-600'}`}>
            {t('Approved', 'منظور شدہ')}
          </button>
          <button onClick={() => { setActiveTab('pro'); setSelectedProvider(null) }}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${activeTab === 'pro' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-purple-100 dark:hover:bg-purple-900/20 hover:text-purple-600'}`}>
            <Crown className="w-3.5 h-3.5" />{t('Pro', 'پرو')}
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-2">{error}</p>
            <button onClick={loadProviders} className="inline-flex items-center gap-1 text-sm text-purple-600 font-medium">
              <RefreshCw className="w-4 h-4" /> {t('Retry', 'دوبارہ کوشش کریں')}
            </button>
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-20">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {activeTab === 'pending' ? t('No pending providers', 'کوئی زیر التواء پرووائیڈر نہیں') :
               activeTab === 'pro' ? t('No Pro providers', 'کوئی پرو پرووائیڈر نہیں') :
               t('No approved providers', 'کوئی منظور شدہ پرووائیڈر نہیں')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {providers.map(p => (
              <div key={p.id} className="relative bg-purple-50/50 dark:bg-gray-800 rounded-2xl shadow-sm border border-purple-100/40 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all">
                <button onClick={() => setSelectedProvider(selectedProvider?.id === p.id ? null : p)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-purple-50/80 dark:hover:bg-gray-750 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                      {p.user?.avatar_url ? <img src={p.user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" /> : <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 dark:text-white">{p.user?.full_name || 'Provider'}</p>
                        {p.plan === 'pro' && (
                          <span className="text-xs px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full font-bold flex items-center gap-0.5">
                            <Crown className="w-3 h-3" />PRO
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{p.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full font-medium capitalize">{p.service_types?.join(', ') || 'N/A'}</span>
                    {(activeTab === 'approved' || activeTab === 'pro') && <span className="text-xs px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full font-medium capitalize">{p.tier || 'bronze'}</span>}
                  </div>
                </button>

                {selectedProvider?.id === p.id && (
                  <div className="border-t border-purple-100 dark:border-gray-700 p-5 space-y-4 bg-white/50 dark:bg-gray-750">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-gray-400 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300 truncate">{p.user?.email || 'N/A'}</span></div>
                      <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-gray-400 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300">{p.user?.phone || 'N/A'}</span></div>
                      <div className="flex items-center gap-2 text-sm"><FileText className="w-4 h-4 text-gray-400 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300">CNIC: {p.user?.cnic_number || 'N/A'}</span></div>
                      <div className="flex items-center gap-2 text-sm"><Award className="w-4 h-4 text-gray-400 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300">{p.experience ? `${p.experience} ` : 'Experience: N/A'}</span></div>
                    </div>
                    {p.user?.address && <div><p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('Address', 'پتہ')}</p><p className="text-sm text-gray-600 dark:text-gray-400">{p.user.address}</p></div>}
                    {(p.user?.cnic_front_url || p.user?.cnic_back_url) && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t('CNIC Images', 'شناختی کارڈ کی تصاویر')}</p>
                        <div className="grid grid-cols-2 gap-3">
                          {p.user?.cnic_front_url && <div><p className="text-xs text-gray-400 mb-1">{t('Front', 'سامنے')}</p><a href={p.user.cnic_front_url} target="_blank" rel="noopener noreferrer"><img src={p.user.cnic_front_url} alt="CNIC Front" className="w-full h-36 object-cover rounded-lg border hover:opacity-90 transition-opacity" /></a></div>}
                          {p.user?.cnic_back_url && <div><p className="text-xs text-gray-400 mb-1">{t('Back', 'پیچھے')}</p><a href={p.user.cnic_back_url} target="_blank" rel="noopener noreferrer"><img src={p.user.cnic_back_url} alt="CNIC Back" className="w-full h-36 object-cover rounded-lg border hover:opacity-90 transition-opacity" /></a></div>}
                        </div>
                      </div>
                    )}
                    {p.certificate_url && (
                      <div><p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('Certificate', 'سرٹیفکیٹ')}</p><a href={p.certificate_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-purple-600 hover:underline bg-purple-50 dark:bg-purple-900/20 px-3 py-1.5 rounded-lg"><ExternalLink className="w-3.5 h-3.5" />{t('View Certificate', 'سرٹیفکیٹ دیکھیں')}</a></div>
                    )}
                    {p.bio && <div><p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('Bio', 'تعارف')}</p><p className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl p-3 border">{p.bio}</p></div>}
                    {(activeTab === 'approved' || activeTab === 'pro') && (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border"><p className="text-lg font-bold text-purple-600">{p.total_jobs || 0}</p><p className="text-xs text-gray-500">{t('Jobs', 'کام')}</p></div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border"><p className="text-lg font-bold text-emerald-600">{p.avg_rating || '--'}</p><p className="text-xs text-gray-500">{t('Rating', 'ریٹنگ')}</p></div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border"><p className="text-lg font-bold text-amber-600">{p.acceptance_rate || 0}%</p><p className="text-xs text-gray-500">{t('Accept', 'قبولیت')}</p></div>
                      </div>
                    )}
                    <div className="pt-2">
                      {activeTab === 'pending' ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleApprove(p.id)} disabled={actionLoading} className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50 transition-colors">
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}{t('Approve', 'منظور')}
                          </button>
                          <button onClick={() => { setRejectModal(p.id); setRejectReason('') }} className="flex-1 flex items-center justify-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-xl py-2.5 text-sm font-medium hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
                            <X className="w-4 h-4" /> {t('Reject', 'مسترد')}
                          </button>
                          <button onClick={() => { setBlockModal(p.id); setBlockReason('') }} className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2.5 text-sm font-medium transition-colors">
                            <ShieldOff className="w-4 h-4" /> {t('Block', 'بلاک')}
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => handleRevoke(p.id)} disabled={actionLoading} className="flex-1 flex items-center justify-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-xl py-2.5 text-sm font-medium hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}{t('Revoke', 'منسوخ')}
                          </button>
                          <button onClick={() => handleRemove(p.id, p.user_id)} disabled={actionLoading} className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl py-2.5 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}{t('Remove', 'ہٹائیں')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
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
              <button onClick={handleReject} disabled={actionLoading} className="flex-1 py-2 bg-amber-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1">{actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}{t('Reject', 'مسترد کریں')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Block Modal */}
      {blockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('Block Provider', 'پرووائیڈر بلاک کریں')}</h3>
            <p className="text-xs text-red-500 mb-3">{t('This is permanent.', 'یہ مستقل ہے۔')}</p>
            <textarea rows={3} value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder={t('Reason for blocking...', 'بلاک کرنے کی وجہ...')} className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none mb-4" />
            <div className="flex gap-2">
              <button onClick={() => { setBlockModal(null); setBlockReason('') }} className="flex-1 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-600 dark:text-gray-400">{t('Cancel', 'منسوخ')}</button>
              <button onClick={handleBlock} disabled={actionLoading} className="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1">{actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}{t('Block Permanently', 'مستقل بلاک کریں')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}