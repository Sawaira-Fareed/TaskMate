import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Clock, AlertTriangle, Zap, Wrench, Plug, ShoppingBag, Monitor, MapPin, Calendar, Mic, Send, Square, ChevronRight, Loader2, WifiOff, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { getCurrentUser } from '@/lib/auth'
import { parseIntent } from '@/api/parseIntent'
import { matchProviders } from '@/api/matchProviders'
import { contactProviderLoop } from '@/api/contactProviderLoop'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

const STEPS = ['Priority', 'Service', 'Details', 'Review']

export default function CreateRequest() {
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationError, setValidationError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const { isOnline, isSlow } = useNetworkStatus()

  const [gettingLocation, setGettingLocation] = useState(false)
  const [coordinates, setCoordinates] = useState(null)

  const [priority, setPriority] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')

  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [voiceNote, setVoiceNote] = useState(null)
  const [voiceBlob, setVoiceBlob] = useState(null)

  const [detailStep, setDetailStep] = useState(1)

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  const priorities = [
    { id: 'normal', icon: Clock, en: 'Normal', ur: 'نارمل', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800' },
    { id: 'urgent', icon: AlertTriangle, en: 'Urgent', ur: 'ارجنٹ', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-800' },
    { id: 'emergency', icon: Zap, en: 'Emergency', ur: 'ایمرجنسی', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-800' },
  ]

  const services = [
    { id: 'plumber', icon: Wrench, en: 'Plumbing', ur: 'پلمبنگ' },
    { id: 'electrician', icon: Plug, en: 'Electrician', ur: 'الیکٹریشن' },
    { id: 'grocery', icon: ShoppingBag, en: 'Grocery Delivery', ur: 'گروسری ڈیلیوری' },
    { id: 'computer_repair', icon: Monitor, en: 'Computer Repair', ur: 'کمپیوٹر مرمت' },
  ]

  const startRecording = async () => {
    try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); const recorder = new MediaRecorder(stream); const chunks = []; recorder.ondataavailable = (e) => chunks.push(e.data); recorder.onstop = () => { const blob = new Blob(chunks, { type: 'audio/webm' }); setVoiceBlob(blob); setVoiceNote(URL.createObjectURL(blob)) }; recorder.start(); setMediaRecorder(recorder); setIsRecording(true) }
    catch (err) { alert(t('Microphone access denied.', 'مائیکروفون کی اجازت مسترد کر دی گئی۔')) }
  }

  function sanitize(str) { if (!str) return str; return str.replace(/[<>{}]/g, '').trim() }

  const stopRecording = () => { mediaRecorder?.stop(); mediaRecorder?.stream.getTracks().forEach(track => track.stop()); setIsRecording(false) }
  const removeVoiceNote = () => { setVoiceNote(null); setVoiceBlob(null) }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) { alert(t('Geolocation not supported', 'جیو لوکیشن سپورٹ نہیں ہے')); return }
    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition((position) => { const { latitude, longitude } = position.coords; setCoordinates({ lat: latitude, lng: longitude }); setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`); setGettingLocation(false) }, () => { alert(t('Could not get location. Please type manually.', 'مقام حاصل نہیں ہو سکا۔ براہ کرم خود لکھیں۔')); setGettingLocation(false) }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 })
  }

  const shareLocationLink = () => { if (!coordinates) return; const mapUrl = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`; if (navigator.share) { navigator.share({ title: 'My Location', text: 'Here is my location', url: mapUrl }).catch(() => {}) } else { navigator.clipboard.writeText(mapUrl); alert(t('Location link copied!', 'مقام کا لنک کاپی ہو گیا!')) } }

  const canProceed = () => {
    if (step === 1) return priority !== ''
    if (step === 2) return serviceType !== ''
    if (step === 3) { setValidationError(''); if (!description && !voiceBlob) { setValidationError(t('Description or voice note is required', 'تفصیل یا وائس نوٹ درکار ہے')); return false } if (!date) { setValidationError(t('Date is required', 'تاریخ درکار ہے')); return false } if (!time) { setValidationError(t('Time is required', 'وقت درکار ہے')); return false } if (!location) { setValidationError(t('Location is required', 'مقام درکار ہے')); return false } return true }
    return true
  }

  const handleSubmit = async () => {
    setError(''); setLoading(true)
    try {
      const user = await getCurrentUser()
      let voiceNoteUrl = null
      if (voiceBlob) { const fileName = `voice-notes/${user.id}/${Date.now()}.webm`; const { error: uploadError } = await supabase.storage.from('requests').upload(fileName, voiceBlob); if (!uploadError) { const { data: urlData } = supabase.storage.from('requests').getPublicUrl(fileName); voiceNoteUrl = urlData.publicUrl } }
      const rawText = sanitize(description) || `Need ${sanitize(serviceType)} service at ${sanitize(location)}`
      let parsedIntent
      try { parsedIntent = await parseIntent(rawText) } catch (parseErr) { parsedIntent = { service_type: serviceType, preferred_date: date, preferred_time: time, language: lang, urgency: priority, items: [] } }
      parsedIntent.service_type = serviceType || parsedIntent.service_type; parsedIntent.preferred_date = date || parsedIntent.preferred_date; parsedIntent.preferred_time = time || parsedIntent.preferred_time; parsedIntent.urgency = priority || parsedIntent.urgency

      const { data: request, error: insertError } = await supabase.from('requests').insert({ customer_id: user.id, raw_text: sanitize(rawText), service_type: sanitize(parsedIntent.service_type), items: parsedIntent.items || [], preferred_date: parsedIntent.preferred_date, preferred_time: parsedIntent.preferred_time, city: 'Jand', language: sanitize(parsedIntent.language) || 'urdu', status: 'pending', parsed_intent: { ...parsedIntent, location: sanitize(location), coordinates: coordinates ? `${coordinates.lat},${coordinates.lng}` : null, voice_note_url: voiceNoteUrl, description }, expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() }).select().single()
      if (insertError) throw insertError

      matchProviders(parsedIntent, user.id).then(providers => { if (providers?.length > 0) contactProviderLoop(request.id, providers) }).catch(err => console.error('Matching failed:', err))

      setSuccessMsg(t('Request Submitted!', 'درخواست جمع ہو گئی!'))
      setTimeout(() => navigate(`/customer/request/${request.id}`), 800)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const getNext7Days = () => [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() + i); const dateStr = d.toISOString().split('T')[0]; const isToday = i === 0; const dayName = isToday ? t('Today', 'آج') : d.toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-US', { weekday: 'long' }); const dateDisplay = d.toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-US', { day: 'numeric', month: 'long' }); return { dateStr, dayName, dateDisplay, isToday } })

  if (!isOnline) {
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4"><div className="text-center"><WifiOff className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" /><h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('No Internet', 'انٹرنیٹ نہیں ہے')}</h3><button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium">{t('Retry', 'دوبارہ کوشش کریں')}</button></div></div>)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-start justify-center p-4 pt-20" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      {isSlow && (<div className="fixed top-16 left-0 right-0 z-50 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs text-center py-1.5">{t('Slow connection', 'انٹرنیٹ سست ہے')}</div>)}
      {successMsg && (<div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-lg text-sm font-medium animate-pulse"><Check className="w-4 h-4 inline mr-1" /> {successMsg}</div>)}

      <div className="w-full max-w-lg">
        <div className="text-center mb-6"><h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('New Service Request', 'نئی سروس کی درخواست')}</h1>
          <div className="flex items-center justify-center gap-1 mt-3">{STEPS.map((s, i) => (<div key={s} className="flex items-center gap-1"><div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${i + 1 <= step ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>{i + 1 < step ? <Check className="w-3 h-3" /> : i + 1}</div>{i < STEPS.length - 1 && <div className={`w-6 h-0.5 transition-all ${i + 1 < step ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'}`} />}</div>))}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          {error && (<div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-xl px-4 py-2.5 mb-4 border border-red-200 dark:border-red-800"><AlertTriangle className="w-3.5 h-3.5 inline mr-1" />{error}<button onClick={handleSubmit} className="ml-2 underline font-medium">{t('Retry', 'دوبارہ کوشش')}</button></div>)}
          {validationError && (<div className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs rounded-xl px-4 py-2.5 mb-4 border border-amber-200 dark:border-amber-800">{validationError}</div>)}

          {step === 1 && (<div className="space-y-3"><p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-2">{t('Select priority level', 'ترجیح کی سطح منتخب کریں')}</p>{priorities.map(p => { const Icon = p.icon; return (<button key={p.id} onClick={() => setPriority(p.id)} className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${priority === p.id ? `${p.border} ${p.bg}` : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}><div className="flex items-center gap-3"><Icon className={`w-5 h-5 ${p.color}`} /><span className="text-sm font-semibold text-gray-900 dark:text-white">{lang === 'ur' ? p.ur : p.en}</span></div></button>) })})
          </div>)}

          {step === 2 && (<div className="grid grid-cols-2 gap-3">{services.map(s => { const Icon = s.icon; return (<button key={s.id} onClick={() => setServiceType(s.id)} className={`p-4 rounded-xl border-2 text-center transition-all duration-200 hover:shadow-md ${serviceType === s.id ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 shadow-md' : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'}`}><Icon className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" /><span className="text-xs font-medium text-gray-700 dark:text-gray-300">{lang === 'ur' ? s.ur : s.en}</span></button>) })})
          </div>)}

          {step === 3 && (<div>
            <div className="flex items-center gap-2 mb-4">{[1,2,3].map(s => (<div key={s} className={`flex-1 h-1 rounded-full transition-all ${detailStep >= s ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'}`} />))}</div>
            {detailStep === 1 && (<div className="space-y-4">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('What needs to be fixed?', 'کیا ٹھیک کروانا ہے؟')}</label>
              <div className="flex items-center gap-2 mb-3">{!isRecording ? (<button type="button" onClick={startRecording} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 border border-gray-200 dark:border-gray-600 transition-all"><Mic className="w-4 h-4" /> {t('Record Voice Note', 'وائس نوٹ ریکارڈ کریں')}</button>) : (<button type="button" onClick={stopRecording} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500 text-white animate-pulse"><Square className="w-4 h-4" /> {t('Stop Recording', 'ریکارڈنگ روکیں')}</button>)}{voiceNote && (<div className="flex items-center gap-2"><audio src={voiceNote} controls className="h-10 w-48" /><button onClick={removeVoiceNote} className="text-xs text-red-500 dark:text-red-400 hover:text-red-600 font-medium">{t('Remove', 'ہٹائیں')}</button></div>)}</div>
              <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={voiceNote ? t('Add text notes (optional)...', 'مزید تفصیل لکھیں (اختیاری)...') : t('Describe what you need...', 'تفصیل سے لکھیں کہ آپ کو کیا چاہیے...')} className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900 outline-none resize-none placeholder-gray-400 dark:placeholder-gray-500" autoFocus />
              <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"><MapPin className="w-3.5 h-3.5 inline mr-1" />{t('Location', 'مقام')} *</label><input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t('Enter address or landmark', 'پتہ یا نشانی لکھیں')} className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900 outline-none" />
              <div className="mt-2"><div className="flex items-center gap-2"><button type="button" onClick={getCurrentLocation} disabled={gettingLocation} className="flex items-center gap-1 px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl text-xs font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"><MapPin className="w-3.5 h-3.5" />{gettingLocation ? t('Getting location...', 'مقام حاصل ہو رہا ہے...') : t('Share Current Location', 'موجودہ مقام شیئر کریں')}</button>{coordinates && (<button type="button" onClick={shareLocationLink} className="flex items-center gap-1 px-3 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-medium hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors">{t('Share Link', 'لنک شیئر کریں')}</button>)}</div>{coordinates && (<p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}</p>)}</div></div>
              <button onClick={() => { if (description.trim() || voiceBlob) { setDetailStep(2); setValidationError('') } else setValidationError(t('Description or voice note is required', 'تفصیل یا وائس نوٹ درکار ہے')) }} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-all">{t('Continue', 'جاری رکھیں')}</button>
            </div>)}
            {detailStep === 2 && (<div><button onClick={() => setDetailStep(1)} className="text-sm text-purple-600 dark:text-purple-400 mb-3 flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" /> {t('Back', 'واپس')}</button><div className="space-y-2">{getNext7Days().map(d => (<button key={d.dateStr} onClick={() => { setDate(d.dateStr); setDetailStep(3) }} className="w-full flex items-center justify-between p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200 border border-transparent hover:border-purple-200 dark:hover:border-purple-700"><div className="text-left"><p className="text-sm font-medium text-gray-900 dark:text-white">{d.dayName}</p><p className="text-xs text-gray-500 dark:text-gray-400">{d.dateDisplay}</p></div><ChevronRight className="w-4 h-4 text-gray-400" /></button>))}</div></div>)}
            {detailStep === 3 && (<div><button onClick={() => setDetailStep(2)} className="text-sm text-purple-600 dark:text-purple-400 mb-3 flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" /> {t('Back', 'واپس')}</button><p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{date && new Date(date).toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</p><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">{t('Enter Time', 'وقت درج کریں')}</label><div className="flex items-center gap-2 justify-center mb-6"><input type="text" inputMode="numeric" placeholder="10" maxLength={2} value={(() => { if (!time) return ''; const h = parseInt(time.split(':')[0]); if (isNaN(h)) return ''; if (h === 0) return '12'; if (h > 12) return String(h - 12); return String(h) })()} onChange={(e) => { const raw = e.target.value.replace(/\D/g, ''); if (raw === '') { setTime(''); return } let val = parseInt(raw); if (val > 12) val = 12; if (val < 1) val = 1; const ampm = (time && time.includes('PM')) ? 'PM' : 'AM'; const realHour = ampm === 'PM' ? (val === 12 ? 12 : val + 12) : (val === 12 ? 0 : val); setTime(`${String(realHour).padStart(2, '0')}:00`) }} className="w-16 text-center py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-2xl font-bold focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none" /><span className="text-2xl font-bold text-gray-400">:</span><span className="w-16 text-center py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-2xl font-bold">00</span><button type="button" onClick={() => { if (!time) { setTime('08:00'); return } const hour = parseInt(time.split(':')[0]); const isPM = time.includes('PM') || hour >= 12; const newHour = isPM ? (hour >= 12 ? hour - 12 : hour) : hour + 12; setTime(`${String(newHour).padStart(2, '0')}:00`) }} className={`px-4 py-3 rounded-xl text-sm font-bold min-w-[56px] transition-all ${time && (time.includes('PM') || parseInt(time) >= 12) ? 'bg-indigo-600 text-white' : 'bg-amber-500 text-white'}`}>{time && (time.includes('PM') || parseInt(time) >= 12) ? 'PM' : 'AM'}</button></div><div className="flex gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-xl p-3 mb-4"><Calendar className="w-4 h-4 flex-shrink-0" /><span>{new Date(date).toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' })}</span><span>•</span><span className="text-xs text-gray-500 truncate">{description}</span></div><button onClick={() => { if (time) { setDetailStep(1); setStep(4); setValidationError('') } else setValidationError(t('Time is required', 'وقت درکار ہے')) }} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-all">{t('Continue to Review', 'جائزہ پر جائیں')}</button></div>)}
          </div>)}

          {step === 4 && (<div className="space-y-3"><p className="text-xs text-gray-500 dark:text-gray-400 text-center">{t('Review before submitting', 'جمع کرانے سے پہلے جائزہ لیں')}</p><div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-2 text-sm"><div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t('Priority', 'ترجیح')}</span><span className="font-medium text-gray-900 dark:text-white capitalize">{priority}</span></div><div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t('Service', 'سروس')}</span><span className="font-medium text-gray-900 dark:text-white">{serviceType}</span></div><div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t('Date', 'تاریخ')}</span><span className="font-medium text-gray-900 dark:text-white">{date}</span></div><div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t('Time', 'وقت')}</span><span className="font-medium text-gray-900 dark:text-white">{time}</span></div>{description && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t('Description', 'تفصیل')}</span><span className="font-medium text-gray-900 dark:text-white text-right max-w-[200px] truncate">{description}</span></div>}{voiceNote && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t('Voice Note', 'وائس نوٹ')}</span><span className="font-medium text-emerald-600 dark:text-emerald-400">{t('Attached', 'منسلک')} ✓</span></div>}<div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t('Location', 'مقام')}</span><span className="font-medium text-gray-900 dark:text-white">{location}</span></div></div></div>)}

          <div className="flex gap-2 mt-6">
            {step > 1 && (<button onClick={() => setStep(step - 1)} className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"><ArrowLeft className="w-3.5 h-3.5" /> {t('Back', 'واپس')}</button>)}
            {step < 3 ? (<button onClick={() => { if (canProceed()) setStep(step + 1) }} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-all hover:shadow-lg">{t('Next', 'اگلا')} <ArrowRight className="w-3.5 h-3.5" /></button>) : step === 3 ? (<button onClick={() => { if (canProceed()) setStep(4) }} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-all hover:shadow-lg">{t('Review', 'جائزہ')} <ArrowRight className="w-3.5 h-3.5" /></button>) : (
              <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-all hover:shadow-lg">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}{loading ? t('Submitting...', 'جمع ہو رہا ہے...') : t('Submit Request', 'درخواست جمع کریں')}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}