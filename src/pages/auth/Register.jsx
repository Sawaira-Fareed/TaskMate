import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, User, Briefcase, Camera, FileText, UserPlus } from 'lucide-react'
import { signUp } from '@/lib/auth'

const STEPS = ['Role', 'Info', 'Details', 'Review']

export default function Register() {
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isHovered, setIsHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const [role, setRole] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [city, setCity] = useState('Jand')
  const [address, setAddress] = useState('')
  const [serviceTypes, setServiceTypes] = useState([])
  const [yearsExperience, setYearsExperience] = useState('')
  const [cnic, setCnic] = useState('')

  const t = {
    en: {
      createAccount: 'Create Account',
      step: 'Step',
      of: 'of',
      chooseType: 'Choose your account type',
      customer: 'Customer',
      customerDesc: 'Request services',
      provider: 'Service Provider',
      providerDesc: 'Offer your services',
      fullName: 'Full Name',
      namePlaceholder: 'Ahmed Khan',
      email: 'Email',
      emailPlaceholder: 'you@example.com',
      phone: 'Phone',
      phonePlaceholder: '03XX-XXXXXXX',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      mismatch: 'Passwords do not match',
      city: 'City',
      address: 'Address',
      addressPlaceholder: 'House #, Street, Area',
      serviceTypes: 'Service Types',
      experience: 'Years of Experience',
      cnic: 'CNIC Number',
      cnicPlaceholder: 'XXXXX-XXXXXXX-X',
      cnicFront: 'CNIC Front',
      cnicBack: 'CNIC Back',
      review: 'Review your information',
      roleLabel: 'Role',
      nameLabel: 'Name',
      emailLabel: 'Email',
      phoneLabel: 'Phone',
      servicesLabel: 'Services',
      selected: 'selected',
      experienceLabel: 'Experience',
      years: 'years',
      back: 'Back',
      next: 'Next',
      submit: 'Submit',
      creating: 'Creating...',
      hasAccount: 'Already have an account?',
      signIn: 'Sign In',
      plumber: 'Plumber',
      electrician: 'Electrician',
      grocery: 'Grocery',
      computerRepair: 'Computer Repair',
    },
    ur: {
      createAccount: 'اکاؤنٹ بنائیں',
      step: 'مرحلہ',
      of: 'کا',
      chooseType: 'اپنے اکاؤنٹ کی قسم منتخب کریں',
      customer: 'کسٹمر',
      customerDesc: 'خدمات کی درخواست کریں',
      provider: 'سروس پرووائیڈر',
      providerDesc: 'اپنی خدمات پیش کریں',
      fullName: 'پورا نام',
      namePlaceholder: 'احمد خان',
      email: 'ای میل',
      emailPlaceholder: 'آپ@مثال.کوم',
      phone: 'فون',
      phonePlaceholder: '03XX-XXXXXXX',
      password: 'پاس ورڈ',
      confirmPassword: 'پاس ورڈ کی تصدیق',
      mismatch: 'پاس ورڈز مماثل نہیں ہیں',
      city: 'شہر',
      address: 'پتہ',
      addressPlaceholder: 'گھر نمبر، گلی، علاقہ',
      serviceTypes: 'خدمات کی اقسام',
      experience: 'تجربہ (سال)',
      cnic: 'شناختی کارڈ نمبر',
      cnicPlaceholder: 'XXXXX-XXXXXXX-X',
      cnicFront: 'کارڈ سامنے',
      cnicBack: 'کارڈ پیچھے',
      review: 'اپنی معلومات کا جائزہ لیں',
      roleLabel: 'کردار',
      nameLabel: 'نام',
      emailLabel: 'ای میل',
      phoneLabel: 'فون',
      servicesLabel: 'خدمات',
      selected: 'منتخب',
      experienceLabel: 'تجربہ',
      years: 'سال',
      back: 'واپس',
      next: 'اگلا',
      submit: 'جمع کرائیں',
      creating: 'بنا رہا ہے...',
      hasAccount: 'پہلے سے اکاؤنٹ ہے؟',
      signIn: 'سائن ان کریں',
      plumber: 'پلمبر',
      electrician: 'الیکٹریشن',
      grocery: 'گروسری',
      computerRepair: 'کمپیوٹر مرمت',
    },
  }

  const text = t[lang]

  const toggleLanguage = (l) => {
    setLang(l)
    localStorage.setItem('zaria-language', l)
  }

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const toggleServiceType = (type) => {
    setServiceTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  const canProceed = () => {
    if (step === 1) return role !== ''
    if (step === 2) return fullName && email && phone && password && confirmPassword && password === confirmPassword
    if (step === 3 && role === 'provider') return serviceTypes.length > 0
    return true
  }

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      await signUp(email, password, fullName, role)
      navigate('/waiting-approval')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const services = [
    { id: 'plumber', en: 'Plumber', ur: 'پلمبر', icon: '🔧' },
    { id: 'electrician', en: 'Electrician', ur: 'الیکٹریشن', icon: '⚡' },
    { id: 'grocery', en: 'Grocery', ur: 'گروسری', icon: '🛒' },
    { id: 'computer_repair', en: 'Computer Repair', ur: 'کمپیوٹر مرمت', icon: '💻' },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-white" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 bg-gradient-to-br from-white via-purple-50/30 to-white" />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              background: `rgba(139, 92, 246, ${Math.random() * 0.08 + 0.02})`,
              animation: `float-${i % 3} ${Math.random() * 8 + 8}s linear infinite`,
              animationDelay: `${Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-[420px]" onMouseMove={handleMouseMove} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        {/* Glow */}
        <div
          className="absolute -inset-1 rounded-2xl transition-all duration-500"
          style={{
            background: `radial-gradient(circle ${isHovered ? '350px' : '0px'} at ${mousePosition.x}px ${mousePosition.y}px, rgba(139, 92, 246, 0.3), rgba(139, 92, 246, 0.08) 60%, transparent 100%)`,
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? 'scale(1.02)' : 'scale(1)',
            filter: 'blur(25px)',
            zIndex: -1,
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />

        {/* Card */}
        <div
          className="relative bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-8 border border-purple-100/20 transition-all duration-300"
          style={{
            transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
            boxShadow: isHovered ? '0 20px 60px rgba(139, 92, 246, 0.12), 0 8px 30px rgba(0,0,0,0.06)' : '0 8px 30px rgba(0,0,0,0.06)',
          }}
        >
          {/* Language Toggle */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-purple-50/50 rounded-xl p-1">
            <button onClick={() => toggleLanguage('en')} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${lang === 'en' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25' : 'text-purple-600 hover:bg-purple-100'}`}>EN</button>
            <button onClick={() => toggleLanguage('ur')} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${lang === 'ur' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25' : 'text-purple-600 hover:bg-purple-100'}`}>اردو</button>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-purple-50 mb-4">
              <UserPlus className="w-7 h-7 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{text.createAccount}</h1>
            <p className="text-sm text-gray-500 mt-1.5">
              {step === 1 ? text.chooseType : `${text.step} ${step} ${text.of} 4`}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-1 mb-6">
            {STEPS.map((_, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${i + 1 <= step ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {i + 1 < step ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && <div className={`w-6 h-0.5 rounded ${i + 1 < step ? 'bg-purple-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-600 text-xs rounded-xl px-4 py-2.5 mb-4 border border-red-200 text-center">{error}</div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-3">
              <button onClick={() => setRole('customer')} className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${role === 'customer' ? 'border-purple-600 bg-purple-50' : 'border-gray-200 bg-gray-50 hover:border-purple-300'}`}>
                <div className="flex items-center gap-3">
                  <User className={`w-5 h-5 ${role === 'customer' ? 'text-purple-600' : 'text-gray-400'}`} />
                  <div><p className="text-sm font-semibold text-gray-900">{text.customer}</p><p className="text-xs text-gray-500">{text.customerDesc}</p></div>
                </div>
              </button>
              <button onClick={() => setRole('provider')} className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${role === 'provider' ? 'border-purple-600 bg-purple-50' : 'border-gray-200 bg-gray-50 hover:border-purple-300'}`}>
                <div className="flex items-center gap-3">
                  <Briefcase className={`w-5 h-5 ${role === 'provider' ? 'text-purple-600' : 'text-gray-400'}`} />
                  <div><p className="text-sm font-semibold text-gray-900">{text.provider}</p><p className="text-xs text-gray-500">{text.providerDesc}</p></div>
                </div>
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">{text.fullName}</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={text.namePlaceholder} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-transparent text-sm placeholder-gray-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">{text.email}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={text.emailPlaceholder} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-transparent text-sm placeholder-gray-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">{text.phone}</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={text.phonePlaceholder} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-transparent text-sm placeholder-gray-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">{text.password}</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-transparent text-sm placeholder-gray-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">{text.confirmPassword}</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm placeholder-gray-400 transition-all ${confirmPassword && password !== confirmPassword ? 'border-red-300 focus:ring-red-500/50' : 'border-gray-200 focus:ring-purple-500/50 focus:border-transparent'}`} />
                {confirmPassword && password !== confirmPassword && <p className="text-xs text-red-500 mt-1">{text.mismatch}</p>}
              </div>
            </div>
          )}

          {/* STEP 3 — Customer */}
          {step === 3 && role === 'customer' && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">{text.city}</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-transparent text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">{text.address}</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={text.addressPlaceholder} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-transparent text-sm placeholder-gray-400" />
              </div>
            </div>
          )}

          {/* STEP 3 — Provider */}
          {step === 3 && role === 'provider' && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">{text.serviceTypes}</label>
                <div className="grid grid-cols-2 gap-2">
                  {services.map((svc) => (
                    <button key={svc.id} type="button" onClick={() => toggleServiceType(svc.id)} className={`p-3 rounded-xl border text-center transition-all duration-200 ${serviceTypes.includes(svc.id) ? 'border-purple-600 bg-purple-50' : 'border-gray-200 bg-gray-50 hover:border-purple-300'}`}>
                      <span className="text-lg block">{svc.icon}</span>
                      <span className="text-xs font-medium text-gray-700 mt-1 block">{lang === 'ur' ? svc.ur : svc.en}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">{text.experience}</label>
                <input type="number" value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} placeholder="5" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-transparent text-sm placeholder-gray-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">{text.cnic}</label>
                <input type="text" value={cnic} onChange={(e) => setCnic(e.target.value)} placeholder={text.cnicPlaceholder} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-transparent text-sm placeholder-gray-400" />
              </div>
              <div className="flex gap-2">
                <button type="button" className="flex-1 flex items-center justify-center gap-1.5 border border-dashed border-gray-300 rounded-xl px-3 py-4 text-xs text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-colors bg-gray-50">
                  <Camera className="w-4 h-4" /> {text.cnicFront}
                </button>
                <button type="button" className="flex-1 flex items-center justify-center gap-1.5 border border-dashed border-gray-300 rounded-xl px-3 py-4 text-xs text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-colors bg-gray-50">
                  <FileText className="w-4 h-4" /> {text.cnicBack}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 text-center">{text.review}</p>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 text-xs">
                <div className="flex justify-between"><span className="text-gray-500">{text.roleLabel}</span><span className="font-medium text-gray-700">{role === 'customer' ? text.customer : text.provider}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">{text.nameLabel}</span><span className="font-medium text-gray-700">{fullName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">{text.emailLabel}</span><span className="font-medium text-gray-700">{email}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">{text.phoneLabel}</span><span className="font-medium text-gray-700">{phone}</span></div>
                {role === 'provider' && (
                  <>
                    <div className="flex justify-between"><span className="text-gray-500">{text.servicesLabel}</span><span className="font-medium text-gray-700">{serviceTypes.length} {text.selected}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">{text.experienceLabel}</span><span className="font-medium text-gray-700">{yearsExperience} {text.years}</span></div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons — minimal width, centered */}
          <div className="flex justify-center gap-3 mt-6">
            {step > 1 && (
              <button type="button" onClick={() => setStep(step - 1)} className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl font-medium transition-all duration-200 border-2 border-gray-200 bg-white text-gray-600 hover:border-purple-200 hover:text-purple-600 text-sm">
                <ArrowLeft className="w-4 h-4" /> {text.back}
              </button>
            )}
            {step < 4 ? (
              <button type="button" onClick={() => setStep(step + 1)} disabled={!canProceed()} className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl font-medium transition-all duration-300 border-2 border-purple-200 bg-white text-purple-600 hover:bg-purple-600 hover:text-white hover:border-purple-600 shadow-sm hover:shadow-lg hover:shadow-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed text-sm">
                {text.next} <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading} className="inline-flex items-center gap-1.5 px-8 py-2.5 rounded-xl font-medium transition-all duration-300 border-2 border-purple-200 bg-white text-purple-600 hover:bg-purple-600 hover:text-white hover:border-purple-600 shadow-sm hover:shadow-lg hover:shadow-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed text-sm">
                {loading ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                {loading ? text.creating : text.submit}
              </button>
            )}
          </div>

          {/* Sign In Link */}
          <p className="text-center text-sm text-gray-600 mt-4">
            {text.hasAccount}{' '}
            <Link to="/login" className="text-purple-600 hover:text-purple-700 font-medium transition-colors">{text.signIn}</Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float-0 { 0%,100% { transform:translateY(0)translateX(0) } 25% { transform:translateY(-20px)translateX(10px) } 50% { transform:translateY(0)translateX(-10px) } 75% { transform:translateY(-10px)translateX(15px) } }
        @keyframes float-1 { 0%,100% { transform:translateY(0)translateX(0) } 33% { transform:translateY(-15px)translateX(-15px) } 66% { transform:translateY(10px)translateX(10px) } }
        @keyframes float-2 { 0%,100% { transform:translateY(0)translateX(0) } 50% { transform:translateY(-25px)translateX(-5px) } }
      `}</style>
    </div>
  )
}