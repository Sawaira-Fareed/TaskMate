import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff } from 'lucide-react';

const STEPS = ['Account', 'Personal'];

export default function Register() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '',
    fullName: '', phone: '', city: '',
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
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function nextStep() {
    if (!validateStep(currentStep)) return;
    if (currentStep === 1) {
      handleSubmit();
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  }

  function prevStep() {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }

  async function handleSubmit() {
    if (!validateStep(1)) return;
    setLoading(true);
    try {
      // Check duplicate email
      const { data: existingEmail } = await supabase.from('users').select('id').eq('email', formData.email).limit(1);
      if (existingEmail?.length > 0) throw new Error('An account with this email already exists.');

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { full_name: formData.fullName, role: 'customer' } },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Registration failed');

      const { error: userError } = await supabase.from('users').insert({
        id: authData.user.id,
        email: formData.email,
        password_hash: 'managed-by-supabase-auth',
        full_name: formData.fullName,
        phone: formData.phone,
        role: ['customer'],
        city: formData.city || 'Jand',
        is_active: true,
        email_verified: false,
      });
      if (userError) throw userError;

      navigate('/customer/dashboard');
    } catch (err) {
      alert(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <div className="bg-white dark:bg-gray-900 shadow-sm p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">Zaria</h1>
          <div className="flex items-center gap-2">
            {STEPS.map((step, i) => (
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
            <p className="text-gray-600 dark:text-gray-400">Sign up as a customer to start booking services</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
              <input type="email" value={formData.email} onBlur={(e) => checkEmail(e.target.value)}
                onChange={(e) => { setFormData(prev => ({ ...prev, email: e.target.value })); setErrors(prev => ({ ...prev, email: undefined })); }}
                className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-blue-500`} />
              <div className="text-red-500 text-sm mt-1 h-5">{errors.email}</div>
            </div>
            {emailExists && <p className="text-amber-600 text-sm mt-1">This email is already registered. <Link to="/login" className="underline">Login?</Link></p>}
            {emailChecking && <p className="text-gray-400 text-sm mt-1">Checking...</p>}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password *</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={formData.password}
                  onChange={(e) => { setFormData(prev => ({ ...prev, password: e.target.value })); setErrors(prev => ({ ...prev, password: undefined })); }}
                  className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white pr-12 ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-blue-500`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div className="text-red-500 text-sm mt-1 h-5">{errors.password}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password *</label>
              <input type="password" value={formData.confirmPassword}
                onChange={(e) => { setFormData(prev => ({ ...prev, confirmPassword: e.target.value })); setErrors(prev => ({ ...prev, confirmPassword: undefined })); }}
                className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-blue-500`} />
              <div className="text-red-500 text-sm mt-1 h-5">{errors.confirmPassword}</div>
            </div>
          </div>
        )}

        {/* STEP 1: Personal */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Personal Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
              <input type="text" value={formData.fullName}
                onChange={(e) => { setFormData(prev => ({ ...prev, fullName: e.target.value })); setErrors(prev => ({ ...prev, fullName: undefined })); }}
                className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${errors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-blue-500`} />
              <div className="text-red-500 text-sm mt-1 h-5">{errors.fullName}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone *</label>
              <input type="tel" value={formData.phone}
                onChange={(e) => { setFormData(prev => ({ ...prev, phone: e.target.value })); setErrors(prev => ({ ...prev, phone: undefined })); }}
                className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-blue-500`} />
              <div className="text-red-500 text-sm mt-1 h-5">{errors.phone}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City *</label>
              <input type="text" value={formData.city}
                onChange={(e) => { setFormData(prev => ({ ...prev, city: e.target.value })); setErrors(prev => ({ ...prev, city: undefined })); }}
                className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${errors.city ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-blue-500`} />
              <div className="text-red-500 text-sm mt-1 h-5">{errors.city}</div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          {currentStep > 0 && (
            <button type="button" onClick={prevStep} className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <ArrowLeft size={20} /> Back
            </button>
          )}
          <div className="flex-1" />
          <button type="button" onClick={nextStep} disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Creating...' : currentStep === 1 ? 'Create Account' : 'Next'}
            {!loading && <ArrowRight size={20} />}
          </button>
        </div>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-8">
          Already have an account? <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Sign In</Link>
        </p>
      </div>
    </div>
  );
}