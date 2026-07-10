import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, CheckCircle, ArrowRight } from 'lucide-react'

export default function EmailVerified() {
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [isHovered, setIsHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const t = {
    en: {
      title: 'Email Verified',
      subtitle: 'Your email has been confirmed',
      message: 'Your email address has been successfully verified. You can now sign in to your account.',
      signIn: 'Sign In',
      checkInbox: 'Please check your inbox and click the verification link.',
      resend: 'Resend Email',
      resent: 'Email Sent!',
    },
    ur: {
      title: 'ای میل تصدیق شدہ',
      subtitle: 'آپ کی ای میل کی تصدیق ہو گئی ہے',
      message: 'آپ کے ای میل ایڈریس کی کامیابی سے تصدیق ہو گئی ہے۔ اب آپ اپنے اکاؤنٹ میں سائن ان کر سکتے ہیں۔',
      signIn: 'سائن ان کریں',
      checkInbox: 'براہ کرم اپنا ان باکس چیک کریں اور تصدیقی لنک پر کلک کریں۔',
      resend: 'دوبارہ ای میل بھیجیں',
      resent: 'ای میل بھیج دی گئی!',
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
          className="relative bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-8 border border-purple-100/20 transition-all duration-300 text-center"
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

          {/* Success Icon */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">{text.title}</h1>
          <p className="text-sm text-gray-500 mb-1">{text.subtitle}</p>
          <p className="text-sm text-gray-400 mb-6">{text.message}</p>

          {/* Email icon row */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-50 mb-6">
            <Mail className="w-8 h-8 text-purple-500" />
          </div>

          {/* Sign In Button */}
          <div className="flex justify-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-medium transition-all duration-300 border-2 border-purple-200 bg-white text-purple-600 hover:bg-purple-600 hover:text-white hover:border-purple-600 shadow-sm hover:shadow-lg hover:shadow-purple-500/20"
            >
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