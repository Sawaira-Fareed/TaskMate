import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { getCurrentUser } from '@/lib/auth';
import { Camera, Upload, ArrowLeft, ArrowRight, Check, X, Award, Loader2, WifiOff, AlertTriangle } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

const STEPS = ['CNIC', 'Services', 'Certificate', 'Review'];

const SERVICES = [
  { id: 'plumber', name: 'Plumber', icon: '🔧' },
  { id: 'electrician', name: 'Electrician', icon: '⚡' },
  { id: 'grocery', name: 'Grocery', icon: '🛒' },
  { id: 'computer_repair', name: 'Computer Repair', icon: '💻' },
  { id: 'ride', name: 'Ride Provider', icon: '🛺' },
];

export default function BecomeProvider() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [uploading, setUploading] = useState(false);
  const { isOnline, isSlow } = useNetworkStatus();

  const [formData, setFormData] = useState({
    cnicNumber: '', cnicFrontFile: null, cnicBackFile: null,
    cnicFrontPreview: null, cnicBackPreview: null,
    certificateFile: null, certificatePreview: null,
    experience: '', bio: '',
  });

  function sanitize(str) { if (!str) return str; return str.replace(/[<>{}]/g, '').trim(); }

  function validateStep(step) {
    const newErrors = {};
    if (step === 0) {
      if (!formData.cnicNumber.trim()) newErrors.cnicNumber = 'CNIC number is required';
      else if (!/^\d{5}-\d{7}-\d{1}$/.test(formData.cnicNumber)) newErrors.cnicNumber = 'Valid CNIC format: 00000-0000000-0';
      if (!formData.cnicFrontFile) newErrors.cnicFront = 'CNIC front image is required';
      if (!formData.cnicBackFile) newErrors.cnicBack = 'CNIC back image is required';
    }
    if (step === 1) { if (selectedServices.length === 0) newErrors.services = 'Please select at least one service'; }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function toggleService(serviceId) { setSelectedServices(prev => prev.includes(serviceId) ? prev.filter(s => s !== serviceId) : [...prev, serviceId]); setErrors(prev => ({ ...prev, services: undefined })); }

  function handleFileSelect(type, event) {
    const file = event.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith('image/') && type !== 'certificate') { alert('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Image size must be less than 5MB'); return; }
    const preview = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, [`${type}File`]: file, [`${type}Preview`]: preview }));
    setErrors(prev => ({ ...prev, [type]: undefined }));
  }

  function triggerFileUpload(type, useCamera = true) {
    const input = document.createElement('input'); input.type = 'file';
    input.accept = type === 'certificate' ? '.pdf,.jpg,.jpeg,.png' : 'image/*';
    if (useCamera && type !== 'certificate') input.capture = 'environment';
    input.onchange = (e) => handleFileSelect(type, e); input.click();
  }

  function formatCNIC(value) { const digits = value.replace(/\D/g, ''); if (digits.length <= 5) return digits; if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`; return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`; }

  async function uploadFile(userId, file, bucket, fileName) {
    const ext = file.name.split('.').pop(); const path = `${userId}/${fileName}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) { console.error('Upload failed:', error); return null; }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path); return data.publicUrl;
  }

  async function handleSubmit() {
    if (!validateStep(3)) return;
    setLoading(true); setSubmitError(''); setUploading(true);
    try {
      const user = await getCurrentUser();
      const { data: existingCNIC } = await supabase.from('users').select('id').eq('cnic_number', formData.cnicNumber).limit(1);
      if (existingCNIC?.length > 0) throw new Error('An account with this CNIC already exists.');

      let cnicFrontUrl = null, cnicBackUrl = null;
      if (formData.cnicFrontFile) cnicFrontUrl = await uploadFile(user.id, formData.cnicFrontFile, 'cnic-images', 'cnic-front');
      if (formData.cnicBackFile) cnicBackUrl = await uploadFile(user.id, formData.cnicBackFile, 'cnic-images', 'cnic-back');
      let certificateUrl = null;
      if (formData.certificateFile) certificateUrl = await uploadFile(user.id, formData.certificateFile, 'certificates', 'certificate');

      const { data: currentUser } = await supabase.from('users').select('role').eq('id', user.id).single();
      const currentRoles = currentUser?.role || [];
      const newRoles = currentRoles.includes('provider') ? currentRoles : [...currentRoles, 'provider'];

      await supabase.from('users').update({ cnic_number: sanitize(formData.cnicNumber), cnic_front_url: cnicFrontUrl, cnic_back_url: cnicBackUrl, role: newRoles }).eq('id', user.id);

      const { error: providerError } = await supabase.from('providers').insert({ user_id: user.id, service_types: selectedServices, phone: '', is_approved: false, is_online: false, tier: 'bronze', experience: sanitize(formData.experience) || null, bio: sanitize(formData.bio) || null, certificate_url: certificateUrl || null, vehicle_type: selectedServices.includes('ride') ? vehicleType : null });
      if (providerError) throw providerError;

      setSuccessMsg('Submitted for Approval!');
      setTimeout(() => navigate('/provider/waiting-approval'), 1000);
      const { data: admins } = await supabase.from('users').select('id').contains('role', ['admin'])
if (admins?.length > 0) {
  await supabase.from('notifications').insert(admins.map(a => ({
    user_id: a.id, type: 'provider_approval',
    title: 'New Provider Registration',
    message: `${user.user_metadata?.full_name || 'Someone'} applied to become a provider`,
    action_url: '/admin/approvals'
  })))
}
    } catch (err) { setSubmitError(err.message); }
    finally { setLoading(false); setUploading(false); }
  }

  if (!isOnline) { return (<div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4"><div className="text-center"><WifiOff className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" /><h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Internet</h3><button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium">Retry</button></div></div>) }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {isSlow && (<div className="sticky top-0 z-50 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs text-center py-1.5">Slow connection</div>)}
      {successMsg && (<div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-lg text-sm font-medium animate-pulse"><Check className="w-4 h-4 inline mr-1" /> {successMsg}</div>)}
      {uploading && (<div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-purple-500 text-white px-6 py-3 rounded-2xl shadow-lg text-sm font-medium"><Loader2 className="w-4 h-4 inline mr-1 animate-spin" /> Uploading files...</div>)}

      <div className="bg-white dark:bg-gray-900 shadow-sm p-4 border-b border-gray-200 dark:border-gray-800"><div className="max-w-2xl mx-auto flex items-center justify-between"><h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">Become a Provider</h1><div className="flex items-center gap-2">{STEPS.map((step, i) => (<div key={i} className="flex items-center">{i > 0 && <div className={`w-4 h-0.5 ${i <= currentStep ? 'bg-blue-600 dark:bg-blue-400' : 'bg-gray-300 dark:bg-gray-600'}`} />}<div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${i < currentStep ? 'bg-blue-600 text-white' : i === currentStep ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>{i < currentStep ? <Check size={14} /> : i + 1}</div></div>))}</div></div></div>

      <div className="flex-1 max-w-2xl mx-auto w-full p-6">
        {submitError && (<div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-xl px-4 py-2.5 mb-4 border border-red-200 dark:border-red-800 flex items-center gap-2"><AlertTriangle className="w-4 h-4 flex-shrink-0" />{submitError}</div>)}

        {currentStep === 0 && (<div className="space-y-4"><h2 className="text-2xl font-bold text-gray-900 dark:text-white">CNIC Verification</h2><p className="text-gray-600 dark:text-gray-400">Required for identity verification</p><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CNIC Number *</label><input type="text" value={formData.cnicNumber} onChange={(e) => { const formatted = formatCNIC(e.target.value); setFormData(prev => ({ ...prev, cnicNumber: formatted })); setErrors(prev => ({ ...prev, cnicNumber: undefined })); }} maxLength={15} className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${errors.cnicNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-blue-500`} placeholder="00000-0000000-0" /><div className="text-red-500 text-sm mt-1 h-5">{errors.cnicNumber}</div></div><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CNIC Front *</label>{formData.cnicFrontPreview ? (<div className="relative"><img src={formData.cnicFrontPreview} alt="CNIC Front" className="w-full max-w-md rounded-lg" /><button type="button" onClick={() => setFormData(prev => ({ ...prev, cnicFrontFile: null, cnicFrontPreview: null }))} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"><X size={16} /></button></div>) : (<div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => triggerFileUpload('cnicFront', true)} className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500"><Camera size={32} className="text-gray-400 dark:text-gray-500" /><span className="text-sm text-gray-600 dark:text-gray-400">Take Photo</span></button><button type="button" onClick={() => triggerFileUpload('cnicFront', false)} className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500"><Upload size={32} className="text-gray-400 dark:text-gray-500" /><span className="text-sm text-gray-600 dark:text-gray-400">Upload</span></button></div>)}<div className="text-red-500 text-sm mt-1 h-5">{errors.cnicFront}</div></div><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CNIC Back *</label>{formData.cnicBackPreview ? (<div className="relative"><img src={formData.cnicBackPreview} alt="CNIC Back" className="w-full max-w-md rounded-lg" /><button type="button" onClick={() => setFormData(prev => ({ ...prev, cnicBackFile: null, cnicBackPreview: null }))} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"><X size={16} /></button></div>) : (<div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => triggerFileUpload('cnicBack', true)} className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500"><Camera size={32} className="text-gray-400 dark:text-gray-500" /><span className="text-sm text-gray-600 dark:text-gray-400">Take Photo</span></button><button type="button" onClick={() => triggerFileUpload('cnicBack', false)} className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500"><Upload size={32} className="text-gray-400 dark:text-gray-500" /><span className="text-sm text-gray-600 dark:text-gray-400">Upload</span></button></div>)}<div className="text-red-500 text-sm mt-1 h-5">{errors.cnicBack}</div></div></div>)}

        {currentStep === 1 && (<div className="space-y-4"><h2 className="text-2xl font-bold text-gray-900 dark:text-white">Select Your Services</h2><p className="text-gray-600 dark:text-gray-400">You can select multiple services</p><div className="grid grid-cols-2 gap-3">{SERVICES.map(service => (<button key={service.id} type="button" onClick={() => toggleService(service.id)} className={`p-4 rounded-xl border-2 text-center transition-all ${selectedServices.includes(service.id) ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-600' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}><div className="text-2xl mb-1">{service.icon}</div><div className="font-medium text-sm text-gray-900 dark:text-white">{service.name}</div></button>))}</div><div className="text-red-500 text-sm h-5">{errors.services}</div>{selectedServices.includes('ride') && (<div className="space-y-3 pt-2"><h3 className="font-semibold text-gray-900 dark:text-white">Select Vehicle Type</h3><div className="grid grid-cols-3 gap-2">{['bike', 'rickshaw', 'car'].map(v => (<button key={v} type="button" onClick={() => setVehicleType(v)} className={`p-3 rounded-xl border-2 text-center capitalize transition-all ${vehicleType === v ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-600' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>{v === 'bike' ? '🏍️' : v === 'rickshaw' ? '🛺' : '🚗'} {v}</button>))}</div></div>)}</div>)}

        {currentStep === 2 && (<div className="space-y-4"><h2 className="text-2xl font-bold text-gray-900 dark:text-white">Certification (Optional)</h2><p className="text-gray-600 dark:text-gray-400">Upload any trade certificate, license, or qualification document</p><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Certificate / License</label>{formData.certificatePreview ? (<div className="relative"><img src={formData.certificatePreview} alt="Certificate" className="w-full max-w-md rounded-lg" /><button type="button" onClick={() => setFormData(prev => ({ ...prev, certificateFile: null, certificatePreview: null }))} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"><X size={16} /></button></div>) : (<button type="button" onClick={() => triggerFileUpload('certificate', false)} className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 w-full"><Award size={32} className="text-gray-400 dark:text-gray-500" /><span className="text-sm text-gray-600 dark:text-gray-400">Upload Certificate (PDF/Image)</span></button>)}</div><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Years of Experience</label><div className="grid grid-cols-3 gap-2">{['< 1 year', '1 year', '2 years', '3 years', '4 years', '5+ years'].map(exp => (<button key={exp} type="button" onClick={() => setFormData(prev => ({ ...prev, experience: exp }))} className={`py-2.5 rounded-xl text-sm font-medium transition-all ${formData.experience === exp ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{exp}</button>))}</div></div><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Short Bio</label><textarea value={formData.bio} onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))} rows={3} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="Tell customers about yourself..." /></div></div>)}

        {currentStep === 3 && (<div className="space-y-4"><h2 className="text-2xl font-bold text-gray-900 dark:text-white">Review Your Information</h2><div className="bg-white dark:bg-gray-800 rounded-xl p-6 space-y-2 border border-gray-200 dark:border-gray-700"><ReviewRow label="CNIC" value={formData.cnicNumber} /><ReviewRow label="Services" value={selectedServices.map(s => SERVICES.find(x => x.id === s)?.name).join(', ')} />{selectedServices.includes('ride') && <ReviewRow label="Vehicle" value={vehicleType || 'Not selected'} />}{formData.cnicFrontPreview && <div><span className="text-sm text-gray-500">CNIC Front:</span><img src={formData.cnicFrontPreview} alt="Front" className="w-32 rounded mt-1" /></div>}{formData.cnicBackPreview && <div><span className="text-sm text-gray-500">CNIC Back:</span><img src={formData.cnicBackPreview} alt="Back" className="w-32 rounded mt-1" /></div>}{formData.certificatePreview && <div><span className="text-sm text-gray-500">Certificate:</span><img src={formData.certificatePreview} alt="Cert" className="w-32 rounded mt-1" /></div>}</div><button onClick={handleSubmit} disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}{loading ? 'Submitting...' : 'Submit for Approval'}</button></div>)}

        <div className="flex justify-between mt-8">
          {currentStep > 0 && (<button type="button" onClick={() => setCurrentStep(prev => prev - 1)} className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"><ArrowLeft size={20} /> Back</button>)}
          <div className="flex-1" />
          {currentStep < 3 && (<button type="button" onClick={() => { if (validateStep(currentStep)) setCurrentStep(prev => prev + 1) }} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Next <ArrowRight size={20} /></button>)}
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }) { return <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700"><span className="text-sm text-gray-500 dark:text-gray-400">{label}</span><span className="text-sm font-medium text-gray-900 dark:text-white">{value || '-'}</span></div>; }