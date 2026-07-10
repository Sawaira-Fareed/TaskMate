import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Shield, CheckCircle, LogOut } from 'lucide-react'
import { signOut } from '../../lib/auth'

export default function WaitingApproval() {
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [isHovered, setIsHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const t = {
    en: {
      title: 'Application Submitted',
      subtitle: 'Your account is under review',
      message: 'Your account has been sent for administrator review. You will be able to access the platform once approved.',
      timeline1: 'Application Submitted',
      timeline2: 'Admin Review',
      timeline3: 'Approval',
      timeline4: 'Access Dashboard',
      contactSupport: 'Contact Support',
      signOut: 'Sign Out',
      autoCheck: 'This page refreshes automatically. You can also check back later.',
    },
    ur: {
      title: 'درخواست جمع کرائی گئی',
      subtitle: 'آپ کا اکاؤنٹ زیر جائزہ ہے',
      message: 'آپ کا اکاؤنٹ ایڈمنسٹریٹر کے جائزے کے لیے بھیج دیا گیا ہے۔ منظور ہونے کے بعد آپ پلیٹ فارم تک رسائی حاصل کر سکیں گے۔',
      timeline1: 'درخواست جمع',
      timeline2: 'ایڈمن جائزہ',
      timeline3: 'منظوری',
      timeline4: 'ڈیش بورڈ تک رسائی',
      contactSupport: 'سپورٹ سے رابطہ',
      signOut: 'سائن آؤٹ',
      autoCheck: 'یہ صفحہ خود بخود تازہ ہوتا ہے۔ آپ بعد میں بھی چیک کر سکتے ہیں۔',
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

  const handleSignOut = async () => {
    await signOut()
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

      <div className="relative w-full max-w-[440px]" onMouseMove={handleMouseMove} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
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

          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-50 mb-6">
            <Shield className="w-10 h-10 text-purple-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">{text.title}</h1>
          <p className="text-sm text-gray-500 mb-6">{text.message}</p>

          {/* Status Timeline */}
          <div className="bg-gray-50 rounded-xl p-5 mb-6">
            <div className="space-y-3">
              {[
                { icon: CheckCircle, label: text.timeline1, done: true, active: false },
                { icon: Clock, label: text.timeline2, done: false, active: true },
                { icon: Shield, label: text.timeline3, done: false, active: false },
                { icon: CheckCircle, label: text.timeline4, done: false, active: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${item.done ? 'text-purple-600' : item.active ? 'text-amber-500 animate-pulse' : 'text-gray-300'}`} />
                  <span className={`text-sm ${item.done ? 'text-gray-900 font-medium' : item.active ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-400 mb-6">{text.autoCheck}</p>

          {/* Buttons */}
          <div className="flex justify-center gap-3">
            <Link
              to="/login"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 border-2 border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:text-red-600 text-sm"
            >
              <LogOut className="w-4 h-4" /> {text.signOut}
            </Link>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 border-2 border-purple-200 bg-white text-purple-600 hover:bg-purple-600 hover:text-white hover:border-purple-600 shadow-sm hover:shadow-lg hover:shadow-purple-500/20 text-sm"
            >
              {text.contactSupport}
            </button>
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