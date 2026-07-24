import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Loader2, WifiOff, AlertTriangle } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

const STEPS = ['Account', 'Personal'];

export default function Register() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const { isOnline, isSlow } = useNetworkStatus();

  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '',
    fullName: '', phone: '', city: '',
  });

  function sanitize(str) { if (!str) return str; return str.replace(/[<>{}]/g, '').trim(); }

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
      else if (!/^\+?\d{10,14}$/.test(formData.phone.replace(/[\s-]/g, ''))) newErrors.phone = 'Enter a valid phone number';
      if (!formData.city.trim()) newErrors.city = 'City is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function nextStep() {
    if (!validateStep(currentStep)) return;
    if (currentStep === 1) { handleSubmit(); return; }
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  }

  function prevStep() { setCurrentStep(prev => Math.max(prev - 1, 0)); }

  async function handleSubmit() {
    if (!validateStep(1)) return;
    setLoading(true); setSubmitError('');
    try {
      const { data: existingEmail } = await supabase.from('users').select('id').eq('email', formData.email).limit(1);
      if (existingEmail?.length > 0) throw new Error('An account with this email already exists.');

      const { data: existingPhone } = await supabase.from('users').select('id').eq('phone', formData.phone).limit(1);
      if (existingPhone?.length > 0) { setErrors(prev => ({ ...prev, phone: 'This phone number is already registered' })); setLoading(false); return; }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email, password: formData.password,
        options: { data: { full_name: formData.fullName, role: 'customer' } },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Registration failed');

      const { error: userError } = await supabase.from('users').insert({
        id: authData.user.id, email: sanitize(formData.email), password_hash: 'managed-by-supabase-auth',
        full_name: sanitize(formData.fullName), phone: sanitize(formData.phone), role: ['customer'],
        city: sanitize(formData.city) || 'Jand', is_active: true, email_verified: false,
      });
      if (userError) throw userError;

      setSuccessMsg('Account created! Redirecting...');
      setTimeout(() => navigate('/customer/dashboard'), 800);
    } catch (err) { setSubmitError(err.message); }
    finally { setLoading(false); }
  }

  const [emailChecking, setEmailChecking] = useState(false);
  const [emailExists, setEmailExists] = useState(false);

  async function checkEmail(email) {
    if (!email || !/\S+@\S+\.\S+/.test(email)) return;
    setEmailChecking(true);
    const { data } = await supabase.from('users').select('id').eq('email', email).limit(1);
    setEmailExists(data?.length > 0);
    setEmailChecking(false);
  }

  if (!isOnline) {
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4"><div className="text-center"><WifiOff className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" /><h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Internet</h3><button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium">Retry</button></div></div>)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {isSlow && (<div className="sticky top-0 z-50 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs text-center py-1.5">Slow connection</div>)}
      {successMsg && (<div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-lg text-sm font-medium animate-pulse"><Check className="w-4 h-4 inline mr-1" /> {successMsg}</div>)}

      <div className="bg-white dark:bg-gray-900 shadow-sm p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto flex items-center justify-between"><h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">Zaria</h1>
          <div className="flex items-center gap-2">{STEPS.map((step, i) => (<div key={i} className="flex items-center">{i > 0 && <div className={`w-4 h-0.5 ${i <= currentStep ? 'bg-blue-600 dark:bg-blue-400' : 'bg-gray-300 dark:bg-gray-600'}`} />}<div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${i < currentStep ? 'bg-blue-600 text-white' : i === currentStep ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>{i < currentStep ? <Check size={14} /> : i + 1}</div></div>))}</div>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full p-6">
        {submitError && (<div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-xl px-4 py-2.5 mb-4 border border-red-200 dark:border-red-800 flex items-center gap-2"><AlertTriangle className="w-4 h-4 flex-shrink-0" />{submitError}</div>)}

        {currentStep === 0 && (<div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Account</h2>
          <p className="text-gray-600 dark:text-gray-400">Sign up as a customer to start booking services</p>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label><input type="email" value={formData.email} onBlur={(e) => checkEmail(e.target.value)} onChange={(e) => { setFormData(prev => ({ ...prev, email: e.target.value })); setErrors(prev => ({ ...prev, email: undefined })); }} className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-blue-500`} /><div className="text-red-500 text-sm mt-1 h-5">{errors.email}</div></div>
          {emailExists && <p className="text-amber-600 text-sm mt-1">This email is already registered. <Link to="/login" className="underline">Login?</Link></p>}
          {emailChecking && <p className="text-gray-400 text-sm mt-1">Checking...</p>}
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password *</label><div className="relative"><input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => { setFormData(prev => ({ ...prev, password: e.target.value })); setErrors(prev => ({ ...prev, password: undefined })); }} className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white pr-12 ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-blue-500`} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button></div><div className="text-red-500 text-sm mt-1 h-5">{errors.password}</div></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password *</label><input type="password" value={formData.confirmPassword} onChange={(e) => { setFormData(prev => ({ ...prev, confirmPassword: e.target.value })); setErrors(prev => ({ ...prev, confirmPassword: undefined })); }} className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-blue-500`} /><div className="text-red-500 text-sm mt-1 h-5">{errors.confirmPassword}</div></div>

          <div className="relative my-4"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-600"></div></div><div className="relative flex justify-center text-xs"><span className="bg-gray-50 dark:bg-gray-950 px-2 text-gray-500">or</span></div></div>
          <button type="button" onClick={async () => { await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/customer/dashboard' } }) }} className="w-full py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>
        </div>)}

        {currentStep === 1 && (<div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Personal Information</h2>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label><input type="text" value={formData.fullName} onChange={(e) => { setFormData(prev => ({ ...prev, fullName: e.target.value })); setErrors(prev => ({ ...prev, fullName: undefined })); }} className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${errors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-blue-500`} /><div className="text-red-500 text-sm mt-1 h-5">{errors.fullName}</div></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone *</label><input type="tel" value={formData.phone} onChange={(e) => { setFormData(prev => ({ ...prev, phone: e.target.value })); setErrors(prev => ({ ...prev, phone: undefined })); }} className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-blue-500`} /><div className="text-red-500 text-sm mt-1 h-5">{errors.phone}</div></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City *</label><input type="text" value={formData.city} onChange={(e) => { setFormData(prev => ({ ...prev, city: e.target.value })); setErrors(prev => ({ ...prev, city: undefined })); }} className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${errors.city ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-blue-500`} /><div className="text-red-500 text-sm mt-1 h-5">{errors.city}</div></div>
        </div>)}

        <div className="flex justify-between mt-8">
          {currentStep > 0 && (<button type="button" onClick={prevStep} className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"><ArrowLeft size={20} /> Back</button>)}
          <div className="flex-1" />
          <button type="button" onClick={nextStep} disabled={loading} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : currentStep === 1 ? 'Create Account' : 'Next'}
            {!loading && currentStep === 1 && <Check size={20} />}
            {!loading && currentStep !== 1 && <ArrowRight size={20} />}
          </button>
        </div>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-8">Already have an account? <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Sign In</Link></p>
      </div>
    </div>
  );
}