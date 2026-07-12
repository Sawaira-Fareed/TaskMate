import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Camera, Upload, ArrowLeft, ArrowRight, Check, X, Eye, EyeOff, Award } from 'lucide-react';

const STEPS = ['Account', 'Personal', 'CNIC', 'Services', 'Certificate', 'Review'];

export default function Register() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '', role: 'customer',
    fullName: '', phone: '', city: '', address: '',
    cnicNumber: '', cnicFrontFile: null, cnicBackFile: null,
    cnicFrontPreview: null, cnicBackPreview: null,
    selectedService: '', certificateFile: null, certificatePreview: null,
    experience: '', bio: '',
  });

  function validateStep(step) {
    const newErrors = {};
    if (step === 0) {
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    }
    if (step === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.address.trim()) newErrors.address = 'Address is required';
    }
    if (step === 2) {
      if (!formData.cnicNumber.trim()) newErrors.cnicNumber = 'CNIC number is required';
      else if (!/^\d{5}-\d{7}-\d{1}$/.test(formData.cnicNumber)) newErrors.cnicNumber = 'Valid CNIC format: 00000-0000000-0';
      if (!formData.cnicFrontFile) newErrors.cnicFront = 'CNIC front image is required';
      if (!formData.cnicBackFile) newErrors.cnicBack = 'CNIC back image is required';
    }
    if (step === 3 && formData.role === 'provider') {
      if (!formData.selectedService) newErrors.selectedService = 'Please select one service';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function nextStep() {
    if (!validateStep(currentStep)) return;
    if (currentStep === 2 && formData.role === 'customer') setCurrentStep(5);
    else if (currentStep === 3 && formData.role === 'provider') setCurrentStep(4);
    else if (currentStep === 4 && formData.role === 'provider') setCurrentStep(5);
    else setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  }

  function prevStep() {
    if (currentStep === 5 && formData.role === 'customer') setCurrentStep(2);
    else if (currentStep === 4 && formData.role === 'provider') setCurrentStep(3);
    else setCurrentStep(prev => Math.max(prev - 1, 0));
  }

  function handleFileSelect(type, event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') && type !== 'certificate') { alert('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Image size must be less than 5MB'); return; }
    const preview = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, [`${type}File`]: file, [`${type}Preview`]: preview }));
    setErrors(prev => ({ ...prev, [type]: undefined }));
  }

  function triggerFileUpload(type, useCamera = true) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'certificate' ? '.pdf,.jpg,.jpeg,.png' : 'image/*';
    if (useCamera && type !== 'certificate') input.capture = 'environment';
    input.onchange = (e) => handleFileSelect(type, e);
    input.click();
  }

  function formatCNIC(value) {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 5) return digits;
    if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
  }

  async function uploadFile(userId, file, bucket, fileName) {
    const ext = file.name.split('.').pop();
    const path = `${userId}/${fileName}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) { console.error('Upload failed:', error); return null; }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit() {
    if (!validateStep(5)) return;
    setLoading(true);
    try {
      // Check duplicate email
      const { data: existingEmail, error: emailCheckErr } = await supabase.from('users').select('id').eq('email', formData.email).limit(1);
      if (!emailCheckErr && existingEmail?.length > 0) throw new Error('An account with this email already exists.');

      // Check duplicate phone
      const { data: existingPhone } = await supabase.from('users').select('id').eq('phone', formData.phone).limit(1);
      if (existingPhone?.length > 0) throw new Error('An account with this phone number already exists.');

      // Check duplicate CNIC
      if (formData.cnicNumber) {
        const { data: existingCNIC } = await supabase.from('users').select('id').eq('cnic_number', formData.cnicNumber).limit(1);
        if (existingCNIC?.length > 0) throw new Error('An account with this CNIC already exists.');
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email, password: formData.password,
        options: { data: { full_name: formData.fullName, role: formData.role } },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Registration failed');

      let cnicFrontUrl = null, cnicBackUrl = null;
      if (formData.cnicFrontFile) cnicFrontUrl = await uploadFile(authData.user.id, formData.cnicFrontFile, 'cnic-images', 'cnic-front');
      if (formData.cnicBackFile) cnicBackUrl = await uploadFile(authData.user.id, formData.cnicBackFile, 'cnic-images', 'cnic-back');
      let certificateUrl = null;
      if (formData.certificateFile) certificateUrl = await uploadFile(authData.user.id, formData.certificateFile, 'certificates', 'certificate');

      const { error: userError } = await supabase.from('users').insert({
        id: authData.user.id, email: formData.email, password_hash: 'managed-by-supabase-auth',
        full_name: formData.fullName, phone: formData.phone, role: formData.role,
        city: formData.city || 'Jand', address: formData.address,
        cnic_number: formData.cnicNumber, cnic_front_url: cnicFrontUrl, cnic_back_url: cnicBackUrl,
        is_active: true, email_verified: false,
      });
      if (userError) throw userError;

      if (formData.role === 'provider') {
        const { error: providerError } = await supabase.from('providers').insert({
          user_id: authData.user.id, service_types: [formData.selectedService],
          phone: formData.phone, is_approved: false, is_online: false, tier: 'bronze',
        });
        if (providerError) throw providerError;
        navigate('/provider/waiting-approval');
      } else {
        navigate('/customer/dashboard');
      }
    } catch (err) {
      alert(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }
  const [emailChecking, setEmailChecking] = useState(false)
const [emailExists, setEmailExists] = useState(false)
async function checkEmail(email) {
  if (!email || !/\S+@\S+\.\S+/.test(email)) return
  setEmailChecking(true)
  const { data } = await supabase.from('users').select('id').eq('email', email).limit(1)
  setEmailExists(data?.length > 0)
  setEmailChecking(false)
}


  const SERVICES = [
    { id: 'plumber', name: 'Plumber', icon: '🔧' },
    { id: 'electrician', name: 'Electrician', icon: '⚡' },
    { id: 'grocery', name: 'Grocery', icon: '🛒' },
    { id: 'computer_repair', name: 'Computer Repair', icon: '💻' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <div className="bg-white dark:bg-gray-900 shadow-sm p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">Zaria</h1>
          <div className="flex items-center gap-2">
            {STEPS.filter(s => !(s === 'Services' && formData.role === 'customer') && !(s === 'Certificate' && formData.role === 'customer')).map((step, i) => (
              <div key={i} className="flex items-center">
                {i > 0 && <div className={`w-4 h-0.5 ${i <= currentStep ? 'bg-blue-600 dark:bg-blue-400' : 'bg-gray-300 dark:bg-gray-600'}`} />}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${i < currentStep ? 'bg-blue-600 text-white' : i === currentStep ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                  {i < currentStep ? <Check size={14} /> : i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full p-6">
        {/* STEP 0: Account */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Account</h2>
            <div className="grid grid-cols-2 gap-4">
              <button type="button" onClick={() => setFormData(prev => ({ ...prev, role: 'customer' }))} className={`p-4 rounded-xl border-2 text-center ${formData.role === 'customer' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                <div className="text-3xl mb-2">🏠</div><div className="font-semibold text-gray-900 dark:text-white">Customer</div><div className="text-sm text-gray-500 dark:text-gray-400">I need services</div>
              </button>
              <button type="button" onClick={() => setFormData(prev => ({ ...prev, role: 'provider' }))} className={`p-4 rounded-xl border-2 text-center ${formData.role === 'provider' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                <div className="text-3xl mb-2">🔨</div><div className="font-semibold text-gray-900 dark:text-white">Provider</div><div className="text-sm text-gray-500 dark:text-gray-400">I provide services</div>
              </button>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
           <input type="email" value={formData.email} onBlur={(e) => checkEmail(e.target.value)} onChange={(e) => { setFormData(prev => ({ ...prev, email: e.target.value })); setErrors(prev => ({ ...prev, email: undefined })); }} className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-blue-500`} />
           <div className="text-red-500 text-sm mt-1 h-5">{errors.email}</div></div>
           {emailExists && <p className="text-amber-600 text-sm mt-1">This email is already registered. <Link to="/login" className="underline">Login?</Link></p>}
{emailChecking && <p className="text-gray-400 text-sm mt-1">Checking...</p>}
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password *</label><div className="relative"><input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => { setFormData(prev => ({ ...prev, password: e.target.value })); setErrors(prev => ({ ...prev, password: undefined })); }} className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white pr-12 ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-blue-500`} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button></div><div className="text-red-500 text-sm mt-1 h-5">{errors.password}</div></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password *</label><input type="password" value={formData.confirmPassword} onChange={(e) => { setFormData(prev => ({ ...prev, confirmPassword: e.target.value })); setErrors(prev => ({ ...prev, confirmPassword: undefined })); }} className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-blue-500`} /><div className="text-red-500 text-sm mt-1 h-5">{errors.confirmPassword}</div></div>
          </div>
        )}

        {/* STEP 1: Personal */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Personal Information</h2>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label><input type="text" value={formData.fullName} onChange={(e) => { setFormData(prev => ({ ...prev, fullName: e.target.value })); setErrors(prev => ({ ...prev, fullName: undefined })); }} className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${errors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-blue-500`} /><div className="text-red-500 text-sm mt-1 h-5">{errors.fullName}</div></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone *</label><input type="tel" value={formData.phone} onChange={(e) => { setFormData(prev => ({ ...prev, phone: e.target.value })); setErrors(prev => ({ ...prev, phone: undefined })); }} className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-blue-500`} /><div className="text-red-500 text-sm mt-1 h-5">{errors.phone}</div></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City *</label><input type="text" value={formData.city} onChange={(e) => { setFormData(prev => ({ ...prev, city: e.target.value })); setErrors(prev => ({ ...prev, city: undefined })); }} className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${errors.city ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-blue-500`} /><div className="text-red-500 text-sm mt-1 h-5">{errors.city}</div></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address *</label><textarea value={formData.address} onChange={(e) => { setFormData(prev => ({ ...prev, address: e.target.value })); setErrors(prev => ({ ...prev, address: undefined })); }} rows={3} className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${errors.address ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-blue-500`} /><div className="text-red-500 text-sm mt-1 h-5">{errors.address}</div></div>
          </div>
        )}

        {/* STEP 2: CNIC */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">CNIC Verification</h2>
            <p className="text-gray-600 dark:text-gray-400">Required for identity verification</p>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CNIC Number *</label><input type="text" value={formData.cnicNumber} onChange={(e) => { const formatted = formatCNIC(e.target.value); setFormData(prev => ({ ...prev, cnicNumber: formatted })); setErrors(prev => ({ ...prev, cnicNumber: undefined })); }} maxLength={15} className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${errors.cnicNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-blue-500`} placeholder="00000-0000000-0" /><div className="text-red-500 text-sm mt-1 h-5">{errors.cnicNumber}</div></div>

            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CNIC Front *</label>
              {formData.cnicFrontPreview ? (
                <div className="relative"><img src={formData.cnicFrontPreview} alt="CNIC Front" className="w-full max-w-md rounded-lg" /><button type="button" onClick={() => setFormData(prev => ({ ...prev, cnicFrontFile: null, cnicFrontPreview: null }))} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"><X size={16} /></button></div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => triggerFileUpload('cnicFront', true)} className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400"><Camera size={32} className="text-gray-400 dark:text-gray-500" /><span className="text-sm text-gray-600 dark:text-gray-400">Take Photo</span></button>
                  <button type="button" onClick={() => triggerFileUpload('cnicFront', false)} className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400"><Upload size={32} className="text-gray-400 dark:text-gray-500" /><span className="text-sm text-gray-600 dark:text-gray-400">Upload</span></button>
                </div>
              )}
              <div className="text-red-500 text-sm mt-1 h-5">{errors.cnicFront}</div>
            </div>

            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CNIC Back *</label>
              {formData.cnicBackPreview ? (
                <div className="relative"><img src={formData.cnicBackPreview} alt="CNIC Back" className="w-full max-w-md rounded-lg" /><button type="button" onClick={() => setFormData(prev => ({ ...prev, cnicBackFile: null, cnicBackPreview: null }))} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"><X size={16} /></button></div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => triggerFileUpload('cnicBack', true)} className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400"><Camera size={32} className="text-gray-400 dark:text-gray-500" /><span className="text-sm text-gray-600 dark:text-gray-400">Take Photo</span></button>
                  <button type="button" onClick={() => triggerFileUpload('cnicBack', false)} className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400"><Upload size={32} className="text-gray-400 dark:text-gray-500" /><span className="text-sm text-gray-600 dark:text-gray-400">Upload</span></button>
                </div>
              )}
              <div className="text-red-500 text-sm mt-1 h-5">{errors.cnicBack}</div>
            </div>
          </div>
        )}

        {/* STEP 3: Services */}
        {currentStep === 3 && formData.role === 'provider' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Select Your Service</h2>
            <p className="text-amber-600 dark:text-amber-400 text-sm font-medium">⚠️ Limit: 1 service per provider account</p>
            <div className="grid grid-cols-2 gap-3">
              {SERVICES.map(service => (
                <button key={service.id} type="button" onClick={() => { setFormData(prev => ({ ...prev, selectedService: service.id })); setErrors(prev => ({ ...prev, selectedService: undefined })); }} className={`p-4 rounded-xl border-2 text-center transition-all ${formData.selectedService === service.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-600' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                  <div className="text-2xl mb-1">{service.icon}</div><div className="font-medium text-sm text-gray-900 dark:text-white">{service.name}</div>
                </button>
              ))}
            </div>
            <div className="text-red-500 text-sm h-5">{errors.selectedService}</div>
          </div>
        )}

        {/* STEP 4: Certificate */}
        {currentStep === 4 && formData.role === 'provider' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Certification (Optional)</h2>
            <p className="text-gray-600 dark:text-gray-400">Upload any trade certificate, license, or qualification document</p>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Certificate / License</label>
              {formData.certificatePreview ? (
                <div className="relative"><img src={formData.certificatePreview} alt="Certificate" className="w-full max-w-md rounded-lg" /><button type="button" onClick={() => setFormData(prev => ({ ...prev, certificateFile: null, certificatePreview: null }))} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"><X size={16} /></button></div>
              ) : (
                <button type="button" onClick={() => triggerFileUpload('certificate', false)} className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 w-full"><Award size={32} className="text-gray-400 dark:text-gray-500" /><span className="text-sm text-gray-600 dark:text-gray-400">Upload Certificate (PDF/Image)</span></button>
              )}
            </div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Years of Experience</label><input type="number" value={formData.experience} onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))} min="0" max="50" className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Short Bio</label><textarea value={formData.bio} onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))} rows={3} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="Tell customers about yourself..." /></div>
          </div>
        )}

        {/* STEP 5: Review */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Review Your Information</h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 space-y-2 border border-gray-200 dark:border-gray-700">
              <ReviewRow label="Role" value={formData.role} />
              <ReviewRow label="Email" value={formData.email} />
              <ReviewRow label="Full Name" value={formData.fullName} />
              <ReviewRow label="Phone" value={formData.phone} />
              <ReviewRow label="City" value={formData.city} />
              <ReviewRow label="CNIC" value={formData.cnicNumber} />
              {formData.cnicFrontPreview && <div><span className="text-sm text-gray-500 dark:text-gray-400">CNIC Front:</span><img src={formData.cnicFrontPreview} alt="Front" className="w-32 rounded mt-1" /></div>}
              {formData.cnicBackPreview && <div><span className="text-sm text-gray-500 dark:text-gray-400">CNIC Back:</span><img src={formData.cnicBackPreview} alt="Back" className="w-32 rounded mt-1" /></div>}
              {formData.role === 'provider' && <ReviewRow label="Service" value={SERVICES.find(s => s.id === formData.selectedService)?.name || '-'} />}
              {formData.certificatePreview && <div><span className="text-sm text-gray-500 dark:text-gray-400">Certificate:</span><img src={formData.certificatePreview} alt="Cert" className="w-32 rounded mt-1" /></div>}
            </div>
            <button onClick={handleSubmit} disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        )}

        <div className="flex justify-between mt-8">
          {currentStep > 0 && <button type="button" onClick={prevStep} className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"><ArrowLeft size={20} /> Back</button>}
          <div className="flex-1" />
          {currentStep < 5 && <button type="button" onClick={nextStep} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Next <ArrowRight size={20} /></button>}
        </div>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-8">Already have an account? <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Sign In</Link></p>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700"><span className="text-sm text-gray-500 dark:text-gray-400">{label}</span><span className="text-sm font-medium text-gray-900 dark:text-white">{value || '-'}</span></div>;
}