import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Mail, Phone, Star, LogOut, Camera, Upload, Check, X, Wrench } from 'lucide-react'
import { getCurrentUser, signOut } from '@/lib/auth'
import { supabase } from '@/lib/supabaseClient'

export default function ProviderProfile() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [provider, setProvider] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ phone: '', experience: '', bio: '' })
  const [saving, setSaving] = useState(false)

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  useEffect(() => {
    async function load() {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      const { data: userData } = await supabase.from('users').select('*').eq('id', currentUser.id).single()
      setProfile(userData)
      const { data: providerData } = await supabase.from('providers').select('*').eq('user_id', currentUser.id).single()
      setProvider(providerData)
      setEditForm({
        phone: userData?.phone || '',
        experience: providerData?.experience || '',
        bio: providerData?.bio || '',
      })
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
      await supabase.storage.from('profile_pics').upload(path, file, { upsert: true })
      const { data: urlData } = supabase.storage.from('profile_pics').getPublicUrl(path)
      const avatarUrl = urlData.publicUrl
      await supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', user.id)
      setProfile(prev => ({ ...prev, avatar_url: avatarUrl }))
    } catch (err) {
      alert('Failed to upload: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  function triggerCamera() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment'
    input.onchange = (e) => handleAvatarUpload(e.target.files?.[0])
    input.click()
  }

  async function handleSaveProfile() {
    setSaving(true)
    try {
      await supabase.from('users').update({ phone: editForm.phone }).eq('id', user.id)
      await supabase.from('providers').update({ experience: editForm.experience, bio: editForm.bio }).eq('user_id', user.id)
      setProfile(prev => ({ ...prev, phone: editForm.phone }))
      setProvider(prev => ({ ...prev, experience: editForm.experience, bio: editForm.bio }))
      setEditing(false)
    } catch (err) {
      alert('Failed to update: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const serviceNames = {
    plumber: 'Plumber',
    electrician: 'Electrician',
    grocery: 'Grocery',
    computer_repair: 'Computer Repair',
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Profile', 'پروفائل')}</h1>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Avatar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <div className="relative inline-block">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-purple-200 dark:border-purple-700" />
            ) : (
              <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto">
                <User className="w-10 h-10 text-purple-600 dark:text-purple-400" />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 flex gap-0">
              <button onClick={triggerCamera} disabled={uploading} className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center hover:bg-purple-700 shadow-lg">
                <Camera className="w-4 h-4" />
              </button>
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center hover:bg-gray-700 shadow-lg ml-1">
                <Upload className="w-4 h-4" />
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatarUpload(e.target.files?.[0])} />
          </div>
          {uploading && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Uploading...</p>}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mt-3">{profile?.full_name || 'Provider'}</h2>
          <div className="flex items-center justify-center gap-1 mt-1">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">{provider?.avg_rating || '--'}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">• {provider?.tier || 'bronze'}</span>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 dark:text-white">{t('Info', 'معلومات')}</h3>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="text-sm text-purple-600 dark:text-purple-400 font-medium">{t('Edit', 'ترمیم')}</button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="text-sm text-gray-500 dark:text-gray-400"><X className="w-4 h-4" /></button>
                <button onClick={handleSaveProfile} disabled={saving} className="text-sm text-purple-600 dark:text-purple-400 font-medium">{saving ? '...' : <Check className="w-4 h-4" />}</button>
              </div>
            )}
          </div>

          {!editing ? (
            <>
              <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-gray-400 dark:text-gray-500" /><span className="text-sm text-gray-900 dark:text-white">{profile?.email || 'N/A'}</span></div>
              <div className="flex items-center gap-3"><Phone className="w-5 h-5 text-gray-400 dark:text-gray-500" /><span className="text-sm text-gray-900 dark:text-white">{profile?.phone || 'N/A'}</span></div>
              <div className="flex items-center gap-3"><Wrench className="w-5 h-5 text-gray-400 dark:text-gray-500" /><span className="text-sm text-gray-900 dark:text-white">{provider?.service_types?.map(s => serviceNames[s] || s).join(', ') || 'N/A'}</span></div>
              <div className="flex items-center gap-3"><Star className="w-5 h-5 text-gray-400 dark:text-gray-500" /><span className="text-sm text-gray-900 dark:text-white">{provider?.experience ? `${provider.experience} years` : 'N/A'}</span></div>
              {provider?.bio && <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-xl p-3">{provider.bio}</p>}
            </>
          ) : (
            <div className="space-y-3">
              <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label><input type="tel" value={editForm.phone} onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" /></div>
              <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Experience (years)</label><input type="text" value={editForm.experience} onChange={(e) => setEditForm(prev => ({ ...prev, experience: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" /></div>
              <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label><textarea value={editForm.bio} onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" /></div>
            </div>
          )}
        </div>

      
      </div>
    </div>
  )
}