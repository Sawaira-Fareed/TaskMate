import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Mail, Phone, MapPin, LogOut, Camera, Upload, Check, X } from 'lucide-react'
import { getCurrentUser, signOut } from '@/lib/auth'
import { supabase } from '@/lib/supabaseClient'
import ThemeToggle from '@/components/ThemeToggle'
export default function CustomerProfile() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', city: '', address: '' })
  const [saving, setSaving] = useState(false)
  const [showSignout, setShowSignout] = useState(false)

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  useEffect(() => {
    async function load() {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      const { data } = await supabase.from('users').select('*').eq('id', currentUser.id).single()
      setProfile(data)
      setEditForm({ full_name: data?.full_name || '', phone: data?.phone || '', city: data?.city || '', address: data?.address || '' })
      setLoading(false)
    }
    load()
  }, [])

  const handleSignOut = async () => { await signOut(); navigate('/login') }

  async function handleAvatarUpload(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Please select an image'); return }
    if (file.size > 3 * 1024 * 1024) { alert('Image must be less than 3MB'); return }
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`
      await supabase.storage.from('profile-pics').upload(path, file, { upsert: true })
      const { data: urlData } = supabase.storage.from('profile-pics').getPublicUrl(path)
      const avatarUrl = urlData.publicUrl
      await supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', user.id)
      setProfile(prev => ({ ...prev, avatar_url: avatarUrl + '?t=' + Date.now() }))
    } catch (err) { alert('Failed to upload: ' + err.message) }
    finally { setUploading(false) }
  }

  async function handleRemoveAvatar() {
    if (!confirm(t('Remove profile picture?', 'پروفائل تصویر ہٹائیں؟'))) return
    await supabase.from('users').update({ avatar_url: null }).eq('id', user.id)
    setProfile(prev => ({ ...prev, avatar_url: null }))
  }

  function triggerCamera() {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'image/*'; input.capture = 'environment'
    input.onchange = (e) => handleAvatarUpload(e.target.files?.[0])
    input.click()
  }

  async function handleSaveProfile() {
    setSaving(true)
    try {
      const { error } = await supabase.from('users').update({
        full_name: editForm.full_name, phone: editForm.phone, city: editForm.city, address: editForm.address,
      }).eq('id', user.id)
      if (error) throw error
      setProfile(prev => ({ ...prev, ...editForm }))
      setEditing(false)
    } catch (err) { alert('Failed to update: ' + err.message) }
    finally { setSaving(false) }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 page-enter" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-gray-400"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Profile', 'پروفائل')}</h1>
        </div>
        <div className="flex items-center gap-2">
  <div className="flex items-center gap-0.5 bg-purple-50 dark:bg-purple-900/30 p-1 rounded-lg">
    <button onClick={() => { setLang('en'); localStorage.setItem('zaria-language', 'en') }} className={`px-2 py-1 text-xs font-medium rounded transition-all ${lang === 'en' ? 'bg-purple-600 text-white' : 'text-purple-600 dark:text-purple-400'}`}>EN</button>
    <button onClick={() => { setLang('ur'); localStorage.setItem('zaria-language', 'ur') }} className={`px-2 py-1 text-xs font-medium rounded transition-all ${lang === 'ur' ? 'bg-purple-600 text-white' : 'text-purple-600 dark:text-purple-400'}`}>اردو</button>
  </div>
  <ThemeToggle />
</div>
        
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Avatar Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <div className="relative inline-block mb-2">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-purple-200 dark:border-purple-700" />
            ) : (
              <div className="w-24 h-24 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto border-4 border-purple-200 dark:border-purple-700">
                <User className="w-12 h-12 text-purple-600 dark:text-purple-400" />
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-2">
            <button onClick={triggerCamera} disabled={uploading} className="w-9 h-9 bg-purple-600 text-white rounded-full flex items-center justify-center hover:bg-purple-700 transition-all shadow-md"><Camera className="w-4 h-4" /></button>
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-9 h-9 bg-gray-500 text-white rounded-full flex items-center justify-center hover:bg-gray-600 transition-all shadow-md"><Upload className="w-4 h-4" /></button>
            {profile?.avatar_url && (
              <button onClick={handleRemoveAvatar} className="w-9 h-9 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-md"><X className="w-4 h-4" /></button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatarUpload(e.target.files?.[0])} />
          </div>
          {uploading && <p className="text-xs text-purple-600 mt-2">Uploading...</p>}
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-3">{profile?.full_name || 'User'}</h2>
        </div>

        {/* Details */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('Personal Info', 'ذاتی معلومات')}</h3>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="text-sm text-purple-600 dark:text-purple-400 font-medium">{t('Edit', 'ترمیم')}</button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="p-1 text-gray-400"><X className="w-5 h-5" /></button>
                <button onClick={handleSaveProfile} disabled={saving} className="p-1 text-purple-600">{saving ? <span className="animate-spin inline-block">⏳</span> : <Check className="w-5 h-5" />}</button>
              </div>
            )}
          </div>

          {!editing ? (
            <>
              <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-gray-400" /><span className="text-sm text-gray-900 dark:text-white">{profile?.email || 'N/A'}</span></div>
              <div className="flex items-center gap-3"><Phone className="w-5 h-5 text-gray-400" /><span className="text-sm text-gray-900 dark:text-white">{profile?.phone || 'N/A'}</span></div>
              <div className="flex items-center gap-3"><MapPin className="w-5 h-5 text-gray-400" /><span className="text-sm text-gray-900 dark:text-white">{profile?.city || 'Jand'}, {profile?.address || ''}</span></div>
            </>
          ) : (
            <div className="space-y-3">
              <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Full Name', 'پورا نام')}</label><input type="text" value={editForm.full_name} onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" /></div>
              <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Phone', 'فون')}</label><input type="tel" value={editForm.phone} onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" /></div>
              <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('City', 'شہر')}</label><input type="text" value={editForm.city} onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" /></div>
              <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Address', 'پتہ')}</label><input type="text" value={editForm.address} onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" /></div>
            </div>
          )}
        </div>

        {/* Sign Out */}
        <div className="flex justify-center">
          <button onClick={() => setShowSignout(true)} className="inline-flex items-center gap-2 px-6 py-2.5 bg-purple-100 text-purple-700 rounded-xl text-sm font-medium md:hover:bg-red-500 md:hover:text-white active:bg-red-500 active:text-white transition-all duration-200">
            <LogOut className="w-4 h-4" /> {t('Sign Out', 'سائن آؤٹ')}
          </button>
        </div>
      </div>

      {showSignout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4"><LogOut className="w-7 h-7 text-red-500" /></div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('Sign Out', 'سائن آؤٹ')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('Are you sure?', 'کیا آپ واقعی سائن آؤٹ کرنا چاہتے ہیں؟')}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowSignout(false)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium">{t('No', 'نہیں')}</button>
              <button onClick={handleSignOut} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium">{t('Yes', 'ہاں')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}