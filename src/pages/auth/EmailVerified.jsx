import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, CheckCircle, ArrowRight } from 'lucide-react'

export default function EmailVerified() {
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [isHovered, setIsHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const t = {
    en: {
      title: 'Email Verified', subtitle: 'Your email has been confirmed',
      message: 'Your email address has been successfully verified. You can now sign in to your account.',
      signIn: 'Sign In',
    },
    ur: {
      title: 'ای میل تصدیق شدہ', subtitle: 'آپ کی ای میل کی تصدیق ہو گئی ہے',
      message: 'آپ کے ای میل ایڈریس کی کامیابی سے تصدیق ہو گئی ہے۔ اب آپ اپنے اکاؤنٹ میں سائن ان کر سکتے ہیں۔',
      signIn: 'سائن ان کریں',
    },
  }

  const text = t[lang]
  const toggleLanguage = (l) => { setLang(l); localStorage.setItem('zaria-language', l) }
  const handleMouseMove = (e) => { const rect = e.currentTarget.getBoundingClientRect(); setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top }) }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-white dark:bg-gray-950" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 bg-gradient-to-br from-white via-purple-50/30 to-white dark:from-gray-950 dark:via-purple-900/10 dark:to-gray-950" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="absolute rounded-full" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, width: `${Math.random() * 3 + 1}px`, height: `${Math.random() * 3 + 1}px`, background: `rgba(139, 92, 246, ${Math.random() * 0.08 + 0.02})`, animation: `float-${i % 3} ${Math.random() * 8 + 8}s linear infinite`, animationDelay: `${Math.random() * 4}s` }} />
        ))}
      </div>

      <div className="relative w-full max-w-[420px]" onMouseMove={handleMouseMove} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        <div className="absolute -inset-1 rounded-2xl transition-all duration-500" style={{ background: `radial-gradient(circle ${isHovered ? '350px' : '0px'} at ${mousePosition.x}px ${mousePosition.y}px, rgba(139, 92, 246, 0.3), rgba(139, 92, 246, 0.08) 60%, transparent 100%)`, opacity: isHovered ? 1 : 0, transform: isHovered ? 'scale(1.02)' : 'scale(1)', filter: 'blur(25px)', zIndex: -1 }} />

        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] p-8 border border-purple-100/20 dark:border-gray-700 text-center" style={{ transform: isHovered ? 'translateY(-3px)' : 'translateY(0)' }}>
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-purple-50/50 dark:bg-gray-700/50 rounded-xl p-1">
            <button onClick={() => toggleLanguage('en')} className={`px-3 py-1.5 text-xs font-medium rounded-lg ${lang === 'en' ? 'bg-purple-600 text-white' : 'text-purple-600 dark:text-purple-400'}`}>EN</button>
            <button onClick={() => toggleLanguage('ur')} className={`px-3 py-1.5 text-xs font-medium rounded-lg ${lang === 'ur' ? 'bg-purple-600 text-white' : 'text-purple-600 dark:text-purple-400'}`}>اردو</button>
          </div>

          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{text.title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{text.subtitle}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">{text.message}</p>

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-50 dark:bg-purple-900/30 mb-6">
            <Mail className="w-8 h-8 text-purple-500 dark:text-purple-400" />
          </div>

          <div className="flex justify-center">
            <Link to="/login" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-medium border-2 border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white hover:border-purple-600 shadow-sm">
              {text.signIn} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
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