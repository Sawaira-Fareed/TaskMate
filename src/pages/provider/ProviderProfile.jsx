import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Mail, Phone, Star, LogOut, Camera, Upload, Check, X, Wrench, Shield, Briefcase, MapPin, FileText, Trash2, Award } from 'lucide-react'
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
  const [avatarPreview, setAvatarPreview] = useState(null)

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  useEffect(() => {
    async function load() {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      const { data: userData } = await supabase.from('users').select('*').eq('id', currentUser.id).single()
      setProfile(userData)
      const { data: providerData } = await supabase.from('providers').select('*, avg_rating, total_jobs, acceptance_rate').eq('user_id', currentUser.id).single()
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

  // ─── AVATAR ──────────────────────────────
  async function handleAvatarUpload(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Please select an image'); return }
    if (file.size > 3 * 1024 * 1024) { alert('Image must be less than 3MB'); return }
    setUploading(true)
    try {
      const previewUrl = URL.createObjectURL(file)
      setAvatarPreview(previewUrl)
      const ext = file.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`
const { error: uploadError } = await supabase.storage.from('profile-pics').upload(path, file, { upsert: true })
if (uploadError) {
  console.error('Upload error:', uploadError)
  alert('Upload failed: ' + uploadError.message)
  setUploading(false)
  return
}
const { data: urlData } = supabase.storage.from('profile-pics').getPublicUrl(path)
const avatarUrl = urlData.publicUrl
const { error: updateError } = await supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', user.id)
if (updateError) console.error('DB update error:', updateError)
      setProfile(prev => ({ ...prev, avatar_url: avatarUrl + '?t=' + Date.now() }))
      setAvatarPreview(null)
    } catch (err) {
      alert('Upload failed: ' + err.message)
      setAvatarPreview(null)
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

  async function handleRemoveAvatar() {
    if (!confirm(t('Remove profile picture?', 'پروفائل تصویر ہٹائیں؟'))) return
    await supabase.from('users').update({ avatar_url: null }).eq('id', user.id)
    setProfile(prev => ({ ...prev, avatar_url: null }))
  }

  // ─── CNIC ────────────────────────────────
  async function handleCNICUpload(type, file) {
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Please select an image'); return }
    if (file.size > 5 * 1024 * 1024) { alert('Image must be less than 5MB'); return }
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/cnic-${type}.${ext}`
      await supabase.storage.from('cnic-images').upload(path, file, { upsert: true })
      const { data: urlData } = supabase.storage.from('cnic-images').getPublicUrl(path)
      const url = urlData.publicUrl
      const field = type === 'cnicFront' ? 'cnic_front_url' : 'cnic_back_url'
      await supabase.from('users').update({ [field]: url }).eq('id', user.id)
      setProfile(prev => ({ ...prev, [field]: url + '?t=' + Date.now() }))
    } catch (err) {
      alert('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  function triggerFileUpload(type, useCamera = true) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    if (useCamera) input.capture = 'environment'
    input.onchange = (e) => {
      const file = e.target.files?.[0]
      if (file) handleCNICUpload(type, file)
    }
    input.click()
  }

  async function handleRemoveCNIC(field) {
    if (!confirm(t('Remove this image?', 'یہ تصویر ہٹائیں؟'))) return
    await supabase.from('users').update({ [field]: null }).eq('id', user.id)
    setProfile(prev => ({ ...prev, [field]: null }))
  }
async function handleCertificateUpload(file) {
  if (!file) return
  if (file.size > 10 * 1024 * 1024) { alert('File must be less than 10MB'); return }
  setUploading(true)
  try {
    const ext = file.name.split('.').pop()
    const path = `${user.id}/certificate.${ext}`
    const { error: uploadError } = await supabase.storage.from('certificates').upload(path, file, { upsert: true })
    if (uploadError) {
      alert('Upload failed: ' + uploadError.message)
      setUploading(false)
      return
    }
    const { data: urlData } = supabase.storage.from('certificates').getPublicUrl(path)
    const url = urlData.publicUrl
    const { error: updateError } = await supabase.from('providers').update({ certificate_url: url }).eq('user_id', user.id)
    if (updateError) {
      alert('Save failed: ' + updateError.message)
    } else {
      setProvider(prev => ({ ...prev, certificate_url: url + '?t=' + Date.now() }))
    }
  } catch (err) {
    alert('Upload failed: ' + err.message)
  } finally {
    setUploading(false)
  }
}

  function triggerCertUpload() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.jpg,.jpeg,.png'
    input.onchange = (e) => handleCertificateUpload(e.target.files?.[0])
    input.click()
  }

  async function handleRemoveCert() {
    if (!confirm(t('Remove certificate?', 'سرٹیفکیٹ ہٹائیں؟'))) return
    await supabase.from('providers').update({ certificate_url: null }).eq('user_id', user.id)
    setProvider(prev => ({ ...prev, certificate_url: null }))
  }

  // ─── SAVE PROFILE ────────────────────────
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
    plumber: 'Plumber 🔧', electrician: 'Electrician ⚡', grocery: 'Grocery 🛒', computer_repair: 'Computer Repair 💻',
  }

  const tierColors = {
    gold: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    silver: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    bronze: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-gray-400"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Profile', 'پروفائل')}</h1>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Avatar Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <div className="relative inline-block">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Preview" className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-purple-400" />
            ) : profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-purple-200 dark:border-purple-700" onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.querySelector('.fb').style.display = 'flex' }} />
            ) : null}
            <div className={`w-24 h-24 bg-purple-100 dark:bg-purple-900/30 rounded-full items-center justify-center mx-auto border-4 border-purple-200 dark:border-purple-700 ${profile?.avatar_url && !avatarPreview ? 'hidden fb' : !avatarPreview ? 'flex' : 'hidden'}`}>
              <User className="w-12 h-12 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 flex gap-0.5">
              <button onClick={triggerCamera} disabled={uploading} className="w-9 h-9 bg-purple-600 text-white rounded-full flex items-center justify-center hover:bg-purple-700 shadow-lg"><Camera className="w-4 h-4" /></button>
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-9 h-9 bg-gray-600 text-white rounded-full flex items-center justify-center hover:bg-gray-700 shadow-lg"><Upload className="w-4 h-4" /></button>
            </div>
            {profile?.avatar_url && (
              <button onClick={handleRemoveAvatar} className="absolute -bottom-1 -left-1 w-9 h-9 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg"><X className="w-4 h-4" /></button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatarUpload(e.target.files?.[0])} />
          </div>
          {uploading && <p className="text-xs text-purple-600 mt-2">Uploading...</p>}
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-3">{profile?.full_name || 'Provider'}</h2>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-400 fill-amber-400" /><span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{provider?.avg_rating || '--'}</span></div>
            <span className="text-gray-300">•</span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${tierColors[provider?.tier]}`}>{provider?.tier || 'bronze'}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-100 dark:border-gray-700"><p className="text-2xl font-bold text-purple-600">{provider?.total_jobs || 0}</p><p className="text-xs text-gray-500 dark:text-gray-400">{t('Jobs', 'کام')}</p></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-100 dark:border-gray-700"><p className="text-2xl font-bold text-emerald-600">{provider?.acceptance_rate || 0}%</p><p className="text-xs text-gray-500 dark:text-gray-400">{t('Accept', 'قبولیت')}</p></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-100 dark:border-gray-700"><p className="text-2xl font-bold text-amber-600">{provider?.avg_rating || '--'}</p><p className="text-xs text-gray-500 dark:text-gray-400">{t('Rating', 'ریٹنگ')}</p></div>
        </div>

        {/* Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('Information', 'معلومات')}</h3>
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
              <InfoRow icon={Mail} label="Email" value={profile?.email} />
              <InfoRow icon={Phone} label={t('Phone', 'فون')} value={profile?.phone} />
              <InfoRow icon={Briefcase} label={t('Services', 'خدمات')} value={provider?.service_types?.map(s => serviceNames[s] || s).join(', ')} />
              <InfoRow icon={MapPin} label={t('City', 'شہر')} value={profile?.city || 'Jand'} />
              {profile?.cnic_number && <InfoRow icon={Shield} label="CNIC" value={profile.cnic_number} />}
              {provider?.experience && <InfoRow icon={Star} label={t('Experience', 'تجربہ')} value={`${provider.experience} ${t('years', 'سال')}`} />}
              {provider?.bio && (
                <div><p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{t('About', 'تعارف')}</p><p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-xl p-3">{provider.bio}</p></div>
              )}
              {profile?.cnic_front_url && (
                <div><p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{t('CNIC Front', 'شناختی کارڈ سامنے')}</p><img src={profile.cnic_front_url} alt="CNIC Front" className="w-full max-w-xs rounded-lg border" /></div>
              )}
              {profile?.cnic_back_url && (
                <div><p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{t('CNIC Back', 'شناختی کارڈ پیچھے')}</p><img src={profile.cnic_back_url} alt="CNIC Back" className="w-full max-w-xs rounded-lg border" /></div>
              )}
              {provider?.certificate_url && (
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{t('Certificate', 'سرٹیفکیٹ')}</p>
                  <a href={provider.certificate_url} target="_blank" className="text-sm text-purple-600 dark:text-purple-400 underline flex items-center gap-1"><Award className="w-4 h-4" /> {t('View Certificate', 'سرٹیفکیٹ دیکھیں')}</a>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Phone', 'فون')}</label><input type="tel" value={editForm.phone} onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" /></div>
              <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Experience (years)', 'تجربہ (سال)')}</label><input type="text" value={editForm.experience} onChange={(e) => setEditForm(prev => ({ ...prev, experience: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" /></div>
              <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Bio', 'تعارف')}</label><textarea value={editForm.bio} onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm resize-none" /></div>

              {/* CNIC Front */}
              <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('CNIC Front', 'شناختی کارڈ سامنے')}</label>
                {profile?.cnic_front_url ? (
                  <div className="relative"><img src={profile.cnic_front_url} alt="CNIC Front" className="w-full rounded-lg border" />
                    <div className="absolute top-2 right-2 flex gap-1"><button onClick={() => triggerFileUpload('cnicFront', true)} className="bg-purple-600 text-white p-1.5 rounded-full"><Upload className="w-3.5 h-3.5" /></button><button onClick={() => handleRemoveCNIC('cnic_front_url')} className="bg-red-500 text-white p-1.5 rounded-full"><Trash2 className="w-3.5 h-3.5" /></button></div>
                  </div>
                ) : (
                  <button onClick={() => triggerFileUpload('cnicFront', true)} className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-500 hover:border-purple-500"><Camera className="w-4 h-4" /> {t('Upload', 'اپ لوڈ')}</button>
                )}
              </div>

              {/* CNIC Back */}
              <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('CNIC Back', 'شناختی کارڈ پیچھے')}</label>
                {profile?.cnic_back_url ? (
                  <div className="relative"><img src={profile.cnic_back_url} alt="CNIC Back" className="w-full rounded-lg border" />
                    <div className="absolute top-2 right-2 flex gap-1"><button onClick={() => triggerFileUpload('cnicBack', true)} className="bg-purple-600 text-white p-1.5 rounded-full"><Upload className="w-3.5 h-3.5" /></button><button onClick={() => handleRemoveCNIC('cnic_back_url')} className="bg-red-500 text-white p-1.5 rounded-full"><Trash2 className="w-3.5 h-3.5" /></button></div>
                  </div>
                ) : (
                  <button onClick={() => triggerFileUpload('cnicBack', true)} className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-500 hover:border-purple-500"><Camera className="w-4 h-4" /> {t('Upload', 'اپ لوڈ')}</button>
                )}
              </div>

              {/* Certificate */}
              <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Certificate', 'سرٹیفکیٹ')}</label>
                {provider?.certificate_url ? (
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <a href={provider.certificate_url} target="_blank" className="text-sm text-purple-600 dark:text-purple-400 underline flex items-center gap-1"><Award className="w-4 h-4" /> {t('View', 'دیکھیں')}</a>
                    <button onClick={handleRemoveCert} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <button onClick={triggerCertUpload} className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-500 hover:border-purple-500"><Upload className="w-4 h-4" /> {t('Upload Certificate', 'سرٹیفکیٹ اپ لوڈ کریں')}</button>
                )}
              </div>
            </div>
          )}
        </div>

        <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800">
          <LogOut className="w-4 h-4" /> {t('Sign Out', 'سائن آؤٹ')}
        </button>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value || value === 'N/A') return null
  return (
    <div className="flex items-center gap-3 py-1">
      <Icon className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
      <div><p className="text-xs text-gray-400 dark:text-gray-500">{label}</p><p className="text-sm text-gray-900 dark:text-white">{value}</p></div>
    </div>
  )
}