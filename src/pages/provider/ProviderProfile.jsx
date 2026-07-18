import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Mail, Phone, Star, LogOut, Camera, Upload, Check, X, Wrench, Shield, Briefcase, MapPin, Crown } from 'lucide-react'
import { getCurrentUser, signOut } from '@/lib/auth'
import { supabase } from '@/lib/supabaseClient'
import ThemeToggle from '@/components/ThemeToggle'

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
  const [showProPlan, setShowProPlan] = useState(false)
  const [showSignout, setShowSignout] = useState(false)

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  useEffect(() => {
    async function load() {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      const { data: userData } = await supabase.from('users').select('*').eq('id', currentUser.id).single()
      setProfile(userData)
      const { data: providerData } = await supabase.from('providers').select('*, avg_rating, total_jobs, acceptance_rate, plan').eq('user_id', currentUser.id).single()
      setProvider(providerData)
      setEditForm({ phone: userData?.phone || '', experience: providerData?.experience || '', bio: providerData?.bio || '' })
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
      const previewUrl = URL.createObjectURL(file)
      setAvatarPreview(previewUrl)
      const ext = file.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage.from('profile-pics').upload(path, file, { upsert: true })
      if (uploadError) { alert('Upload failed: ' + uploadError.message); setUploading(false); return }
      const { data: urlData } = supabase.storage.from('profile-pics').getPublicUrl(path)
      const avatarUrl = urlData.publicUrl
      await supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', user.id)
      setProfile(prev => ({ ...prev, avatar_url: avatarUrl + '?t=' + Date.now() }))
      setAvatarPreview(null)
    } catch (err) { alert('Upload failed: ' + err.message); setAvatarPreview(null) }
    finally { setUploading(false) }
  }

  function triggerCamera() {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'image/*'; input.capture = 'environment'
    input.onchange = (e) => handleAvatarUpload(e.target.files?.[0])
    input.click()
  }

  async function handleRemoveAvatar() {
    if (!confirm(t('Remove profile picture?', 'پروفائل تصویر ہٹائیں؟'))) return
    await supabase.from('users').update({ avatar_url: null }).eq('id', user.id)
    setProfile(prev => ({ ...prev, avatar_url: null }))
  }

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
    } catch (err) { alert('Upload failed: ' + err.message) }
    finally { setUploading(false) }
  }

  function triggerFileUpload(type, useCamera = true) {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'image/*'
    if (useCamera) input.capture = 'environment'
    input.onchange = (e) => { const file = e.target.files?.[0]; if (file) handleCNICUpload(type, file) }
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
      if (uploadError) { alert('Upload failed: ' + uploadError.message); setUploading(false); return }
      const { data: urlData } = supabase.storage.from('certificates').getPublicUrl(path)
      const url = urlData.publicUrl
      await supabase.from('providers').update({ certificate_url: url }).eq('user_id', user.id)
      setProvider(prev => ({ ...prev, certificate_url: url + '?t=' + Date.now() }))
    } catch (err) { alert('Upload failed: ' + err.message) }
    finally { setUploading(false) }
  }

  function triggerCertUpload() {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = '.pdf,.jpg,.jpeg,.png'
    input.onchange = (e) => handleCertificateUpload(e.target.files?.[0])
    input.click()
  }

  async function handleRemoveCert() {
    if (!confirm(t('Remove certificate?', 'سرٹیفکیٹ ہٹائیں؟'))) return
    await supabase.from('providers').update({ certificate_url: null }).eq('user_id', user.id)
    setProvider(prev => ({ ...prev, certificate_url: null }))
  }

  async function handleSaveProfile() {
    setSaving(true)
    try {
      await supabase.from('users').update({ phone: editForm.phone }).eq('id', user.id)
      await supabase.from('providers').update({ experience: editForm.experience, bio: editForm.bio }).eq('user_id', user.id)
      setProfile(prev => ({ ...prev, phone: editForm.phone }))
      setProvider(prev => ({ ...prev, experience: editForm.experience, bio: editForm.bio }))
      setEditing(false)
    } catch (err) { alert('Failed to update: ' + err.message) }
    finally { setSaving(false) }
  }

  const serviceNames = { plumber: 'Plumber 🔧', electrician: 'Electrician ⚡', grocery: 'Grocery 🛒', computer_repair: 'Computer Repair 💻' }
  const tierColors = { gold: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', silver: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300', bronze: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' }

  if (loading) return <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 page-enter" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-gray-400"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Profile', 'پروفائل')}</h1>
        </div>
        <div className="flex items-center gap-2">
         <div className="flex items-center gap-2">
  <div className="flex items-center gap-0.5 bg-purple-50 dark:bg-purple-900/30 p-1 rounded-lg">
    <button onClick={() => { setLang('en'); localStorage.setItem('zaria-language', 'en') }} className={`px-2 py-1 text-xs font-medium rounded transition-all ${lang === 'en' ? 'bg-purple-600 text-white' : 'text-purple-600 dark:text-purple-400'}`}>EN</button>
    <button onClick={() => { setLang('ur'); localStorage.setItem('zaria-language', 'ur') }} className={`px-2 py-1 text-xs font-medium rounded transition-all ${lang === 'ur' ? 'bg-purple-600 text-white' : 'text-purple-600 dark:text-purple-400'}`}>اردو</button>
  </div>
  <ThemeToggle />
</div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center">
          <div className="relative inline-block mb-2">
            {avatarPreview ? <img src={avatarPreview} alt="Preview" className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-purple-400" /> : profile?.avatar_url ? <img src={profile.avatar_url} alt="Profile" className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-purple-200 dark:border-purple-700" onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.querySelector('.fb').style.display = 'flex' }} /> : null}
            <div className={`w-24 h-24 bg-purple-100 dark:bg-purple-900/30 rounded-full items-center justify-center mx-auto border-4 border-purple-200 dark:border-purple-700 ${profile?.avatar_url && !avatarPreview ? 'hidden fb' : !avatarPreview ? 'flex' : 'hidden'}`}><User className="w-12 h-12 text-purple-600 dark:text-purple-400" /></div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <button onClick={triggerCamera} disabled={uploading} className="w-9 h-9 bg-purple-600 text-white rounded-full flex items-center justify-center hover:bg-purple-700 transition-all shadow-md"><Camera className="w-4 h-4" /></button>
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-9 h-9 bg-gray-500 text-white rounded-full flex items-center justify-center hover:bg-gray-600 transition-all shadow-md"><Upload className="w-4 h-4" /></button>
            {profile?.avatar_url && <button onClick={handleRemoveAvatar} className="w-9 h-9 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-md"><X className="w-4 h-4" /></button>}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatarUpload(e.target.files?.[0])} />
          </div>
          {uploading && <p className="text-xs text-purple-600 mt-2">Uploading...</p>}
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-3">{profile?.full_name || 'Provider'}</h2>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-400 fill-amber-400" /><span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{provider?.avg_rating || '--'}</span></div>
            <span className="text-gray-300">•</span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${tierColors[provider?.tier]}`}>{provider?.tier || 'bronze'}</span>
            {provider?.plan === 'pro' && <><span className="text-gray-300">•</span><span className="text-xs px-2.5 py-1 rounded-full font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">PRO</span></>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border"><p className="text-2xl font-bold text-purple-600">{provider?.total_jobs || 0}</p><p className="text-xs text-gray-500">{t('Jobs', 'کام')}</p></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border"><p className="text-2xl font-bold text-emerald-600">{provider?.acceptance_rate || 0}%</p><p className="text-xs text-gray-500">{t('Accept', 'قبولیت')}</p></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border"><p className="text-2xl font-bold text-amber-600">{provider?.avg_rating || '--'}</p><p className="text-xs text-gray-500">{t('Rating', 'ریٹنگ')}</p></div>
        </div>

        {provider?.plan !== 'pro' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between">
              <div><h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Crown className="w-5 h-5 text-yellow-500" />{t('Upgrade to PRO', 'پرو میں اپ گریڈ کریں')}</h3><p className="text-xs text-gray-500 mt-1">{t('Get unlimited bookings, priority matching & more', 'لامحدود بکنگ، ترجیحی میچنگ اور بہت کچھ حاصل کریں')}</p></div>
              <button onClick={() => setShowProPlan(!showProPlan)} className={`relative w-12 h-7 rounded-full transition-all duration-300 ${showProPlan ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'}`}><span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-all duration-300 ${showProPlan ? 'translate-x-5' : ''}`} /></button>
            </div>
            {showProPlan && (
              <div className="mt-4 p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30 rounded-xl border border-purple-200 dark:border-purple-700">
                <div className="text-center mb-3"><span className="text-3xl font-bold text-purple-600">PKR 1,000</span><span className="text-sm text-gray-500">/month</span></div>
                <ul className="space-y-2 mb-4 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> {t('Unlimited bookings', 'لامحدود بکنگ')}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> {t('Priority matching', 'ترجیحی میچنگ')}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> {t('Verified PRO badge', 'تصدیق شدہ پرو بیج')}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> {t('Extended response time', 'توسیعی جوابی وقت')}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> {t('Earnings dashboard', 'آمدنی کا ڈیش بورڈ')}</li>
                </ul>
                <button className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-all hover:shadow-lg active:scale-95">{t('Upgrade Now', 'ابھی اپ گریڈ کریں')}</button>
              </div>
            )}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('Information', 'معلومات')}</h3>
            {!editing ? <button onClick={() => setEditing(true)} className="text-sm text-purple-600 font-medium">{t('Edit', 'ترمیم')}</button> : <div className="flex gap-2"><button onClick={() => setEditing(false)} className="p-1 text-gray-400"><X className="w-5 h-5" /></button><button onClick={handleSaveProfile} disabled={saving} className="p-1 text-purple-600">{saving ? <span className="animate-spin inline-block">⏳</span> : <Check className="w-5 h-5" />}</button></div>}
          </div>
          {!editing ? (
            <>
              <InfoRow icon={Mail} label="Email" value={profile?.email} />
              <InfoRow icon={Phone} label={t('Phone', 'فون')} value={profile?.phone} />
              <InfoRow icon={Briefcase} label={t('Services', 'خدمات')} value={provider?.service_types?.map(s => serviceNames[s] || s).join(', ')} />
              <InfoRow icon={MapPin} label={t('City', 'شہر')} value={profile?.city || 'Jand'} />
              {profile?.cnic_number && <InfoRow icon={Shield} label="CNIC" value={profile.cnic_number} />}
              {provider?.experience && <InfoRow icon={Star} label={t('Experience', 'تجربہ')} value={`${provider.experience} ${t('years', 'سال')}`} />}
              {provider?.bio && <div><p className="text-xs text-gray-400 mb-1">{t('About', 'تعارف')}</p><p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-xl p-3">{provider.bio}</p></div>}
              {profile?.cnic_front_url && <div><p className="text-xs text-gray-400 mb-1">{t('CNIC Front', 'شناختی کارڈ سامنے')}</p><img src={profile.cnic_front_url} alt="CNIC Front" className="w-full max-w-xs rounded-lg border" /></div>}
              {profile?.cnic_back_url && <div><p className="text-xs text-gray-400 mb-1">{t('CNIC Back', 'شناختی کارڈ پیچھے')}</p><img src={profile.cnic_back_url} alt="CNIC Back" className="w-full max-w-xs rounded-lg border" /></div>}
              {provider?.certificate_url && <div><p className="text-xs text-gray-400 mb-1">{t('Certificate', 'سرٹیفکیٹ')}</p><a href={provider.certificate_url} target="_blank" className="text-sm text-purple-600 underline flex items-center gap-1"><Shield className="w-4 h-4" /> {t('View', 'دیکھیں')}</a></div>}
            </>
          ) : (
            <div className="space-y-3">
              <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Phone', 'فون')}</label><input type="tel" value={editForm.phone} onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" /></div>
              <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Experience', 'تجربہ')}</label><input type="text" value={editForm.experience} onChange={(e) => setEditForm(prev => ({ ...prev, experience: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" /></div>
              <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Bio', 'تعارف')}</label><textarea value={editForm.bio} onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm resize-none" /></div>
            </div>
          )}
        </div>

        <div className="flex justify-center">
  <button onClick={() => setShowSignout(true)} className="inline-flex items-center gap-2 px-6 py-2.5 bg-purple-100 text-purple-700 rounded-xl text-sm font-medium hover:bg-red-500 hover:text-white transition-all duration-200">
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

function InfoRow({ icon: Icon, label, value }) {
  if (!value || value === 'N/A') return null
  return (
    <div className="flex items-center gap-3 py-1">
      <Icon className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
      <div><p className="text-xs text-gray-400 dark:text-gray-500">{label}</p><p className="text-sm text-gray-900 dark:text-white">{value}</p></div>
    </div>
  )
}