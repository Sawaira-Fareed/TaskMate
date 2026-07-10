import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { signIn } from '../../lib/auth'

export default function Login() {
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isHovered, setIsHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const t = {
    en: {
      welcomeBack: 'Welcome Back',
      subtitle: 'Sign in to continue',
      email: 'Email Address',
      emailPlaceholder: 'you@example.com',
      password: 'Password',
      forgotPassword: 'Forgot Password?',
      signIn: 'Sign In',
      signingIn: 'Signing In...',
      noAccount: "Don't have an account?",
      createAccount: 'Create Account',
      wrongPassword: 'Wrong email or password.',
      verifyEmail: 'Please verify your email first.',
    },
    ur: {
      welcomeBack: 'خوش آمدید',
      subtitle: 'جاری رکھنے کے لیے سائن ان کریں',
      email: 'ای میل پتہ',
      emailPlaceholder: 'آپ@مثال.کوم',
      password: 'پاس ورڈ',
      forgotPassword: 'پاس ورڈ بھول گئے؟',
      signIn: 'سائن ان کریں',
      signingIn: 'سائن ان ہو رہا ہے...',
      noAccount: 'اکاؤنٹ نہیں ہے؟',
      createAccount: 'اکاؤنٹ بنائیں',
      wrongPassword: 'غلط ای میل یا پاس ورڈ۔',
      verifyEmail: 'براہ کرم پہلے اپنی ای میل کی تصدیق کریں۔',
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/customer-home')
    } catch (err) {
      if (err.message.includes('Invalid login credentials')) setError(text.wrongPassword)
      else if (err.message.includes('Email not confirmed')) setError(text.verifyEmail)
      else setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-white" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      {/* Background with subtle lavender gradient */}
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

      {/* Login Card with Purple Glow */}
      <div className="relative w-full max-w-[400px]" onMouseMove={handleMouseMove} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        {/* Purple Glow Behind Card */}
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

        {/* Main Card */}
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
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-purple-50 mb-4">
              <LogIn className="w-7 h-7 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{text.welcomeBack}</h1>
            <p className="text-sm text-gray-500 mt-1.5">{text.subtitle}</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-600 text-xs rounded-xl px-4 py-2.5 mb-4 border border-red-200 text-center">{error}</div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">{text.email}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={text.emailPlaceholder} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200 text-sm placeholder-gray-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">{text.password}</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="w-full px-4 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200 text-sm placeholder-gray-400" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="text-right">
              <Link to="/forgot-password" className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors">{text.forgotPassword}</Link>
            </div>

            {/* Button — minimal width, centered */}
            <div className="flex justify-center pt-1">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] border-2 border-purple-200 bg-white text-purple-600 hover:bg-purple-600 hover:text-white hover:border-purple-600 shadow-sm hover:shadow-lg hover:shadow-purple-500/20"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                {loading ? text.signingIn : text.signIn}
              </button>
            </div>

            <p className="text-center text-sm text-gray-600 pt-2">
              {text.noAccount}{' '}
              <Link to="/register" className="text-purple-600 hover:text-purple-700 font-medium transition-colors">{text.createAccount}</Link>
            </p>
          </form>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes float-0 { 0%,100% { transform:translateY(0)translateX(0) } 25% { transform:translateY(-20px)translateX(10px) } 50% { transform:translateY(0)translateX(-10px) } 75% { transform:translateY(-10px)translateX(15px) } }
        @keyframes float-1 { 0%,100% { transform:translateY(0)translateX(0) } 33% { transform:translateY(-15px)translateX(-15px) } 66% { transform:translateY(10px)translateX(10px) } }
        @keyframes float-2 { 0%,100% { transform:translateY(0)translateX(0) } 50% { transform:translateY(-25px)translateX(-5px) } }
      `}</style>
    </div>
  )
}