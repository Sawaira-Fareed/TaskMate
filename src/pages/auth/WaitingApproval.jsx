import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Clock, Mail, LogOut, XCircle, RefreshCw, Ban, Check, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { getCurrentUser } from '@/lib/auth'

export default function WaitingApproval() {
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [provider, setProvider] = useState(null)
  const [loading, setLoading] = useState(true)

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser()
      if (!user) return

      const { data } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setProvider(data)
      setLoading(false)
    }
    load()
  }, [])

  // Realtime subscription — auto-update when admin approves/rejects
  useEffect(() => {
    if (!provider) return

    const channel = supabase
      .channel('waiting-approval')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'providers', filter: `id=eq.${provider.id}` },
        (payload) => {
          setProvider(payload.new)

          // Auto-redirect if approved
          if (payload.new.is_approved && !payload.new.is_blocked && !payload.new.rejection_reason) {
            setTimeout(() => navigate('/provider/dashboard'), 1500)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [provider?.id])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  async function handleResubmit() {
    if (!confirm(t('Resubmit for approval?', 'دوبارہ بھیجیں؟'))) return
    await supabase.from('providers').update({
      rejection_reason: null,
      rejected_at: null
    }).eq('id', provider.id)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isApproved = provider?.is_approved && !provider?.is_blocked && !provider?.rejection_reason
  const isBlocked = provider?.is_blocked
  const isRejected = provider?.rejection_reason && !provider?.is_approved

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center border border-gray-100 dark:border-gray-700">

        {/* Approved State */}
        {isApproved ? (
          <>
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={40} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
              {t('Approved!', 'منظور ہو گیا!')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('Your account has been approved. Start receiving requests!', 'آپ کا اکاؤنٹ منظور ہو گیا ہے۔ درخواستیں وصول کرنا شروع کریں!')}
            </p>
            <button
              onClick={() => navigate('/provider/dashboard')}
              className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
            >
              {t('Go to Dashboard', 'ڈیش بورڈ پر جائیں')}
              <ArrowRight size={18} />
            </button>
          </>
        ) : isBlocked ? (
          <>
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Ban size={40} className="text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
              {t('Account Blocked', 'اکاؤنٹ بلاک')}
            </h1>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">{t('Reason:', 'وجہ:')}</p>
              <p className="text-sm text-red-700 dark:text-red-300">{provider.blocked_reason || t('Permanently blocked.', 'مستقل بلاک۔')}</p>
            </div>
          </>
        ) : isRejected ? (
          <>
            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle size={40} className="text-amber-600 dark:text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-2">
              {t('Registration Rejected', 'رجسٹریشن مسترد')}
            </h1>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mb-4 text-left">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">{t('Admin Message:', 'ایڈمن کا پیغام:')}</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">{provider.rejection_reason}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-blue-700 dark:text-blue-300">{t('Fix issues then resubmit.', 'مسائل ٹھیک کر کے دوبارہ بھیجیں۔')}</p>
            </div>
            <div className="flex gap-2 mb-3">
              <button onClick={() => navigate('/provider/profile')} className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 flex items-center justify-center gap-2">
                <RefreshCw size={18} /> {t('Make Changes', 'ترمیم کریں')}
              </button>
              <button onClick={handleResubmit} className="flex-1 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 flex items-center justify-center gap-2">
                <Check size={18} /> {t('Resubmit', 'دوبارہ بھیجیں')}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock size={40} className="text-amber-600 dark:text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('Waiting for Approval', 'منظوری کا انتظار ہے')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{t('Your account is being reviewed.', 'آپ کے اکاؤنٹ کا جائزہ لیا جا رہا ہے۔')}</p>
          </>
        )}

        {/* Common buttons */}
        <div className="space-y-2 mt-4">
          <button onClick={() => window.location.href = 'mailto:hanzala78616@gmail.com'} className="w-full py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm flex items-center justify-center gap-2">
            <Mail size={16} /> {t('Email Support', 'ای میل سپورٹ')}
          </button>
          <button onClick={handleLogout} className="w-full py-2 text-gray-500 dark:text-gray-400 text-sm flex items-center justify-center gap-2">
            <LogOut size={16} /> {t('Sign Out', 'سائن آؤٹ')}
          </button>
        </div>
      </div>
    </div>
  )
}