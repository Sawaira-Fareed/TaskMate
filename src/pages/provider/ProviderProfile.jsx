import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Mail, Phone, Star, LogOut } from 'lucide-react'
import { getCurrentUser, signOut } from '@/lib/auth'

export default function ProviderProfile() {
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [user, setUser] = useState(null)

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  useEffect(() => { getCurrentUser().then(setUser) }, [])

  const handleSignOut = async () => { await signOut(); navigate('/login') }

  return (
    <div className="min-h-screen bg-gray-50" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <header className="bg-white border-b border-gray-200 px-4 h-16 flex items-center gap-3 sticky top-0 z-30">
        <Link to="/provider-dashboard" className="text-gray-500"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-lg font-semibold text-gray-900">{t('Profile', 'پروفائل')}</h1>
      </header>
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3"><User className="w-10 h-10 text-purple-600" /></div>
          <h2 className="text-lg font-semibold text-gray-900">{user?.user_metadata?.full_name || 'Provider'}</h2>
          <div className="flex items-center justify-center gap-1 mt-1"><Star className="w-4 h-4 text-amber-400 fill-amber-400" /><span className="text-sm text-gray-500">--</span></div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-gray-400" /><span className="text-sm">{user?.email}</span></div>
          <div className="flex items-center gap-3"><Phone className="w-5 h-5 text-gray-400" /><span className="text-sm">{user?.phone || 'N/A'}</span></div>
        </div>
        <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl font-medium text-sm hover:bg-red-100"><LogOut className="w-4 h-4" /> {t('Sign Out', 'سائن آؤٹ')}</button>
      </div>
    </div>
  )
}