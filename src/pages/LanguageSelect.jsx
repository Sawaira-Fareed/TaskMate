import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe } from 'lucide-react'

export default function LanguageSelect() {
  const [selected, setSelected] = useState(null)
  const [isHovered, setIsHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const navigate = useNavigate()

  const handleSelect = (lang) => {
    setSelected(lang)
    localStorage.setItem('zaria-language', lang)
    setTimeout(() => navigate('/landing'), 400)
  }

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-white">
      <div className="absolute inset-0 bg-gradient-to-br from-white via-purple-50/30 to-white" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="absolute rounded-full" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, width: `${Math.random() * 3 + 1}px`, height: `${Math.random() * 3 + 1}px`, background: `rgba(139, 92, 246, ${Math.random() * 0.08 + 0.02})`, animation: `float-${i % 3} ${Math.random() * 8 + 8}s linear infinite`, animationDelay: `${Math.random() * 4}s` }} />
        ))}
      </div>

      <div className="relative w-full max-w-[380px]" onMouseMove={handleMouseMove} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        <div className="absolute -inset-1 rounded-2xl transition-all duration-500" style={{ background: `radial-gradient(circle ${isHovered ? '350px' : '0px'} at ${mousePosition.x}px ${mousePosition.y}px, rgba(139, 92, 246, 0.3), rgba(139, 92, 246, 0.08) 60%, transparent 100%)`, opacity: isHovered ? 1 : 0, transform: isHovered ? 'scale(1.02)' : 'scale(1)', filter: 'blur(25px)', zIndex: -1, transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />

        <div className="relative bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-8 border border-purple-100/20 transition-all duration-300 text-center" style={{ transform: isHovered ? 'translateY(-3px)' : 'translateY(0)', boxShadow: isHovered ? '0 20px 60px rgba(139, 92, 246, 0.12), 0 8px 30px rgba(0,0,0,0.06)' : '0 8px 30px rgba(0,0,0,0.06)' }}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-50 mb-6">
            <Globe className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Zaria</h1>
          <p className="text-sm text-gray-500 mb-6">Choose your language<br />اپنی زبان منتخب کریں</p>

          <div className="space-y-3">
            <button onClick={() => handleSelect('en')} className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${selected === 'en' ? 'border-purple-600 bg-purple-50' : 'border-gray-200 bg-gray-50 hover:border-purple-300'}`}>
              <div className="flex items-center gap-3">
                <span className="text-lg">🇬🇧</span>
                <div><p className="text-sm font-semibold text-gray-900">English</p><p className="text-xs text-gray-500">Continue in English</p></div>
              </div>
            </button>
            <button onClick={() => handleSelect('ur')} className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${selected === 'ur' ? 'border-purple-600 bg-purple-50' : 'border-gray-200 bg-gray-50 hover:border-purple-300'}`}>
              <div className="flex items-center gap-3">
                <span className="text-lg">🇵🇰</span>
                <div><p className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }}>اردو</p><p className="text-xs text-gray-500">اردو میں جاری رکھیں</p></div>
              </div>
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-6">You can change this anytime in settings</p>
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