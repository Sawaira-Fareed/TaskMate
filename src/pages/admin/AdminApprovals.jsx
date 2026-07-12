import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, X, User, Phone, Mail, FileText, Award, Camera, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function AdminApprovals() {
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState(null)

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from('providers')
          .select('*, user:user_id(id, email, full_name, phone, cnic_number, cnic_front_url, cnic_back_url, address, avatar_url)')
          .eq('is_approved', false)
        setProviders(data || [])
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const handleApprove = async (id) => {
    if (!confirm(t('Approve this provider?', 'کیا آپ اس پرووائیڈر کو منظور کرنا چاہتے ہیں؟'))) return
    await supabase.from('providers').update({ is_approved: true }).eq('id', id)
    setProviders(prev => prev.filter(p => p.id !== id))
    setSelectedProvider(null)
  }

  const handleReject = async (id) => {
    if (!confirm(t('Reject this provider?', 'کیا آپ اس پرووائیڈر کو مسترد کرنا چاہتے ہیں؟'))) return
    await supabase.from('providers').delete().eq('id', id)
    setProviders(prev => prev.filter(p => p.id !== id))
    setSelectedProvider(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Pending Approvals', 'زیر التواء منظوریاں')}</h1>
      </header>
      <div className="max-w-4xl mx-auto p-4">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : providers.length === 0 ? (
          <div className="text-center py-20">
            <User className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('No pending providers', 'کوئی زیر التواء پرووائیڈر نہیں')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {providers.map(p => (
              <div key={p.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {/* Summary Row */}
                <button
                  onClick={() => setSelectedProvider(selectedProvider?.id === p.id ? null : p)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                      {p.user?.avatar_url ? (
                        <img src={p.user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{p.user?.full_name || 'Provider'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{p.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full font-medium">
                      {p.service_types?.join(', ') || 'N/A'}
                    </span>
                  </div>
                </button>

                {/* Expanded Details */}
                {selectedProvider?.id === p.id && (
                  <div className="border-t border-gray-100 dark:border-gray-700 p-5 space-y-4 bg-gray-50 dark:bg-gray-750">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">{p.user?.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">{p.user?.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">CNIC: {p.user?.cnic_number || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Award className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">{p.experience ? `${p.experience} years exp` : 'Experience: N/A'}</span>
                      </div>
                    </div>

                    {/* CNIC Images */}
                    {(p.user?.cnic_front_url || p.user?.cnic_back_url) && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t('CNIC Images', 'شناختی کارڈ کی تصاویر')}</p>
                        <div className="grid grid-cols-2 gap-3">
                          {p.user?.cnic_front_url && (
                            <div>
                              <p className="text-xs text-gray-400 mb-1">{t('Front', 'سامنے')}</p>
                              <a href={p.user.cnic_front_url} target="_blank" rel="noopener noreferrer" className="block">
                                <img src={p.user.cnic_front_url} alt="CNIC Front" className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600" />
                              </a>
                            </div>
                          )}
                          {p.user?.cnic_back_url && (
                            <div>
                              <p className="text-xs text-gray-400 mb-1">{t('Back', 'پیچھے')}</p>
                              <a href={p.user.cnic_back_url} target="_blank" rel="noopener noreferrer" className="block">
                                <img src={p.user.cnic_back_url} alt="CNIC Back" className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Certificate */}
                    {p.certificate_url && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('Certificate', 'سرٹیفکیٹ')}</p>
                        <a href={p.certificate_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 hover:underline">
                          <ExternalLink className="w-3 h-3" /> {t('View Certificate', 'سرٹیفکیٹ دیکھیں')}
                        </a>
                      </div>
                    )}

                    {/* Bio */}
                    {p.bio && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('Bio', 'تعارف')}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{p.bio}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => handleApprove(p.id)} className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 text-sm font-medium">
                        <Check className="w-4 h-4" /> {t('Approve', 'منظور کریں')}
                      </button>
                      <button onClick={() => handleReject(p.id)} className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl py-2.5 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30">
                        <X className="w-4 h-4" /> {t('Reject', 'مسترد کریں')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}