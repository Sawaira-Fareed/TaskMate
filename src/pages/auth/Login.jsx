import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, Mail, ArrowLeft, Check } from 'lucide-react'
import { signIn } from '@/lib/auth'
import { supabase } from '@/lib/supabaseClient'

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

  // Forgot password
  const [showForgot, setShowForgot] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')

  // Role picker
  const [showRolePicker, setShowRolePicker] = useState(false)
  const [userRoles, setUserRoles] = useState([])
  const [userData, setUserData] = useState(null)

  const t = {
    en: {
      welcomeBack: 'Welcome Back', subtitle: 'Sign in to continue',
      email: 'Email Address', emailPlaceholder: 'you@example.com',
      password: 'Password', forgotPassword: 'Forgot Password?',
      signIn: 'Sign In', signingIn: 'Signing In...',
      noAccount: "Don't have an account?", createAccount: 'Create Account',
      wrongPassword: 'Wrong email or password.', verifyEmail: 'Please verify your email first.',
      forgotTitle: 'Reset Password', forgotSubtitle: 'Enter your email to receive a reset link',
      sendLink: 'Send Reset Link', sending: 'Sending...',
      sent: 'Check your email for the reset link!', backToLogin: 'Back to Login',
      chooseRole: 'Choose How to Continue', customer: 'Customer', provider: 'Provider',
    },
    ur: {
      welcomeBack: 'خوش آمدید', subtitle: 'جاری رکھنے کے لیے سائن ان کریں',
      email: 'ای میل پتہ', emailPlaceholder: 'آپ@مثال.کوم',
      password: 'پاس ورڈ', forgotPassword: 'پاس ورڈ بھول گئے؟',
      signIn: 'سائن ان کریں', signingIn: 'سائن ان ہو رہا ہے...',
      noAccount: 'اکاؤنٹ نہیں ہے؟', createAccount: 'اکاؤنٹ بنائیں',
      wrongPassword: 'غلط ای میل یا پاس ورڈ۔', verifyEmail: 'براہ کرم پہلے اپنی ای میل کی تصدیق کریں۔',
      forgotTitle: 'پاس ورڈ ری سیٹ', forgotSubtitle: 'ری سیٹ لنک حاصل کرنے کے لیے ای میل درج کریں',
      sendLink: 'ری سیٹ لنک بھیجیں', sending: 'بھیج رہا ہے...',
      sent: 'ری سیٹ لنک کے لیے اپنی ای میل چیک کریں!', backToLogin: 'واپس لاگ ان پر',
      chooseRole: 'جاری رکھنے کا طریقہ منتخب کریں', customer: 'گاہک', provider: 'پرووائیڈر',
    },
  }

  const text = t[lang]
  const toggleLanguage = (l) => { setLang(l); localStorage.setItem('zaria-language', l) }
  const handleMouseMove = (e) => { const rect = e.currentTarget.getBoundingClientRect(); setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top }) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
        const roles = Array.isArray(profile?.role) ? profile.role : [profile?.role]

        if (roles.length > 1) {
          setUserRoles(roles)
          setShowRolePicker(true)
        } else {
          redirectByRole(roles[0], user.id)
        }
      }
    } catch (err) {
      if (err.message.includes('Invalid login credentials')) setError(text.wrongPassword)
      else if (err.message.includes('Email not confirmed')) setError(text.verifyEmail)
      else setError(err.message)
    } finally {
      setLoading(false)
    }
  }

 async function redirectByRole(role, userId) {
  // If userId is null (from role picker), get it from session
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser()
    userId = user?.id
  }

  if (role === 'admin') navigate('/admin/dashboard')
  else if (role === 'provider') {
    const { data: provider } = await supabase.from('providers').select('is_approved').eq('user_id', userId).single()
    if (provider?.is_approved) navigate('/provider/dashboard')
    else navigate('/provider/waiting-approval')
  } else {
    navigate('/customer/dashboard')
  }
}

  async function handleForgotPassword(e) {
    e.preventDefault()
    setResetError('')
    setResetLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setResetSent(true)
    } catch (err) {
      setResetError(err.message)
    } finally {
      setResetLoading(false)
    }
  }

  if (showRolePicker) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
        <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center border border-gray-100 dark:border-gray-700">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <LogIn className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{text.chooseRole}</h2>
          <div className="space-y-3">
            {userRoles.map(role => (
              <button key={role} onClick={() => redirectByRole(role, null)}
                className="w-full py-4 rounded-2xl text-base font-semibold flex items-center justify-center gap-3 transition-all active:scale-95
                  bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/20 hover:shadow-xl">
                <Check className="w-5 h-5" />
                {role === 'customer' ? text.customer : role === 'provider' ? text.provider : role}
              </button>
            ))}
          </div>
          <button onClick={() => { setShowRolePicker(false); supabase.auth.signOut() }}
            className="mt-4 text-sm text-gray-500 hover:text-gray-700">{text.backToLogin}</button>
        </div>
      </div>
    )
  }

  if (showForgot) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
        <div className="w-full max-w-[400px] bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
          <button onClick={() => { setShowForgot(false); setResetSent(false); setResetError('') }}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 flex items-center gap-1 text-sm">
            <ArrowLeft className="w-4 h-4" /> {text.backToLogin}
          </button>

          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-purple-50 dark:bg-purple-900/30 mb-4">
              <Mail className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{text.forgotTitle}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">{text.forgotSubtitle}</p>
          </div>

          {resetSent ? (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm rounded-xl p-4 text-center border border-emerald-200 dark:border-emerald-800">
              {text.sent}
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              {resetError && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-xl px-4 py-2.5 border border-red-200 dark:border-red-800 text-center">{resetError}</div>}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{text.email}</label>
                <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder={text.emailPlaceholder} required
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500/50 text-sm text-gray-900 dark:text-white" />
              </div>
              <button type="submit" disabled={resetLoading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                {resetLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Mail className="w-4 h-4" />}
                {resetLoading ? text.sending : text.sendLink}
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

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

        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] p-8 border border-purple-100/20 dark:border-gray-700" style={{ transform: isHovered ? 'translateY(-3px)' : 'translateY(0)' }}>
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-purple-50/50 dark:bg-gray-700/50 rounded-xl p-1">
            <button onClick={() => toggleLanguage('en')} className={`px-3 py-1.5 text-xs font-medium rounded-lg ${lang === 'en' ? 'bg-purple-600 text-white' : 'text-purple-600 dark:text-purple-400'}`}>EN</button>
            <button onClick={() => toggleLanguage('ur')} className={`px-3 py-1.5 text-xs font-medium rounded-lg ${lang === 'ur' ? 'bg-purple-600 text-white' : 'text-purple-600 dark:text-purple-400'}`}>اردو</button>
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-purple-50 dark:bg-purple-900/30 mb-4"><LogIn className="w-7 h-7 text-purple-600 dark:text-purple-400" /></div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{text.welcomeBack}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">{text.subtitle}</p>
          </div>

          {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-xl px-4 py-2.5 mb-4 border border-red-200 dark:border-red-800 text-center">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{text.email}</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={text.emailPlaceholder} required className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500/50 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" /></div>
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{text.password}</label>
              <div className="relative"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="w-full px-4 pr-12 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500/50 text-sm text-gray-900 dark:text-white" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
            </div>
            <div className="text-right">
              <button type="button" onClick={() => setShowForgot(true)} className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium">{text.forgotPassword}</button>
            </div>
            <div className="flex justify-center pt-1">
              <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-medium border-2 border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white hover:border-purple-600 shadow-sm transition-all">
                {loading ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <LogIn className="w-4 h-4" />}
                {loading ? text.signingIn : text.signIn}
              </button>
            </div>
            <div className="relative my-4">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-gray-200 dark:border-gray-600"></div>
  </div>
  <div className="relative flex justify-center text-xs">
    <span className="bg-gray-50 dark:bg-gray-950 px-2 text-gray-500">or</span>
  </div>
</div>

<button
  type="button"
  onClick={async () => {
    await supabase.auth.signInWithOAuth({ 
      provider: 'google',
      options: { redirectTo: window.location.origin + '/customer/dashboard' }
    })
  }}
  className="w-full py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
>
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
  Continue with Google
</button>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 pt-2">{text.noAccount} <Link to="/register" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium">{text.createAccount}</Link></p>
          </form>
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