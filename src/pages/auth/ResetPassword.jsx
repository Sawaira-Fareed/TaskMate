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
      title: 'Reset Password', subtitle: 'Enter your new password',
      password: 'New Password', confirm: 'Confirm Password',
      mismatch: 'Passwords do not match', update: 'Update Password',
      updating: 'Updating...', doneTitle: 'Password Updated',
      doneMessage: 'Your password has been changed successfully.',
      signIn: 'Sign In',
      rules: 'Min 8 characters, one uppercase, one number, one special character',
    },
    ur: {
      title: 'پاس ورڈ ری سیٹ', subtitle: 'اپنا نیا پاس ورڈ درج کریں',
      password: 'نیا پاس ورڈ', confirm: 'پاس ورڈ کی تصدیق',
      mismatch: 'پاس ورڈز مماثل نہیں ہیں', update: 'پاس ورڈ اپ ڈیٹ کریں',
      updating: 'اپ ڈیٹ ہو رہا ہے...', doneTitle: 'پاس ورڈ اپ ڈیٹ ہو گیا',
      doneMessage: 'آپ کا پاس ورڈ کامیابی سے تبدیل ہو گیا ہے۔',
      signIn: 'سائن ان کریں',
      rules: 'کم از کم 8 حروف، ایک بڑا حرف، ایک نمبر، ایک خاص علامت',
    },
  }

  const text = t[lang]
  const valid = password.length >= 8 && password === confirmPassword
  const toggleLanguage = (l) => { setLang(l); localStorage.setItem('zaria-language', l) }
  const handleMouseMove = (e) => { const rect = e.currentTarget.getBoundingClientRect(); setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top }) }
  const handleSubmit = (e) => { e.preventDefault(); if (valid) setDone(true) }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-white dark:bg-gray-950" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 bg-gradient-to-br from-white via-purple-50/30 to-white dark:from-gray-950 dark:via-purple-900/10 dark:to-gray-950" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="absolute rounded-full" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, width: `${Math.random() * 3 + 1}px`, height: `${Math.random() * 3 + 1}px`, background: `rgba(139, 92, 246, ${Math.random() * 0.08 + 0.02})`, animation: `float-${i % 3} ${Math.random() * 8 + 8}s linear infinite`, animationDelay: `${Math.random() * 4}s` }} />
        ))}
      </div>

      <div className="relative w-full max-w-[400px]" onMouseMove={handleMouseMove} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        <div className="absolute -inset-1 rounded-2xl transition-all duration-500" style={{ background: `radial-gradient(circle ${isHovered ? '350px' : '0px'} at ${mousePosition.x}px ${mousePosition.y}px, rgba(139, 92, 246, 0.3), rgba(139, 92, 246, 0.08) 60%, transparent 100%)`, opacity: isHovered ? 1 : 0, transform: isHovered ? 'scale(1.02)' : 'scale(1)', filter: 'blur(25px)', zIndex: -1 }} />

        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] p-8 border border-purple-100/20 dark:border-gray-700 text-center" style={{ transform: isHovered ? 'translateY(-3px)' : 'translateY(0)' }}>
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-purple-50/50 dark:bg-gray-700/50 rounded-xl p-1">
            <button onClick={() => toggleLanguage('en')} className={`px-3 py-1.5 text-xs font-medium rounded-lg ${lang === 'en' ? 'bg-purple-600 text-white' : 'text-purple-600 dark:text-purple-400'}`}>EN</button>
            <button onClick={() => toggleLanguage('ur')} className={`px-3 py-1.5 text-xs font-medium rounded-lg ${lang === 'ur' ? 'bg-purple-600 text-white' : 'text-purple-600 dark:text-purple-400'}`}>اردو</button>
          </div>

          {!done ? (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-50 dark:bg-purple-900/30 mb-6"><Lock className="w-8 h-8 text-purple-600 dark:text-purple-400" /></div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{text.title}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{text.subtitle}</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="text-left">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{text.password}</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="w-full px-4 pr-12 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{text.rules}</p>
                </div>
                <div className="text-left">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{text.confirm}</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${confirmPassword && password !== confirmPassword ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-600'}`} />
                  {confirmPassword && password !== confirmPassword && <p className="text-xs text-red-500 mt-1">{text.mismatch}</p>}
                </div>
                <div className="flex justify-center pt-1">
                  <button type="submit" disabled={!valid} className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-medium border-2 border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white hover:border-purple-600 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                    <CheckCircle className="w-4 h-4" /> {text.update}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-900/30 mb-6">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center"><CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" /></div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{text.doneTitle}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{text.doneMessage}</p>
              <div className="flex justify-center">
                <Link to="/login" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-medium border-2 border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white hover:border-purple-600 shadow-sm">
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