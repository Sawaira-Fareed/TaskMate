import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Star, Send } from 'lucide-react'
import { supabase } from "../../lib/supabaseClient";

export default function RateProvider() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [review, setReview] = useState('')
  const [loading, setLoading] = useState(false)

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  const handleSubmit = async () => {
    setLoading(true)
    await supabase.from('bookings').update({ rating, rated_at: new Date() }).eq('id', id)
    navigate('/my-bookings')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center p-4 pt-20" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">{t('Rate Your Provider', 'پرووائیڈر کو ریٹ کریں')}</h1>
          <p className="text-sm text-gray-500 mb-6">{t('How was your experience?', 'آپ کا تجربہ کیسا رہا؟')}</p>
          <div className="flex justify-center gap-1 mb-6">
            {[1, 2, 3, 4, 5].map(i => (
              <button key={i} onClick={() => setRating(i)} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)} className="transition-transform hover:scale-110">
                <Star className={`w-10 h-10 ${i <= (hover || rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
              </button>
            ))}
          </div>
          <textarea rows={3} value={review} onChange={(e) => setReview(e.target.value)} placeholder={t('Write a review (optional)', 'جائزہ لکھیں (اختیاری)')} className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none resize-none mb-4" />
          <button onClick={handleSubmit} disabled={!rating || loading} className="inline-flex items-center gap-2 px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-xl font-medium text-sm transition-all">
            <Send className="w-4 h-4" /> {t('Submit Rating', 'ریٹنگ جمع کریں')}
          </button>
        </div>
      </div>
    </div>
  )
}