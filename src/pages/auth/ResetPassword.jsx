import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle, ArrowRight } from 'lucide-react'

export default function ResetPassword() {
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [done, setDone] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const t = {
    en: {
      title: 'Reset Password',
      subtitle: 'Enter your new password',
      password: 'New Password',
      confirm: 'Confirm Password',
      mismatch: 'Passwords do not match',
      update: 'Update Password',
      updating: 'Updating...',
      doneTitle: 'Password Updated',
      doneMessage: 'Your password has been changed successfully.',
      signIn: 'Sign In',
      rules: 'Min 8 characters, one uppercase, one number, one special character',
    },
    ur: {
      title: 'پاس ورڈ ری سیٹ',
      subtitle: 'اپنا نیا پاس ورڈ درج کریں',
      password: 'نیا پاس ورڈ',
      confirm: 'پاس ورڈ کی تصدیق',
      mismatch: 'پاس ورڈز مماثل نہیں ہیں',
      update: 'پاس ورڈ اپ ڈیٹ کریں',
      updating: 'اپ ڈیٹ ہو رہا ہے...',
      doneTitle: 'پاس ورڈ اپ ڈیٹ ہو گیا',
      doneMessage: 'آپ کا پاس ورڈ کامیابی سے تبدیل ہو گیا ہے۔',
      signIn: 'سائن ان کریں',
      rules: 'کم از کم 8 حروف، ایک بڑا حرف، ایک نمبر، ایک خاص علامت',
    },
  }

  const text = t[lang]
  const valid = password.length >= 8 && password === confirmPassword

  const toggleLanguage = (l) => {
    setLang(l)
    localStorage.setItem('zaria-language', l)
  }

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (valid) setDone(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-white" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 bg-gradient-to-br from-white via-purple-50/30 to-white" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="absolute rounded-full" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, width: `${Math.random() * 3 + 1}px`, height: `${Math.random() * 3 + 1}px`, background: `rgba(139, 92, 246, ${Math.random() * 0.08 + 0.02})`, animation: `float-${i % 3} ${Math.random() * 8 + 8}s linear infinite`, animationDelay: `${Math.random() * 4}s` }} />
        ))}
      </div>

      <div className="relative w-full max-w-[400px]" onMouseMove={handleMouseMove} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        <div className="absolute -inset-1 rounded-2xl transition-all duration-500" style={{ background: `radial-gradient(circle ${isHovered ? '350px' : '0px'} at ${mousePosition.x}px ${mousePosition.y}px, rgba(139, 92, 246, 0.3), rgba(139, 92, 246, 0.08) 60%, transparent 100%)`, opacity: isHovered ? 1 : 0, transform: isHovered ? 'scale(1.02)' : 'scale(1)', filter: 'blur(25px)', zIndex: -1, transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />

        <div className="relative bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-8 border border-purple-100/20 transition-all duration-300 text-center" style={{ transform: isHovered ? 'translateY(-3px)' : 'translateY(0)', boxShadow: isHovered ? '0 20px 60px rgba(139, 92, 246, 0.12), 0 8px 30px rgba(0,0,0,0.06)' : '0 8px 30px rgba(0,0,0,0.06)' }}>
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-purple-50/50 rounded-xl p-1">
            <button onClick={() => toggleLanguage('en')} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${lang === 'en' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25' : 'text-purple-600 hover:bg-purple-100'}`}>EN</button>
            <button onClick={() => toggleLanguage('ur')} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${lang === 'ur' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25' : 'text-purple-600 hover:bg-purple-100'}`}>اردو</button>
          </div>

          {!done ? (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-50 mb-6">
                <Lock className="w-8 h-8 text-purple-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{text.title}</h1>
              <p className="text-sm text-gray-500 mb-6">{text.subtitle}</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="text-left">
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">{text.password}</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="w-full px-4 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-transparent text-sm placeholder-gray-400" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{text.rules}</p>
                </div>
                <div className="text-left">
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">{text.confirm}</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm placeholder-gray-400 ${confirmPassword && password !== confirmPassword ? 'border-red-300 focus:ring-red-500/50' : 'border-gray-200 focus:ring-purple-500/50 focus:border-transparent'}`} />
                  {confirmPassword && password !== confirmPassword && <p className="text-xs text-red-500 mt-1">{text.mismatch}</p>}
                </div>
                <div className="flex justify-center pt-1">
                  <button type="submit" disabled={!valid} className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-medium transition-all duration-300 border-2 border-purple-200 bg-white text-purple-600 hover:bg-purple-600 hover:text-white hover:border-purple-600 shadow-sm hover:shadow-lg hover:shadow-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed">
                    <CheckCircle className="w-4 h-4" /> {text.update}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 mb-6">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{text.doneTitle}</h1>
              <p className="text-sm text-gray-500 mb-6">{text.doneMessage}</p>
              <div className="flex justify-center">
                <Link to="/login" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-medium transition-all duration-300 border-2 border-purple-200 bg-white text-purple-600 hover:bg-purple-600 hover:text-white hover:border-purple-600 shadow-sm hover:shadow-lg hover:shadow-purple-500/20">
                  {text.signIn} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          )}
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