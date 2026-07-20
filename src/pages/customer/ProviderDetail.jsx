import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, CheckCircle, MapPin, Award, Wrench, Plug, ShoppingBag, Monitor, Briefcase, Calendar, Clock, Send, X, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { getCurrentUser } from '@/lib/auth'

const serviceIcons = { plumber: Wrench, electrician: Plug, grocery: ShoppingBag, computer_repair: Monitor }

export default function ProviderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [provider, setProvider] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBooking, setShowBooking] = useState(false)
  const [bookingStep, setBookingStep] = useState(1)
  const [bookingForm, setBookingForm] = useState({ date: '', time: '', description: '' })
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState('')

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase.from('providers').select('*, user:user_id(id, full_name, avatar_url, city, phone, cnic_number)').eq('id', id).single()
      setProvider(p)
      if (p) {
        const { data: r } = await supabase.from('provider_feedback').select('*, customer:customer_id(full_name)').eq('provider_id', p.id).order('created_at', { ascending: false }).limit(10)
        setReviews(r || [])
      }
      setLoading(false)
    }
    load()
  }, [id])

  

  

  async function handleDirectBook() {
    if (!bookingForm.date || !bookingForm.time || !bookingForm.description.trim()) {
      setBookingError(t('Please fill all fields', 'براہ کرم تمام فیلڈز بھریں'))
      return
    }
    setBookingLoading(true)
    setBookingError('')
    try {
      const user = await getCurrentUser()
      const rawText = bookingForm.description
      const { data: request, error: insertError } = await supabase.from('requests').insert({
        customer_id: user.id, raw_text: rawText, service_type: provider.service_types?.[0],
        preferred_date: bookingForm.date, preferred_time: bookingForm.time, city: 'Jand', status: 'contacting',
        parsed_intent: { urgency: 'normal', direct_booking: true, provider_id: provider.id },
        expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
      }).select().single()
      if (insertError) throw insertError

      await supabase.from('notifications').insert({ user_id: provider.user_id, type: 'new_request', title: t('Direct Booking', 'براہ راست بکنگ'), message: `${user.user_metadata?.full_name || 'Customer'}: ${rawText}`, action_url: `/provider/request/${request.id}` })
      await supabase.from('provider_responses').insert({ request_id: request.id, provider_id: provider.id, response_type: 'accepted', contact_order: 1, responded_at: new Date().toISOString() })
      await supabase.from('bookings').insert({ request_id: request.id, customer_id: user.id, provider_id: provider.id, service_type: provider.service_types?.[0], scheduled_date: bookingForm.date, scheduled_time: bookingForm.time, status: 'confirmed' })
      await supabase.from('requests').update({ status: 'confirmed' }).eq('id', request.id)
      navigate(`/customer/request/${request.id}`)
    } catch (err) { setBookingError(err.message) }
    finally { setBookingLoading(false) }
  }

  function closeModal() { setShowBooking(false); setBookingStep(1); setBookingForm({ date: '', time: '', description: '' }); setBookingError('') }

  if (loading) return <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>
  if (!provider) return <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center"><p className="text-gray-500">{t('Provider not found', 'پرووائیڈر نہیں ملا')}</p></div>

  const mainService = provider.service_types?.[0] || 'plumber'
  const ServiceIcon = serviceIcons[mainService] || Wrench

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => navigate('/customer/providers', { replace: true })} className="text-gray-500 dark:text-gray-400"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Profile', 'پروفائل')}</h1>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          {provider.user?.avatar_url ? <img src={provider.user.avatar_url} alt="" className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-purple-100 dark:border-purple-900" />
            : <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto"><ServiceIcon className="w-10 h-10 text-white" /></div>}
          <div className="flex items-center justify-center gap-2 mt-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{provider.user?.full_name}</h2>
            {provider.plan === 'pro' && <span className="text-xs px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full font-medium flex items-center gap-1"><Award className="w-3 h-3" /> PRO</span>}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 capitalize">{provider.service_types?.join(' • ')}</p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="text-center"><div className="flex items-center gap-1"><Star className="w-5 h-5 text-amber-400 fill-amber-400" /><span className="text-lg font-bold text-gray-900 dark:text-white">{provider.avg_rating || '--'}</span></div><p className="text-xs text-gray-500">{t('Rating', 'ریٹنگ')}</p></div>
            <div className="w-px h-10 bg-gray-200 dark:bg-gray-700" />
            <div className="text-center"><p className="text-lg font-bold text-gray-900 dark:text-white">{provider.total_jobs || 0}</p><p className="text-xs text-gray-500">{t('Jobs', 'کام')}</p></div>
            <div className="w-px h-10 bg-gray-200 dark:bg-gray-700" />
            <div className="text-center"><p className="text-lg font-bold text-emerald-600">{provider.acceptance_rate || 0}%</p><p className="text-xs text-gray-500">{t('Accept', 'قبولیت')}</p></div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 space-y-3">
          <div className="flex items-center gap-3 text-sm"><MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300">{provider.user?.city || 'Jand'}</span></div>
          {provider.experience && <div className="flex items-center gap-3 text-sm"><Briefcase className="w-5 h-5 text-gray-400 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300">{provider.experience} {t('years', 'سال')}</span></div>}
          {provider.bio && <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700"><p className="text-sm text-gray-600 dark:text-gray-400">{provider.bio}</p></div>}
        </div>

        <button onClick={() => setShowBooking(true)} className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-purple-200 dark:shadow-purple-900">{t('Book Now', 'ابھی بک کریں')}</button>

        {reviews.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('Reviews', 'جائزے')}</h3>
            <div className="space-y-3">{reviews.map(r => (
              <div key={r.id} className="border-b border-gray-50 dark:border-gray-700 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-1"><span className="text-sm font-medium text-gray-900 dark:text-white">{r.customer?.full_name || 'Customer'}</span>
                  <div className="flex items-center gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className={`w-3 h-3 ${i <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-600'}`} />)}</div>
                </div>
                {r.review_text && <p className="text-sm text-gray-600 dark:text-gray-400">{r.review_text}</p>}
              </div>
            ))}</div>
          </div>
        )}
      </div>

            {/* Booking Modal */}
      {showBooking && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {bookingStep === 1 ? t('Describe Issue', 'مسئلہ بتائیں') : bookingStep === 2 ? t('Select Date', 'تاریخ منتخب کریں') : t('Select Time', 'وقت منتخب کریں')}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            {bookingError && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 text-xs rounded-xl px-3 py-2 mb-3">{bookingError}</div>}

            <div className="flex items-center gap-2 mb-4">
              {[1,2,3].map(s => (
                <div key={s} className={`flex-1 h-1 rounded-full transition-all ${bookingStep >= s ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
              ))}
            </div>

            {/* STEP 1: Description */}
            {bookingStep === 1 && (
              <div className="space-y-4">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('What needs to be fixed?', 'کیا ٹھیک کروانا ہے؟')}</label>
                <textarea
                  rows={4}
                  value={bookingForm.description}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('Describe the issue...', 'مسئلہ بتائیں...')}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none placeholder-gray-400 focus:ring-2 focus:ring-purple-500 outline-none"
                  autoFocus
                />
                <button
                  onClick={() => bookingForm.description.trim() && setBookingStep(2)}
                  disabled={!bookingForm.description.trim()}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  {t('Continue', 'جاری رکھیں')}
                </button>
              </div>
            )}

            {/* STEP 2: Date */}
            {bookingStep === 2 && (
              <div>
                <button onClick={() => setBookingStep(1)} className="text-sm text-purple-600 dark:text-purple-400 mb-3 flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> {t('Back', 'واپس')}
                </button>
                <div className="space-y-2">
                  {[...Array(7)].map((_, i) => {
                    const date = new Date(); date.setDate(date.getDate() + i)
                    const dateStr = date.toISOString().split('T')[0]
                    const isToday = i === 0
                    const dayName = isToday ? t('Today', 'آج') : date.toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-US', { weekday: 'long' })
                    const dateDisplay = date.toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-US', { day: 'numeric', month: 'long' })
                    return (
                      <button key={dateStr} onClick={() => { setBookingForm(prev => ({ ...prev, date: dateStr })); setBookingStep(3) }}
                        className="w-full flex items-center justify-between p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                        <div className="text-left"><p className="text-sm font-medium text-gray-900 dark:text-white">{dayName}</p><p className="text-xs text-gray-500 dark:text-gray-400">{dateDisplay}</p></div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: Time */}
            {bookingStep === 3 && (
              <div>
                <button onClick={() => setBookingStep(2)} className="text-sm text-purple-600 dark:text-purple-400 mb-3 flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> {t('Back', 'واپس')}
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  {bookingForm.date && new Date(bookingForm.date).toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>

                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">{t('Enter Time', 'وقت درج کریں')}</label>

                <div className="flex items-center gap-2 justify-center mb-6">
                  <input
                    type="text" inputMode="numeric" placeholder="10" maxLength={2}
                    value={(() => { if (!bookingForm.time) return ''; const h = parseInt(bookingForm.time.split(':')[0]); if (isNaN(h)) return ''; if (h === 0) return '12'; if (h > 12) return String(h - 12); return String(h) })()}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '')
                      if (raw === '') { setBookingForm(prev => ({ ...prev, time: '' })); return }
                      let val = parseInt(raw); if (val > 12) val = 12; if (val < 1) val = 1
                      const ampm = (bookingForm.time && bookingForm.time.includes('PM')) ? 'PM' : 'AM'
                      const realHour = ampm === 'PM' ? (val === 12 ? 12 : val + 12) : (val === 12 ? 0 : val)
                      setBookingForm(prev => ({ ...prev, time: `${String(realHour).padStart(2, '0')}:00` }))
                    }}
                    className="w-16 text-center py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-2xl font-bold focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                  <span className="text-2xl font-bold text-gray-400">:</span>
                  <span className="w-16 text-center py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-2xl font-bold">00</span>
                  <button type="button"
                    onClick={() => {
                      if (!bookingForm.time) { setBookingForm(prev => ({ ...prev, time: '08:00' })); return }
                      const hour = parseInt(bookingForm.time.split(':')[0])
                      const isPM = bookingForm.time.includes('PM') || hour >= 12
                      const newHour = isPM ? (hour >= 12 ? hour - 12 : hour) : hour + 12
                      setBookingForm(prev => ({ ...prev, time: `${String(newHour).padStart(2, '0')}:00` }))
                    }}
                    className={`px-4 py-3 rounded-xl text-sm font-bold min-w-[56px] transition-all ${bookingForm.time && (bookingForm.time.includes('PM') || parseInt(bookingForm.time) >= 12) ? 'bg-indigo-600 text-white' : 'bg-amber-500 text-white'}`}
                  >
                    {bookingForm.time && (bookingForm.time.includes('PM') || parseInt(bookingForm.time) >= 12) ? 'PM' : 'AM'}
                  </button>
                </div>

                <div className="flex gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-xl p-3 mb-4">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>{new Date(bookingForm.date).toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  <span>•</span>
                  <span className="text-xs text-gray-500 truncate">{bookingForm.description}</span>
                </div>

                <button onClick={handleDirectBook} disabled={bookingLoading}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                  {bookingLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                  {bookingLoading ? t('Booking...', 'بک ہو رہا ہے...') : t('Send Request', 'درخواست بھیجیں')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}