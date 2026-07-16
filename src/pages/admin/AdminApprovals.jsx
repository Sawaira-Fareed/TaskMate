import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, X, User, Phone, Mail, FileText, Award, ExternalLink, ShieldOff } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function AdminApprovals() {
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [activeTab, setActiveTab] = useState('pending')
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [blockModal, setBlockModal] = useState(null)
  const [blockReason, setBlockReason] = useState('')

  const t = (en, ur) => (lang === 'ur' ? ur : en)
  async function loadProviders() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('providers')
        .select('*, user:user_id(id, email, full_name, phone, cnic_number, cnic_front_url, cnic_back_url, address, avatar_url)')
        .eq('is_approved', activeTab === 'pending' ? false : true)
        .order('created_at', { ascending: false })
      setProviders(data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    loadProviders()
  }, [activeTab])

  useEffect(() => {
    const channel = supabase
      .channel('admin-approvals')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'providers' },
        () => loadProviders()
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [activeTab])
  const handleApprove = async (id) => {
    if (!confirm(t('Approve this provider?', 'کیا آپ اس پرووائیڈر کو منظور کرنا چاہتے ہیں؟'))) return
    await supabase.from('providers').update({ is_approved: true, rejection_reason: null, rejected_at: null }).eq('id', id)
    const { data: p } = await supabase.from('providers').select('user_id').eq('id', id).single()
    if (p) {
      await supabase.from('notifications').insert({
        user_id: p.user_id,
        type: 'provider_approved',
        title: t('Registration Approved', 'رجسٹریشن منظور'),
        message: t('You are now active. Start receiving requests!', 'آپ اب فعال ہیں۔ درخواستیں وصول کرنا شروع کریں!'),
        action_url: '/provider/dashboard'
      })
    }
    setProviders(prev => prev.filter(p => p.id !== id))
    setSelectedProvider(null)
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert(t('Please enter a reason', 'براہ کرم وجہ درج کریں'))
      return
    }
    await supabase.from('providers').update({
      is_approved: false,
      rejection_reason: rejectReason,
      rejected_at: new Date().toISOString()
    }).eq('id', rejectModal)

    const { data: p } = await supabase.from('providers').select('user_id').eq('id', rejectModal).single()
    if (p) {
      await supabase.from('notifications').insert({
        user_id: p.user_id,
        type: 'provider_rejected',
        title: t('Registration Rejected', 'رجسٹریشن مسترد'),
        message: rejectReason,
        action_url: '/provider/profile'
      })
    }
    setProviders(prev => prev.filter(p => p.id !== rejectModal))
    setRejectModal(null)
    setRejectReason('')
    setSelectedProvider(null)
  }

  const handleBlock = async () => {
    if (!blockReason.trim()) {
      alert(t('Please enter a reason', 'براہ کرم وجہ درج کریں'))
      return
    }
    await supabase.from('providers').update({
      is_blocked: true,
      blocked_reason: blockReason,
      is_approved: false
    }).eq('id', blockModal)

    const { data: p } = await supabase.from('providers').select('user_id').eq('id', blockModal).single()
    if (p) {
      await supabase.from('notifications').insert({
        user_id: p.user_id,
        type: 'provider_rejected',
        title: t('Account Blocked', 'اکاؤنٹ بلاک'),
        message: blockReason,
        action_url: '/provider/profile'
      })
    }
    setProviders(prev => prev.filter(p => p.id !== blockModal))
    setBlockModal(null)
    setBlockReason('')
    setSelectedProvider(null)
  }

  const handleRevoke = async (id) => {
    if (!confirm(t('Revoke approval?', 'منظوری منسوخ کریں؟'))) return
    await supabase.from('providers').update({ is_approved: false }).eq('id', id)
    setProviders(prev => prev.filter(p => p.id !== id))
    setSelectedProvider(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Provider Management', 'پرووائیڈر مینجمنٹ')}</h1>
      </header>

      <div className="max-w-4xl mx-auto p-4">
        <div className="flex gap-1 mb-4 bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-100 dark:border-gray-700">
          <button onClick={() => { setActiveTab('pending'); setSelectedProvider(null) }} className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === 'pending' ? 'bg-purple-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
            {t('Pending', 'زیر التواء')}
          </button>
          <button onClick={() => { setActiveTab('approved'); setSelectedProvider(null) }} className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === 'approved' ? 'bg-purple-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
            {t('Approved', 'منظور شدہ')}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : providers.length === 0 ? (
          <div className="text-center py-20">
            <User className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {activeTab === 'pending' ? t('No pending providers', 'کوئی زیر التواء پرووائیڈر نہیں') : t('No approved providers', 'کوئی منظور شدہ پرووائیڈر نہیں')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {providers.map(p => (
              <div key={p.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <button onClick={() => setSelectedProvider(selectedProvider?.id === p.id ? null : p)} className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                      {p.user?.avatar_url ? <img src={p.user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" /> : <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{p.user?.full_name || 'Provider'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{p.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full font-medium capitalize">{p.service_types?.join(', ') || 'N/A'}</span>
                    {activeTab === 'approved' && <span className="text-xs px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full font-medium capitalize">{p.tier || 'bronze'}</span>}
                  </div>
                </button>

                {selectedProvider?.id === p.id && (
                  <div className="border-t border-gray-100 dark:border-gray-700 p-5 space-y-4 bg-gray-50 dark:bg-gray-750">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-gray-400 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300 truncate">{p.user?.email || 'N/A'}</span></div>
                      <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-gray-400 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300">{p.user?.phone || 'N/A'}</span></div>
                      <div className="flex items-center gap-2 text-sm"><FileText className="w-4 h-4 text-gray-400 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300">CNIC: {p.user?.cnic_number || 'N/A'}</span></div>
                      <div className="flex items-center gap-2 text-sm"><Award className="w-4 h-4 text-gray-400 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300">{p.experience ? `${p.experience} years` : 'Experience: N/A'}</span></div>
                    </div>
                    {p.user?.address && <div><p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('Address', 'پتہ')}</p><p className="text-sm text-gray-600 dark:text-gray-400">{p.user.address}</p></div>}
                    {(p.user?.cnic_front_url || p.user?.cnic_back_url) && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t('CNIC Images', 'شناختی کارڈ کی تصاویر')}</p>
                        <div className="grid grid-cols-2 gap-3">
                          {p.user?.cnic_front_url && <div><p className="text-xs text-gray-400 mb-1">{t('Front', 'سامنے')}</p><a href={p.user.cnic_front_url} target="_blank" rel="noopener noreferrer"><img src={p.user.cnic_front_url} alt="CNIC Front" className="w-full h-36 object-cover rounded-lg border border-gray-200 dark:border-gray-600 hover:opacity-90 transition-opacity" /></a></div>}
                          {p.user?.cnic_back_url && <div><p className="text-xs text-gray-400 mb-1">{t('Back', 'پیچھے')}</p><a href={p.user.cnic_back_url} target="_blank" rel="noopener noreferrer"><img src={p.user.cnic_back_url} alt="CNIC Back" className="w-full h-36 object-cover rounded-lg border border-gray-200 dark:border-gray-600 hover:opacity-90 transition-opacity" /></a></div>}
                        </div>
                      </div>
                    )}
                    {p.certificate_url && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('Certificate', 'سرٹیفکیٹ')}</p>
                        <a href={p.certificate_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-purple-600 dark:text-purple-400 hover:underline bg-purple-50 dark:bg-purple-900/20 px-3 py-1.5 rounded-lg"><ExternalLink className="w-3.5 h-3.5" />{t('View Certificate', 'سرٹیفکیٹ دیکھیں')}</a>
                      </div>
                    )}
                    {p.bio && <div><p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('Bio', 'تعارف')}</p><p className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">{p.bio}</p></div>}
                    {activeTab === 'approved' && (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border"><p className="text-lg font-bold text-purple-600">{p.total_jobs || 0}</p><p className="text-xs text-gray-500">{t('Jobs', 'کام')}</p></div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border"><p className="text-lg font-bold text-emerald-600">{p.avg_rating || '--'}</p><p className="text-xs text-gray-500">{t('Rating', 'ریٹنگ')}</p></div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border"><p className="text-lg font-bold text-amber-600">{p.acceptance_rate || 0}%</p><p className="text-xs text-gray-500">{t('Accept', 'قبولیت')}</p></div>
                      </div>
                    )}
                    <div className="pt-2">
                      {activeTab === 'pending' ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleApprove(p.id)} className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 text-sm font-medium"><Check className="w-4 h-4" /> {t('Approve', 'منظور')}</button>
                          <button onClick={() => { setRejectModal(p.id); setRejectReason('') }} className="flex-1 flex items-center justify-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-xl py-2.5 text-sm font-medium"><X className="w-4 h-4" /> {t('Reject', 'مسترد')}</button>
                          <button onClick={() => { setBlockModal(p.id); setBlockReason('') }} className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2.5 text-sm font-medium"><ShieldOff className="w-4 h-4" /> {t('Block', 'بلاک')}</button>
                        </div>
                      ) : (
                        <button onClick={() => handleRevoke(p.id)} className="w-full flex items-center justify-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-xl py-2.5 text-sm font-medium hover:bg-amber-100 dark:hover:bg-amber-900/30"><ShieldOff className="w-4 h-4" /> {t('Revoke Approval', 'منظوری منسوخ کریں')}</button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('Rejection Reason', 'مسترد کرنے کی وجہ')}</h3>
            <textarea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder={t('Explain why...', 'وجہ بتائیں...')} className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none mb-4" />
            <div className="flex gap-2">
              <button onClick={() => { setRejectModal(null); setRejectReason('') }} className="flex-1 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-600 dark:text-gray-400">{t('Cancel', 'منسوخ')}</button>
              <button onClick={handleReject} className="flex-1 py-2 bg-amber-600 text-white rounded-xl text-sm font-medium">{t('Reject', 'مسترد کریں')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Block Modal */}
      {blockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('Block Provider', 'پرووائیڈر بلاک کریں')}</h3>
            <p className="text-xs text-red-500 mb-3">{t('This is permanent.', 'یہ مستقل ہے۔')}</p>
            <textarea rows={3} value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder={t('Reason for blocking...', 'بلاک کرنے کی وجہ...')} className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none mb-4" />
            <div className="flex gap-2">
              <button onClick={() => { setBlockModal(null); setBlockReason('') }} className="flex-1 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-600 dark:text-gray-400">{t('Cancel', 'منسوخ')}</button>
              <button onClick={handleBlock} className="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm font-medium">{t('Block Permanently', 'مستقل بلاک کریں')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}