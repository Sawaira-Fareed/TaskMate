import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Star, Shield, Zap, MapPin, ChevronRight, Phone, Mail, MapPinIcon, Send, ArrowRight, Wrench, Plug, ShoppingBag, Monitor, Target, ClipboardList, Inbox, ThumbsUp } from 'lucide-react'
import ThemeToggle from '../components/ThemeToggle'

export default function Landing() {
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [activeFaq, setActiveFaq] = useState(null)
  const [activeService, setActiveService] = useState(0)
  const [activeStep, setActiveStep] = useState(0)
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })
  const [contactSent, setContactSent] = useState(false)

  const t = (en, ur) => (lang === 'ur' ? ur : en)
  const toggleLanguage = (l) => { setLang(l); localStorage.setItem('zaria-language', l) }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-rotate carousels
  useEffect(() => {
    const serviceTimer = setInterval(() => setActiveService(prev => (prev + 1) % 4), 1500)
    const stepTimer = setInterval(() => setActiveStep(prev => (prev + 1) % 4), 1500)
    return () => {
      clearInterval(serviceTimer)
      clearInterval(stepTimer)
    }
  }, [])

  function handleContactSubmit(e) {
    e.preventDefault()
    const subject = encodeURIComponent('Zaria Contact Form Inquiry')
    const body = encodeURIComponent(
      `Name: ${contactForm.name}\nEmail: ${contactForm.email}\n\nMessage:\n${contactForm.message}`
    )
    window.location.href = `mailto:hanzala78616@gmail.com?subject=${subject}&body=${body}`
    setContactSent(true)
    setContactForm({ name: '', email: '', message: '' })
    setTimeout(() => setContactSent(false), 3000)
  }

  const services = [
    { icon: Wrench, en: 'Plumbing', ur: 'پلمبنگ', descEn: 'Expert plumbers for leaks, installations & repairs', descUr: 'لیکیج، انسٹالیشن اور مرمت کے لیے ماہر پلمبر', img: '/images/plumbing.jpg' },
    { icon: Plug, en: 'Electrician', ur: 'الیکٹریشن', descEn: 'Certified electricians for wiring, repairs & safety', descUr: 'وائرنگ، مرمت اور سیفٹی کے لیے سرٹیفائیڈ الیکٹریشن', img: '/images/electrician.jpg' },
    { icon: ShoppingBag, en: 'Grocery Delivery', ur: 'گروسری ڈیلیوری', descEn: 'Fresh groceries delivered to your doorstep', descUr: 'تازہ گروسری آپ کی دہلیز پر ڈیلیور', img: '/images/grocery.jpg' },
    { icon: Monitor, en: 'Computer Repair', ur: 'کمپیوٹر مرمت', descEn: 'Hardware & software fixes by trained technicians', descUr: 'تربیت یافتہ ٹیکنیشنز کے ذریعے ہارڈویئر اور سافٹ ویئر کی مرمت', img: '/images/computer-repair.jpg' },
  ]

  const howSteps = [
    { icon: Target, step: '01', en: 'Choose Priority & Service', ur: 'ترجیح اور سروس منتخب کریں', descEn: 'Select Normal, Urgent, or Emergency. Pick your service.', descUr: 'نارمل، ارجنٹ، یا ایمرجنسی منتخب کریں۔ اپنی سروس چنیں۔', color: 'from-purple-500 to-purple-700', bg: 'bg-purple-100', textColor: 'text-purple-600' },
    { icon: ClipboardList, step: '02', en: 'Fill Request Details', ur: 'درخواست کی تفصیلات بھریں', descEn: 'Set date, time, describe the job, offer your price, add location.', descUr: 'تاریخ، وقت سیٹ کریں، کام کی تفصیل دیں، قیمت پیش کریں، مقام شامل کریں۔', color: 'from-blue-500 to-blue-700', bg: 'bg-blue-100', textColor: 'text-blue-600' },
    { icon: Inbox, step: '03', en: 'Receive Provider Offers', ur: 'پرووائیڈر کی پیشکشیں وصول کریں', descEn: 'Verified providers review and send offers. Compare and choose.', descUr: 'تصدیق شدہ پرووائیڈرز جائزہ لے کر پیشکشیں بھیجتے ہیں۔ موازنہ کریں اور منتخب کریں۔', color: 'from-emerald-500 to-emerald-700', bg: 'bg-emerald-100', textColor: 'text-emerald-600' },
    { icon: ThumbsUp, step: '04', en: 'Job Done & Rate', ur: 'کام مکمل اور درجہ بندی', descEn: 'Provider completes the job. Rate your experience.', descUr: 'پرووائیڈر کام مکمل کرتا ہے۔ اپنے تجربے کی درجہ بندی کریں۔', color: 'from-amber-500 to-amber-700', bg: 'bg-amber-100', textColor: 'text-amber-600' },
  ]

  const stats = [
    { number: '500+', en: 'Registered Users', ur: 'رجسٹرڈ صارفین' },
    { number: '120+', en: 'Verified Providers', ur: 'تصدیق شدہ پرووائیڈرز' },
    { number: '1500+', en: 'Completed Jobs', ur: 'مکمل شدہ کام' },
    { number: '4.8', en: 'Average Rating', ur: 'اوسط درجہ بندی', star: true },
  ]

  const features = [
    { icon: Shield, en: 'Verified Providers', ur: 'تصدیق شدہ پرووائیڈرز', descEn: 'Every provider is verified before joining', descUr: 'ہر پرووائیڈر شامل ہونے سے پہلے تصدیق شدہ ہے' },
    { icon: Zap, en: 'Fast Response', ur: 'تیز جواب', descEn: 'Get offers within minutes of submitting', descUr: 'درخواست جمع کرانے کے چند منٹوں میں پیشکشیں حاصل کریں' },
    { icon: MapPin, en: 'Local Matching', ur: 'مقامی میچنگ', descEn: 'Providers matched by location', descUr: 'پرووائیڈرز مقام کے لحاظ سے ملائے جاتے ہیں' },
  ]

  const reviews = [
    { name: 'Ahmed R.', en: 'Plumber arrived on time. Fair price.', ur: 'پلمبر وقت پر آیا۔ مناسب قیمت۔', rating: 5 },
    { name: 'Fatima S.', en: 'Got groceries delivered in 30 minutes!', ur: '30 منٹ میں گروسری ڈیلیور ہو گئی!', rating: 5 },
    { name: 'Usman K.', en: 'Computer repair was quick and professional.', ur: 'کمپیوٹر مرمت تیز اور پروفیشنل تھی۔', rating: 4 },
    { name: 'Ayesha M.', en: 'Finally a reliable electrician.', ur: 'آخرکار قابل اعتماد الیکٹریشن۔', rating: 5 },
  ]

  const faqs = [
    { en: 'How does pricing work?', ur: 'قیمت کا تعین کیسے ہوتا ہے؟', ansEn: 'You offer a price. Providers can accept or counter-offer.', ansUr: 'آپ قیمت پیش کرتے ہیں۔ پرووائیڈرز قبول یا جوابی پیشکش کر سکتے ہیں۔' },
    { en: 'How are providers verified?', ur: 'پرووائیڈرز کی تصدیق کیسے ہوتی ہے؟', ansEn: 'All submit CNIC. Admin reviews and approves.', ansUr: 'تمام شناختی کارڈ جمع کراتے ہیں۔ ایڈمن جائزہ لے کر منظوری دیتا ہے۔' },
    { en: 'Is registration free?', ur: 'کیا رجسٹریشن مفت ہے؟', ansEn: 'Yes! Free for both.', ansUr: 'جی ہاں! دونوں کے لیے مفت۔' },
    { en: 'Which cities?', ur: 'کون سے شہر؟', ansEn: 'Currently Jand, Punjab.', ansUr: 'فی الحال جند، پنجاب۔' },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm border-b border-gray-100 dark:border-gray-800' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">Z</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">Zaria</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-sm text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">{t('How it Works', 'کیسے کام کرتا ہے')}</a>
              <a href="#services" className="text-sm text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">{t('Services', 'خدمات')}</a>
              <a href="#reviews" className="text-sm text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">{t('Reviews', 'جائزے')}</a>
              <a href="#faq" className="text-sm text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">FAQ</a>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-1 bg-purple-50 dark:bg-purple-900/30 rounded-lg p-1">
                <button onClick={() => toggleLanguage('en')} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${lang === 'en' ? 'bg-purple-600 text-white' : 'text-purple-600 dark:text-purple-400'}`}>EN</button>
                <button onClick={() => toggleLanguage('ur')} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${lang === 'ur' ? 'bg-purple-600 text-white' : 'text-purple-600 dark:text-purple-400'}`}>اردو</button>
                <ThemeToggle />
              </div>
              <Link to="/login" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 px-3 py-2">{t('Login', 'لاگ ان')}</Link>
              <Link to="/register" className="text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg px-5 py-2.5 transition-all shadow-sm">{t('Get Started', 'شروع کریں')}</Link>
            </div>
            <button className="md:hidden text-gray-600 dark:text-gray-300" onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
          </div>
        </div>
        {mobileMenu && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-t dark:border-gray-800 px-4 py-4 space-y-3">
            <a href="#how-it-works" className="block text-sm py-2 text-gray-600 dark:text-gray-300">{t('How it Works', 'کیسے کام کرتا ہے')}</a>
            <a href="#services" className="block text-sm py-2 text-gray-600 dark:text-gray-300">{t('Services', 'خدمات')}</a>
            <a href="#reviews" className="block text-sm py-2 text-gray-600 dark:text-gray-300">{t('Reviews', 'جائزے')}</a>
            <a href="#faq" className="block text-sm py-2 text-gray-600 dark:text-gray-300">FAQ</a>
            <div className="flex gap-2 pt-2">
              <Link to="/login" className="flex-1 text-center text-sm border border-gray-300 dark:border-gray-700 rounded-lg py-2.5 text-gray-700 dark:text-gray-300">{t('Login', 'لاگ ان')}</Link>
              <Link to="/register" className="flex-1 text-center text-sm text-white bg-purple-600 rounded-lg py-2.5">{t('Get Started', 'شروع کریں')}</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                {t('Find Trusted Local Services', 'قابل اعتماد مقامی خدمات حاصل کریں')}<br />
                <span className="text-purple-600">{t('Without Phone Calls', 'بغیر فون کالز کے')}</span>
              </h1>
              <p className="text-lg text-gray-500 dark:text-gray-400 mt-6 leading-relaxed">
                {t('Book plumbers, electricians, grocery delivery and more. Set your budget, receive offers from verified providers, and hire with confidence.', 'پلمبر، الیکٹریشن، گروسری ڈیلیوری اور مزید بک کریں۔ اپنا بجٹ سیٹ کریں، تصدیق شدہ پرووائیڈرز سے پیشکشیں وصول کریں، اور اعتماد کے ساتھ خدمات حاصل کریں۔')}
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-all text-sm">
                  {t('Get Started', 'شروع کریں')} <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3.5 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:border-purple-300 dark:hover:border-purple-600 hover:text-purple-600 dark:hover:text-purple-400 transition-all text-sm">
                  {t('Become a Provider', 'پرووائیڈر بنیں')}
                </Link>
              </div>
              <div className="flex items-center gap-6 mt-8 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-400 fill-amber-400" /> 4.8 {t('Rating', 'ریٹنگ')}</span>
                <span className="flex items-center gap-1"><Shield className="w-4 h-4 text-emerald-500" /> {t('Verified', 'تصدیق شدہ')}</span>
                <span className="flex items-center gap-1"><Zap className="w-4 h-4 text-purple-500" /> {t('Fast', 'تیز')}</span>
              </div>
            </div>
            <div className="hidden md:flex justify-center items-center">
              <img src="/images/starting.jpg" alt="Zaria" className="w-full max-w-md h-auto object-contain rounded-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <div key={i} className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1 flex items-center justify-center gap-1">
                  {s.number}{s.star && <Star className="w-5 h-5 text-amber-400 fill-amber-400" />}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{lang === 'ur' ? s.ur : s.en}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works — 3D Carousel */}
      <section id="how-it-works" className="py-20 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('How Zaria Works', 'زریعہ کیسے کام کرتا ہے')}</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-3">{t('Four simple steps', 'چار آسان اقدامات')}</p>
          </div>
          <div className="relative h-[360px] flex items-center justify-center" style={{ perspective: '1500px' }}>
            {howSteps.map((item, i) => {
              const pos = (i - activeStep + howSteps.length) % howSteps.length
              let transform, z, opacity
              if (pos === 0) { transform = 'translateX(0) scale(1) rotateY(0deg)'; z = 5; opacity = 1 }
              else if (pos === 1) { transform = 'translateX(55%) scale(0.82) rotateY(-30deg)'; z = 3; opacity = 0.7 }
              else if (pos === howSteps.length - 1) { transform = 'translateX(-55%) scale(0.82) rotateY(30deg)'; z = 3; opacity = 0.7 }
              else { transform = 'translateX(0) scale(0.5) rotateY(0deg)'; z = 0; opacity = 0 }
              const IconComp = item.icon
              return (
                <div key={i} className="absolute w-[280px]" style={{ transform, zIndex: z, opacity, transition: 'all 0.9s ease-in-out', pointerEvents: pos === 0 ? 'auto' : 'none' }} onClick={() => setActiveStep(i)}>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className={`h-40 bg-gradient-to-br ${item.color} relative flex items-center justify-center`}>
                      <div className={`w-20 h-20 ${item.bg} rounded-2xl flex items-center justify-center`}><IconComp className={`w-10 h-10 ${item.textColor}`} strokeWidth={1.5} /></div>
                      <div className="absolute top-3 right-3 text-white/30 text-5xl font-bold">{item.step}</div>
                    </div>
                    <div className="p-5 text-center">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{lang === 'ur' ? item.ur : item.en}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{lang === 'ur' ? item.descUr : item.descEn}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-center gap-2 mt-8">
            {howSteps.map((_, i) => (
              <button key={i} onClick={() => setActiveStep(i)} className={`rounded-full transition-all duration-500 ${i === activeStep ? 'bg-purple-600 w-8 h-2.5' : 'bg-gray-300 dark:bg-gray-600 w-2.5 h-2.5'}`} />
            ))}
          </div>
        </div>
      </section>

      {/* Services — 3D Carousel */}
      <section id="services" className="py-20 bg-gray-50 dark:bg-gray-900 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('Our Services', 'ہماری خدمات')}</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-3">{t('Available at your fingertips', 'آپ کی انگلیوں پر دستیاب')}</p>
          </div>
          <div className="relative h-[440px] flex items-center justify-center" style={{ perspective: '1500px' }}>
            {services.map((item, i) => {
              const pos = (i - activeService + services.length) % services.length
              let transform, z, opacity
              if (pos === 0) { transform = 'translateX(0) scale(1) rotateY(0deg)'; z = 5; opacity = 1 }
              else if (pos === 1) { transform = 'translateX(65%) scale(0.8) rotateY(-35deg)'; z = 3; opacity = 0.7 }
              else if (pos === services.length - 1) { transform = 'translateX(-65%) scale(0.8) rotateY(35deg)'; z = 3; opacity = 0.7 }
              else { transform = 'translateX(0) scale(0.5) rotateY(0deg)'; z = 0; opacity = 0 }
              const IconComp = item.icon
              return (
                <div key={i} className="absolute w-[300px]" style={{ transform, zIndex: z, opacity, transition: 'all 0.9s ease-in-out', pointerEvents: pos === 0 ? 'auto' : 'none' }} onClick={() => setActiveService(i)}>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="h-52 bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                      <img src={item.img} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute bottom-3 left-3"><IconComp className="w-8 h-8 text-white drop-shadow-lg" strokeWidth={1.5} /></div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{lang === 'ur' ? item.ur : item.en}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{lang === 'ur' ? item.descUr : item.descEn}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-center gap-2 mt-8">
            {services.map((_, i) => (
              <button key={i} onClick={() => setActiveService(i)} className={`rounded-full transition-all duration-500 ${i === activeService ? 'bg-purple-600 w-8 h-2.5' : 'bg-gray-300 dark:bg-gray-600 w-2.5 h-2.5'}`} />
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('Why Choose Zaria', 'زریعہ کیوں منتخب کریں')}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="text-center p-6">
                <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <f.icon className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{lang === 'ur' ? f.ur : f.en}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{lang === 'ur' ? f.descUr : f.descEn}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="py-20 bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('Reviews', 'جائزے')}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {reviews.map((r, i) => (
              <div key={i} className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className={`w-4 h-4 ${j < r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-600'}`} />
                  ))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 italic">"{lang === 'ur' ? r.ur : r.en}"</p>
                <p className="text-xs font-medium text-gray-900 dark:text-white">— {r.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-10 md:p-14 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">{t('Ready?', 'تیار ہیں؟')}</h2>
          <p className="text-purple-100 mb-8">{t('Join Jand users.', 'جند کے صارفین میں شامل ہوں۔')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/register" className="px-8 py-3.5 bg-white text-purple-600 rounded-lg font-medium hover:bg-gray-50 transition-all text-sm">{t('Create Free Account', 'مفت اکاؤنٹ بنائیں')}</Link>
            <Link to="/register" className="px-8 py-3.5 border-2 border-white/30 text-white rounded-lg font-medium hover:bg-white/10 transition-all text-sm">{t('Become Provider', 'پرووائیڈر بنیں')}</Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">FAQ</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <button onClick={() => setActiveFaq(activeFaq === i ? null : i)} className="w-full flex items-center justify-between px-6 py-4 text-left">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{lang === 'ur' ? faq.ur : faq.en}</span>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${activeFaq === i ? 'rotate-90' : ''}`} />
                </button>
                {activeFaq === i && (
                  <div className="px-6 pb-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{lang === 'ur' ? faq.ansUr : faq.ansEn}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Ask queries via email */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              {t("Didn't find your answer?", 'آپ کا جواب نہیں ملا؟')}
            </p>
            <a
              href="mailto:hello@zaria.app?subject=Zaria%20FAQ%20Query"
              className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 rounded-lg font-medium text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
            >
              <Mail className="w-4 h-4" />
              {t('Ask queries via email', 'ای میل کے ذریعے سوال پوچھیں')}
            </a>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{t('Get in Touch', 'رابطہ کریں')}</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {t('Have questions? We\'d love to hear from you.', 'سوالات ہیں؟ ہم آپ سے سننا پسند کریں گے۔')}
              </p>
              <div className="space-y-4">
                <a href="tel:+923001234567" className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  <Phone className="w-5 h-5 text-purple-500" /> +92 300 1234567
                </a>
                <a href="mailto:hello@zaria.app" className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  <Mail className="w-5 h-5 text-purple-500" /> hello@zaria.app
                </a>
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                  <MapPinIcon className="w-5 h-5 text-purple-500" /> Jand, Punjab
                </div>
              </div>
            </div>
            <form className="space-y-4" onSubmit={handleContactSubmit}>
              <input
                type="text"
                placeholder={t('Name', 'نام')}
                value={contactForm.name}
                onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                required
                className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent outline-none"
              />
              <input
                type="email"
                placeholder={t('Email', 'ای میل')}
                value={contactForm.email}
                onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                required
                className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent outline-none"
              />
              <textarea
                rows={4}
                placeholder={t('Message', 'پیغام')}
                value={contactForm.message}
                onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                required
                className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent outline-none resize-none"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-all text-sm"
              >
                <Send className="w-4 h-4" />
                {contactSent ? t('Sent! ✓', 'بھیج دیا! ✓') : t('Send Message', 'پیغام بھیجیں')}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">Z</span>
                </div>
                <span className="text-white font-bold">Zaria</span>
              </div>
              <p className="text-sm">{t('Your medium to everything.', 'ہر چیز کا ذریعہ۔')}</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3 text-sm">{t('Company', 'کمپنی')}</h4>
              <a href="#how-it-works" className="block text-sm hover:text-white transition-colors">{t('About', 'ہمارے بارے میں')}</a>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3 text-sm">{t('Support', 'سپورٹ')}</h4>
              <a href="#faq" className="block text-sm hover:text-white transition-colors">FAQ</a>
              <a href="mailto:hello@zaria.app" className="block text-sm hover:text-white transition-colors mt-1">{t('Contact', 'رابطہ')}</a>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3 text-sm">{t('Services', 'خدمات')}</h4>
              <div className="space-y-2 text-sm">
                <p>{t('Plumbing', 'پلمبنگ')}</p>
                <p>{t('Electrician', 'الیکٹریشن')}</p>
                <p>{t('Grocery', 'گروسری')}</p>
                <p>{t('Computer Repair', 'کمپیوٹر مرمت')}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-sm">
            <p>© 2026 Zaria. {t('Made in Pakistan', 'پاکستان میں بنایا گیا')}.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}