import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Crown, X } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { getCurrentUser } from '@/lib/auth'

export default function ProviderPricing() {
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [showModal, setShowModal] = useState(false)
  const [screenshot, setScreenshot] = useState(null)
  const [screenshotPreview, setScreenshotPreview] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  const paymentNumbers = {
    easypaisa: '03XX-XXXXXXX',
    jazzcash: '03XX-XXXXXXX',
    nayapay: '03XX-XXXXXXX',
  }

  function handleScreenshotUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('Max 5MB'); return }
    setScreenshot(file)
    setScreenshotPreview(URL.createObjectURL(file))
  }

  async function handleSubmit() {
    if (!paymentMethod) { alert(t('Select payment method', 'ادائیگی کا طریقہ منتخب کریں')); return }
    if (!screenshot) { alert(t('Upload payment screenshot', 'ادائیگی کا اسکرین شاٹ اپ لوڈ کریں')); return }
    setSubmitting(true)
    try {
      const user = await getCurrentUser()
      const { data: provider } = await supabase.from('providers').select('id').eq('user_id', user.id).single()

      // Upload screenshot
      const ext = screenshot.name.split('.').pop()
      const path = `pro-upgrades/${provider.id}/${Date.now()}.${ext}`
      await supabase.storage.from('pro-upgrades').upload(path, screenshot)
      const { data: urlData } = supabase.storage.from('pro-upgrades').getPublicUrl(path)

      // Save upgrade request
      await supabase.from('pro_upgrade_requests').insert({
        provider_id: provider.id,
        payment_method: paymentMethod,
        screenshot_url: urlData.publicUrl,
        status: 'pending'
      })

      setSubmitted(true)
    } catch (err) {
      alert('Failed: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const freeFeatures = [
    '4 Bookings / Week',
    'Standard Priority',
    '15 min Response Window',
    'Basic Profile',
    'Email Support',
  ]

  const proFeatures = [
    'Unlimited Bookings',
    '#1 Priority Matching',
    '30 min Response Window',
    'Verified GOLD Badge',
    'Featured in Search Results',
    'Earnings Dashboard',
    'WhatsApp Priority Support',
    'Multi-City Access',
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 page-enter" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Choose Your Plan', 'اپنا پلان منتخب کریں')}</h1>
      </header>

      <div className="max-w-4xl mx-auto p-4 lg:p-8">
        {submitted ? (
          /* Success State */
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 text-center shadow-sm border border-gray-100 dark:border-gray-700 max-w-md mx-auto">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('Submitted!', 'جمع ہو گیا!')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('Your upgrade request is under review. You will be notified within 24 hours.', 'آپ کی اپ گریڈ کی درخواست زیر جائزہ ہے۔ آپ کو 24 گھنٹوں میں مطلع کیا جائے گا۔')}</p>
            <button onClick={() => navigate('/provider/dashboard')} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-all">
              {t('Back to Dashboard', 'ڈیش بورڈ پر واپس')}
            </button>
          </div>
        ) : (
          <>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-8 text-sm">{t('Select the plan that works for you', 'وہ پلان منتخب کریں جو آپ کے لیے بہترین ہو')}</p>

            {/* Plan Cards */}
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {/* FREE CARD */}
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden group hover:shadow-md transition-all duration-300">
                {/* 25% accent with 45° diagonal */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-purple-50 dark:from-purple-900/10 to-transparent" 
                     style={{ clipPath: 'polygon(30% 0, 100% 0, 100% 100%, 0% 100%)' }} />
                
                <div className="relative p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t('Free', 'مفت')}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{t('For getting started', 'شروع کرنے کے لیے')}</p>
                  
                  <div className="mb-5">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">PKR 0</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">/month</span>
                  </div>

                  <ul className="space-y-2.5 mb-6">
                    {freeFeatures.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Check className="w-4 h-4 text-gray-400 flex-shrink-0" /> {t(f, f)}
                      </li>
                    ))}
                  </ul>

                  <button disabled className="w-full py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-xl text-sm font-medium cursor-not-allowed">
                    {t('Current Plan', 'موجودہ پلان')}
                  </button>
                </div>
              </div>

              {/* PRO CARD */}
              <div className="relative bg-gradient-to-br from-purple-600 to-purple-800 rounded-3xl shadow-xl border-2 border-yellow-400 overflow-hidden group hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:-translate-y-1">
                {/* Gold shimmer */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-400/20 rounded-full blur-2xl" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-yellow-400/10 rounded-full blur-2xl" />

                <div className="relative p-6 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold">PRO</h3>
                    <span className="px-2 py-0.5 bg-yellow-400 text-purple-900 rounded-full text-xs font-bold flex items-center gap-1">
                      <Crown className="w-3 h-3" /> BEST
                    </span>
                  </div>
                  <p className="text-xs text-purple-200 mb-4">{t('For serious providers', 'سنجیدہ پرووائیڈرز کے لیے')}</p>

                  <div className="mb-5">
                    <span className="text-4xl font-bold">PKR 1,000</span>
                    <span className="text-sm text-purple-200">/month</span>
                  </div>

                  <ul className="space-y-2.5 mb-6">
                    {proFeatures.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-purple-100">
                        <Check className="w-4 h-4 text-yellow-400 flex-shrink-0" /> {t(f, f)}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => setShowModal(true)}
                    className="w-full py-3 bg-white text-purple-700 rounded-xl text-sm font-bold hover:bg-yellow-400 hover:text-purple-900 transition-all duration-200 shadow-lg"
                  >
                    {t('Upgrade to PRO', 'پرو میں اپ گریڈ کریں')}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('Upgrade to PRO', 'پرو میں اپ گریڈ کریں')}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Payment Instructions */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 mb-4">
              <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-3">
                {t('Send PKR 1,000 via:', '1000 روپے بھیجیں:')}
              </p>
              <div className="space-y-2">
                {Object.entries(paymentNumbers).map(([method, number]) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-sm transition-all ${
                      paymentMethod === method
                        ? 'bg-purple-600 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                    }`}
                  >
                    <span className="font-medium capitalize">{method}</span>
                    <span className="font-mono">{number}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Screenshot Upload */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('Upload Payment Screenshot', 'ادائیگی کا اسکرین شاٹ اپ لوڈ کریں')}
              </p>
              {screenshotPreview ? (
                <div className="relative">
                  <img src={screenshotPreview} alt="Screenshot" className="w-full rounded-xl border border-gray-200 dark:border-gray-600" />
                  <button onClick={() => { setScreenshot(null); setScreenshotPreview(null) }} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-purple-500 transition-colors">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{t('Tap to upload', 'اپ لوڈ کرنے کے لیے تھپتھپائیں')}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleScreenshotUpload} />
                </label>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !paymentMethod || !screenshot}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-xl text-sm font-semibold transition-all"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('Submitting...', 'جمع ہو رہا ہے...')}
                </span>
              ) : (
                t('Submit for Review', 'جائزے کے لیے جمع کرائیں')
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}