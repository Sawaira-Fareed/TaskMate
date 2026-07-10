import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Clock, AlertTriangle, Zap, Wrench, Plug, ShoppingBag, Monitor, MapPin, Calendar, DollarSign, Mic, Send, Square } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { getCurrentUser } from '../../lib/auth'

const STEPS = ['Priority', 'Service', 'Details', 'Review']

export default function CreateRequest() {
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form fields
  const [priority, setPriority] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [date, setDate] = useState('')
  const [timeFrom, setTimeFrom] = useState('')
  const [timeTo, setTimeTo] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [location, setLocation] = useState('')

  // Voice note
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [voiceNote, setVoiceNote] = useState(null)
  const [voiceBlob, setVoiceBlob] = useState(null)

  const t = (en, ur) => (lang === 'ur' ? ur : en)
  const toggleLanguage = (l) => { setLang(l); localStorage.setItem('zaria-language', l) }

  const priorities = [
    { id: 'normal', icon: Clock, en: 'Normal', ur: 'نارمل', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { id: 'urgent', icon: AlertTriangle, en: 'Urgent', ur: 'ارجنٹ', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { id: 'emergency', icon: Zap, en: 'Emergency', ur: 'ایمرجنسی', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  ]

  const services = [
    { id: 'plumber', icon: Wrench, en: 'Plumbing', ur: 'پلمبنگ' },
    { id: 'electrician', icon: Plug, en: 'Electrician', ur: 'الیکٹریشن' },
    { id: 'grocery', icon: ShoppingBag, en: 'Grocery Delivery', ur: 'گروسری ڈیلیوری' },
    { id: 'computer_repair', icon: Monitor, en: 'Computer Repair', ur: 'کمپیوٹر مرمت' },
  ]

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks = []
      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setVoiceBlob(blob)
        setVoiceNote(URL.createObjectURL(blob))
      }
      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
    } catch (err) {
      alert(t('Microphone access denied. Please allow microphone permissions in your browser settings.', 'مائیکروفون کی اجازت مسترد کر دی گئی۔ براہ کرم براؤزر کی ترتیبات میں مائیکروفون کی اجازت دیں۔'))
    }
  }

  const stopRecording = () => {
    mediaRecorder?.stop()
    mediaRecorder?.stream.getTracks().forEach(track => track.stop())
    setIsRecording(false)
  }

  const removeVoiceNote = () => {
    setVoiceNote(null)
    setVoiceBlob(null)
  }

  const canProceed = () => {
    if (step === 1) return priority !== ''
    if (step === 2) return serviceType !== ''
    if (step === 3) return date && timeFrom && (description || voiceBlob) && price && location
    return true
  }

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      const user = await getCurrentUser()

      // Upload voice note if exists
      let voiceNoteUrl = null
      if (voiceBlob) {
        const fileName = `voice-notes/${user.id}/${Date.now()}.webm`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('requests')
          .upload(fileName, voiceBlob)
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('requests').getPublicUrl(fileName)
          voiceNoteUrl = urlData.publicUrl
        }
      }

      const { error: insertError } = await supabase.from('requests').insert({
        customer_id: user.id,
        raw_text: description || '(Voice note attached)',
        service_type: serviceType,
        preferred_date: date,
        preferred_time: timeFrom,
        city: 'Jand',
        status: 'pending',
        parsed_intent: {
          priority,
          time_from: timeFrom,
          time_to: timeTo,
          price,
          location,
          voice_note_url: voiceNoteUrl,
        },
      })
      if (insertError) throw insertError
      navigate('/my-requests')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center p-4 pt-20" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-900">{t('New Service Request', 'نئی سروس کی درخواست')}</h1>
          <div className="flex items-center justify-center gap-1 mt-3">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${i + 1 <= step ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {i + 1 < step ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && <div className={`w-6 h-0.5 ${i + 1 < step ? 'bg-purple-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {error && <div className="bg-red-50 text-red-600 text-xs rounded-xl px-4 py-2.5 mb-4 border border-red-200">{error}</div>}

          {/* STEP 1: Priority */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 text-center mb-2">{t('Select priority level', 'ترجیح کی سطح منتخب کریں')}</p>
              {priorities.map(p => {
                const Icon = p.icon
                return (
                  <button key={p.id} onClick={() => setPriority(p.id)} className={`w-full p-4 rounded-xl border-2 text-left transition-all ${priority === p.id ? `${p.border} ${p.bg}` : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-center gap-3"><Icon className={`w-5 h-5 ${p.color}`} /><span className="text-sm font-semibold text-gray-900">{lang === 'ur' ? p.ur : p.en}</span></div>
                  </button>
                )
              })}
            </div>
          )}

          {/* STEP 2: Service Type */}
          {step === 2 && (
            <div className="grid grid-cols-2 gap-3">
              {services.map(s => {
                const Icon = s.icon
                return (
                  <button key={s.id} onClick={() => setServiceType(s.id)} className={`p-4 rounded-xl border-2 text-center transition-all ${serviceType === s.id ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}`}>
                    <Icon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <span className="text-xs font-medium text-gray-700">{lang === 'ur' ? s.ur : s.en}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* STEP 3: Details */}
          {step === 3 && (
            <div className="space-y-3.5">
              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1"><Calendar className="w-3.5 h-3.5 inline mr-1" />{t('Preferred Date', 'پسندیدہ تاریخ')}</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none bg-white" />
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('Time From', 'وقت از')}</label>
                  <input type="time" value={timeFrom} onChange={(e) => setTimeFrom(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('Time To', 'وقت تک')}</label>
                  <input type="time" value={timeTo} onChange={(e) => setTimeTo(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none bg-white" />
                </div>
              </div>

              {/* Description + Voice Note — Both Options */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  <Mic className="w-3.5 h-3.5 inline mr-1" />
                  {t('Description', 'تفصیل')}
                  <span className="text-gray-400 font-normal ml-1">({t('text or voice', 'لکھ کر یا آواز سے')})</span>
                </label>

                {/* Voice Record Button */}
                <div className="flex items-center gap-2 mb-3">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-all border border-gray-200"
                    >
                      <Mic className="w-4 h-4" /> {t('Record Voice Note', 'وائس نوٹ ریکارڈ کریں')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500 text-white animate-pulse transition-all"
                    >
                      <Square className="w-4 h-4" /> {t('Stop Recording', 'ریکارڈنگ روکیں')}
                    </button>
                  )}

                  {/* Voice Note Playback */}
                  {voiceNote && (
                    <div className="flex items-center gap-2">
                      <audio src={voiceNote} controls className="h-10 w-48" />
                      <button onClick={removeVoiceNote} className="text-xs text-red-500 hover:text-red-600 font-medium">{t('Remove', 'ہٹائیں')}</button>
                    </div>
                  )}
                </div>

                {/* Text Description */}
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={voiceNote ? t('Add text notes (optional)...', 'مزید تفصیل لکھیں (اختیاری)...') : t('Describe what you need in detail...', 'تفصیل سے لکھیں کہ آپ کو کیا چاہیے...')}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none resize-none bg-white placeholder-gray-400"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {t('You can provide text, voice note, or both.', 'آپ تحریری تفصیل، وائس نوٹ، یا دونوں دے سکتے ہیں۔')}
                </p>
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1"><DollarSign className="w-3.5 h-3.5 inline mr-1" />{t('Offered Price (PKR)', 'پیش کردہ قیمت (روپے)')}</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="500" className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none bg-white" />
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1"><MapPin className="w-3.5 h-3.5 inline mr-1" />{t('Location', 'مقام')}</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t('Your complete address', 'آپ کا مکمل پتہ')} className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none bg-white" />
              </div>
            </div>
          )}

          {/* STEP 4: Review */}
          {step === 4 && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 text-center">{t('Review your request before submitting', 'جمع کرانے سے پہلے اپنی درخواست کا جائزہ لیں')}</p>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">{t('Priority', 'ترجیح')}</span><span className="font-medium capitalize">{priority}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">{t('Service', 'سروس')}</span><span className="font-medium">{serviceType}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">{t('Date', 'تاریخ')}</span><span className="font-medium">{date}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">{t('Time', 'وقت')}</span><span className="font-medium">{timeFrom} - {timeTo}</span></div>
                {description && <div className="flex justify-between"><span className="text-gray-500">{t('Description', 'تفصیل')}</span><span className="font-medium text-right max-w-[200px] truncate">{description}</span></div>}
                {voiceNote && <div className="flex justify-between"><span className="text-gray-500">{t('Voice Note', 'وائس نوٹ')}</span><span className="font-medium text-emerald-600">{t('Attached', 'منسلک')} ✓</span></div>}
                <div className="flex justify-between"><span className="text-gray-500">{t('Price', 'قیمت')}</span><span className="font-medium">PKR {price}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">{t('Location', 'مقام')}</span><span className="font-medium">{location}</span></div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-2 mt-6">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> {t('Back', 'واپس')}
              </button>
            )}
            {step < 4 ? (
              <button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-xl px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-all">
                {t('Next', 'اگلا')} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-xl px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-all">
                {loading ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {loading ? t('Submitting...', 'جمع ہو رہا ہے...') : t('Submit Request', 'درخواست جمع کریں')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}