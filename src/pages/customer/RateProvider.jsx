import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Star, Send, CheckCircle, DollarSign } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function RateProvider() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [review, setReview] = useState('')
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [alreadyRated, setAlreadyRated] = useState(false)
  const [error, setError] = useState('')

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  const handleSubmit = async () => {
    if (!rating) { setError(t('Please select a rating', 'براہ کرم ریٹنگ منتخب کریں')); return }
    if (!price || parseInt(price) <= 0) { setError(t('Please enter the amount paid', 'براہ کرم ادا کی گئی رقم درج کریں')); return }

    setLoading(true)
    setError('')
    try {
      // Find booking by ID
      const { data: booking, error: bookingErr } = await supabase
        .from('bookings')
        .select('id, request_id, provider_id, customer_id, rating')
        .eq('id', bookingId)
        .single()

      if (bookingErr || !booking) throw new Error('Booking not found')

      // Check if already rated
      if (booking.rating) {
        setAlreadyRated(true)
        setTimeout(() => navigate('/customer/my-requests', { replace: true }), 1500)
        return
      }

      // Update booking to completed
      await supabase
        .from('bookings')
        .update({ rating, rated_at: new Date(), status: 'completed', provider_earnings: parseInt(price) })
        .eq('id', booking.id)

      // Update linked request to completed
      if (booking.request_id) {
        await supabase.from('requests').update({ status: 'completed' }).eq('id', booking.request_id)
      }

      // Save feedback
      await supabase.from('provider_feedback').insert({
        booking_id: booking.id,
        customer_id: booking.customer_id,
        provider_id: booking.provider_id,
        rating,
        review_text: review || null,
        is_public: true,
      })

      // Update provider average rating
      const { data: allRatings } = await supabase
        .from('provider_feedback')
        .select('rating')
        .eq('provider_id', booking.provider_id)
      if (allRatings?.length > 0) {
        const avg = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
        await supabase
          .from('providers')
          .update({ avg_rating: Math.round(avg * 100) / 100, total_jobs: allRatings.length })
          .eq('id', booking.provider_id)
      }

      // Audit log
      await supabase.from('audit_logs').insert({
        request_id: booking.request_id,
        customer_id: booking.customer_id,
        provider_id: booking.provider_id,
        event_type: 'booking_completed',
        status_before: 'confirmed',
        status_after: 'completed'
      })

      navigate('/customer/my-requests', { replace: true })
    } catch (err) {
      alert('Failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (alreadyRated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center max-w-sm shadow-xl">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{t('Already Rated!', 'پہلے ہی ریٹ کر دیا ہے!')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-start justify-center p-4 pt-20">
      <div className="w-full max-w-sm">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('Rate & Complete', 'ریٹنگ اور تکمیل')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('How was your experience?', 'آپ کا تجربہ کیسا رہا؟')}</p>

          {error && <div className="bg-red-50 text-red-600 text-xs rounded-xl px-3 py-2 mb-4">{error}</div>}

          <div className="flex justify-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map(i => (
              <button key={i} onClick={() => setRating(i)} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)} className="transition-transform hover:scale-110">
                <Star className={`w-10 h-10 ${i <= (hover || rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-600'}`} />
              </button>
            ))}
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 text-left">
              <DollarSign className="w-3.5 h-3.5 inline mr-1" />{t('Amount Paid (PKR)', 'ادا کی گئی رقم (روپے)')} *
            </label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} min="1" placeholder="500"
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" />
          </div>

          <textarea rows={2} value={review} onChange={(e) => setReview(e.target.value)} placeholder={t('Write a review (optional)', 'جائزہ لکھیں (اختیاری)')}
            className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none mb-4 placeholder-gray-400" />

          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? t('Submitting...', 'جمع ہو رہا ہے...') : t('Submit & Complete', 'جمع کریں اور مکمل کریں')}
          </button>
        </div>
      </div>
    </div>
  )
}