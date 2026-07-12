import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Search } from 'lucide-react'

export default function FAQ() {
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [search, setSearch] = useState('')
  const [active, setActive] = useState(null)

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  const faqs = [
    { en: 'How do I create a service request?', ur: 'سروس کی درخواست کیسے بنائیں؟', ansEn: 'Go to Dashboard → New Request. Select priority, service type, fill details like date, time, description, price, and location. Submit and wait for provider offers.', ansUr: 'ڈیش بورڈ → نئی درخواست پر جائیں۔ ترجیح، سروس کی قسم منتخب کریں، تاریخ، وقت، تفصیل، قیمت اور مقام بھریں۔ جمع کرائیں اور پرووائیڈر کی پیشکشوں کا انتظار کریں۔' },
    { en: 'How does pricing and negotiation work?', ur: 'قیمت اور گفت و شنید کیسے کام کرتی ہے؟', ansEn: 'You offer a price when creating a request. Providers can accept your price or send a counter-offer. You decide which offer to accept.', ansUr: 'آپ درخواست بناتے وقت قیمت پیش کرتے ہیں۔ پرووائیڈرز آپ کی قیمت قبول کر سکتے ہیں یا جوابی پیشکش بھیج سکتے ہیں۔ آپ فیصلہ کرتے ہیں کہ کون سی پیشکش قبول کرنی ہے۔' },
    { en: 'How do I record a voice note?', ur: 'وائس نوٹ کیسے ریکارڈ کریں؟', ansEn: 'When filling a request, click the microphone icon in the description field. Allow microphone access, press record, speak your request, and stop when done.', ansUr: 'درخواست بھرتے وقت، تفصیل والے خانے میں مائیکروفون آئیکن پر کلک کریں۔ مائیکروفون کی اجازت دیں، ریکارڈ دبائیں، اپنی درخواست بولیں، اور مکمل ہونے پر روک دیں۔' },
    { en: 'Can I cancel a request?', ur: 'کیا میں درخواست منسوخ کر سکتا ہوں؟', ansEn: 'Yes, you can cancel a request anytime before a booking is confirmed. Go to My Requests, find the request, and cancel it.', ansUr: 'جی ہاں، آپ بکنگ کی تصدیق سے پہلے کسی بھی وقت درخواست منسوخ کر سکتے ہیں۔ میری درخواستوں میں جائیں، درخواست تلاش کریں، اور منسوخ کریں۔' },
    { en: 'How do I rate a provider?', ur: 'پرووائیڈر کو ریٹ کیسے کریں؟', ansEn: 'After a job is completed, go to My Bookings, find the completed booking, and click "Rate Provider". Give 1-5 stars and optional feedback.', ansUr: 'کام مکمل ہونے کے بعد، میری بکنگز میں جائیں، مکمل شدہ بکنگ تلاش کریں، اور "پرووائیڈر کو ریٹ کریں" پر کلک کریں۔ 1-5 ستارے دیں اور اختیاری رائے دیں۔' },
  ]

  const filtered = faqs.filter(f => {
    const q = search.toLowerCase()
    return f.en.toLowerCase().includes(q) || f.ur.includes(q) || f.ansEn.toLowerCase().includes(q)
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">FAQ</h1>
        </div>
        <div className="flex items-center gap-1 bg-purple-50 dark:bg-purple-900/30 p-1 rounded-lg">
          <button onClick={() => { setLang('en'); localStorage.setItem('zaria-language', 'en') }} className={`px-2 py-1 text-xs font-medium rounded ${lang === 'en' ? 'bg-purple-600 text-white' : 'text-purple-600 dark:text-purple-400'}`}>EN</button>
          <button onClick={() => { setLang('ur'); localStorage.setItem('zaria-language', 'ur') }} className={`px-2 py-1 text-xs font-medium rounded ${lang === 'ur' ? 'bg-purple-600 text-white' : 'text-purple-600 dark:text-purple-400'}`}>اردو</button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('Search FAQs...', 'سوالات تلاش کریں...')} className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500/50" />
        </div>

        <div className="space-y-3">
          {filtered.map((f, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <button onClick={() => setActive(active === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{lang === 'ur' ? f.ur : f.en}</span>
                <ChevronRight className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${active === i ? 'rotate-90' : ''}`} />
              </button>
              {active === i && <div className="px-5 pb-4"><p className="text-sm text-gray-500 dark:text-gray-400">{lang === 'ur' ? f.ansUr : f.ansEn}</p></div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}