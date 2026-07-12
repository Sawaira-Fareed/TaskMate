// src/pages/auth/Register.jsx
import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore, useProviderStore, useCustomerStore } from '../../store/authStore';
import { Camera, Upload, ArrowLeft, ArrowRight, Check, X, Eye, EyeOff } from 'lucide-react';

const STEPS = ['Account', 'Personal', 'CNIC', 'Services', 'Review'];

export default function Register() {
  const navigate = useNavigate();
  const { language, setUser, setRole } = useAuthStore();
  const providerStore = useProviderStore();
  const customerStore = useCustomerStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Form data - ALL fields required
  const [formData, setFormData] = useState({
    // Step 1: Account
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer', // customer or provider
    
    // Step 2: Personal (required for ALL roles)
    fullName: '',
    phone: '',
    city: '',
    address: '',
    
    // Step 3: CNIC (required for ALL roles)
    cnicNumber: '',
    cnicFrontFile: null,
    cnicBackFile: null,
    cnicFrontPreview: null,
    cnicBackPreview: null,
    
    // Step 4: Services (providers only, max 1)
    selectedService: '',
    
    // Step 5: Certifications (providers only, optional)
    certificationFile: null,
    certificationPreview: null,
    experience: '',
    bio: '',
  });

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Validate current step before proceeding
  function validateStep(step) {
    const newErrors = {};
    
    if (step === 0) {
      if (!formData.email.trim()) newErrors.email = language === 'ur' ? 'ای میل درکار ہے' : 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = language === 'ur' ? 'درست ای میل درج کریں' : 'Invalid email format';
      if (!formData.password) newErrors.password = language === 'ur' ? 'پاسورڈ درکار ہے' : 'Password is required';
      else if (formData.password.length < 8) newErrors.password = language === 'ur' ? 'پاسورڈ کم از کم 8 حروف کا ہو' : 'Password must be at least 8 characters';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = language === 'ur' ? 'پاسورڈ مماثل نہیں' : 'Passwords do not match';
    }
    
    if (step === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = language === 'ur' ? 'نام درکار ہے' : 'Full name is required';
      if (!formData.phone.trim()) newErrors.phone = language === 'ur' ? 'فون نمبر درکار ہے' : 'Phone number is required';
      if (!formData.city.trim()) newErrors.city = language === 'ur' ? 'شہر درکار ہے' : 'City is required';
      if (!formData.address.trim()) newErrors.address = language === 'ur' ? 'پتہ درکار ہے' : 'Address is required';
    }
    
    if (step === 2) {
      if (!formData.cnicNumber.trim()) newErrors.cnicNumber = language === 'ur' ? 'شناختی کارڈ نمبر درکار ہے' : 'CNIC number is required';
      else if (!/^\d{5}-\d{7}-\d{1}$/.test(formData.cnicNumber)) newErrors.cnicNumber = language === 'ur' ? 'درست CNIC فارمیٹ: 00000-0000000-0' : 'Valid CNIC format: 00000-0000000-0';
      if (!formData.cnicFrontFile) newErrors.cnicFront = language === 'ur' ? 'شناختی کارڈ کی سامنے کی تصویر درکار ہے' : 'CNIC front image is required';
      if (!formData.cnicBackFile) newErrors.cnicBack = language === 'ur' ? 'شناختی کارڈ کی پچھلی تصویر درکار ہے' : 'CNIC back image is required';
    }
    
    if (step === 3 && formData.role === 'provider') {
      if (!formData.selectedService) newErrors.selectedService = language === 'ur' ? 'کم از کم ایک سروس منتخب کریں' : 'Please select one service';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function nextStep() {
    if (validateStep(currentStep)) {
      // Skip service step for customers
      if (currentStep === 2 && formData.role === 'customer') {
        setCurrentStep(4); // Go to review
      } else if (currentStep === 3 && formData.role === 'provider') {
        setCurrentStep(4); // Go to review
      } else {
        setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
      }
    }
  }

  function prevStep() {
    // Skip service step for customers when going back
    if (currentStep === 4 && formData.role === 'customer') {
      setCurrentStep(2);
    } else {
      setCurrentStep(prev => Math.max(prev - 1, 0));
    }
  }

  // Handle file upload via camera or gallery
  function handleFileSelect(type, event) {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert(language === 'ur' ? 'براہ کرم تصویر منتخب کریں' : 'Please select an image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(language === 'ur' ? 'تصویر کا سائز 5MB سے کم ہو' : 'Image size must be less than 5MB');
      return;
    }
    
    const preview = URL.createObjectURL(file);
    
    setFormData(prev => ({
      ...prev,
      [`${type}File`]: file,
      [`${type}Preview`]: preview,
    }));
    
    // Clear error for this field
    setErrors(prev => ({ ...prev, [type]: undefined }));
  }

 function openCamera(type) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.capture = 'environment';
  input.onchange = (e) => handleFileSelect(type, e);
  input.click();
}

  // Format CNIC as user types
  function formatCNIC(value) {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 5) return digits;
    if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
  }

// Submit registration
async function handleSubmit() {
  if (!validateStep(4)) return;
  setLoading(true);
  
  try {
    // 1. Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          role: formData.role,
        }
      }
    });
    
    if (authError) throw authError;
    if (!authData.user) throw new Error('Registration failed');

    // 2. Insert into users table
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: formData.email,
        password_hash: 'managed-by-supabase-auth',
        full_name: formData.fullName,
        phone: formData.phone,
        role: formData.role,
        city: formData.city || 'Jand',
        is_active: true,
        email_verified: false,
      });

    if (userError) throw userError;

    // 3. If provider, insert into providers table
    if (formData.role === 'provider') {
      const { error: providerError } = await supabase
        .from('providers')
        .insert({
          user_id: authData.user.id,
          service_types: formData.selectedService ? [formData.selectedService] : [],
          phone: formData.phone,
          is_approved: false,
          is_online: false,
          tier: 'bronze',
        });

      if (providerError) throw providerError;
    }

    // 4. Navigate based on role
    if (formData.role === 'provider') {
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

  const t = (en, ur) => language === 'ur' ? ur : en;

  // Available services for providers
  const SERVICES = [
    { id: 'plumbing', name: t('Plumbing', 'پلمبنگ'), icon: '🔧' },
    { id: 'electrical', name: t('Electrical', 'الیکٹریکل'), icon: '⚡' },
    { id: 'cleaning', name: t('Cleaning', 'صفائی'), icon: '🧹' },
    { id: 'painting', name: t('Painting', 'پینٹنگ'), icon: '🎨' },
    { id: 'carpentry', name: t('Carpentry', 'کارپینٹری'), icon: '🪚' },
    { id: 'ac_repair', name: t('AC Repair', 'اے سی مرمت'), icon: '❄️' },
    { id: 'mechanic', name: t('Mechanic', 'مکینک'), icon: '🔩' },
    { id: 'gardening', name: t('Gardening', 'باغبانی'), icon: '🌱' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">Zaria</h1>
          <div className="flex items-center gap-2">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-center">
                {i > 0 && <div className={`w-4 h-0.5 ${i <= currentStep ? 'bg-blue-600' : 'bg-gray-300'}`} />}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  i < currentStep ? 'bg-blue-600 text-white' :
                  i === currentStep ? 'bg-blue-100 text-blue-600 border-2 border-blue-600' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {i < currentStep ? <Check size={14} /> : i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full p-6">
        
        {/* STEP 0: Account */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('Create Account', 'اکاؤنٹ بنائیں')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('Choose your role and set up your login details', 'اپنا کردار منتخب کریں اور لاگ ان کی تفصیلات سیٹ کریں')}
            </p>
            
            {/* Role Selection */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, role: 'customer' }))}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  formData.role === 'customer'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-2">🏠</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {t('Customer', 'گاہک')}
                </div>
                <div className="text-sm text-gray-500">
                  {t('I need services', 'مجھے خدمات چاہیے')}
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, role: 'provider' }))}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  formData.role === 'provider'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-2">🔨</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {t('Service Provider', 'سروس پرووائیڈر')}
                </div>
                <div className="text-sm text-gray-500">
                  {t('I provide services', 'میں خدمات فراہم کرتا ہوں')}
                </div>
              </button>
            </div>
            
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('Email', 'ای میل')} *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, email: e.target.value }));
                  setErrors(prev => ({ ...prev, email: undefined }));
                }}
                className={`w-full px-4 py-3 rounded-lg border ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500`}
                placeholder="name@example.com"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
            
            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('Password', 'پاسورڈ')} *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, password: e.target.value }));
                    setErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  className={`w-full px-4 py-3 rounded-lg border ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 pr-12`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>
            
            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('Confirm Password', 'پاسورڈ کی تصدیق')} *
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, confirmPassword: e.target.value }));
                  setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                }}
                className={`w-full px-4 py-3 rounded-lg border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500`}
                placeholder="••••••••"
              />
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>
          </div>
        )}

        {/* STEP 1: Personal Info */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('Personal Information', 'ذاتی معلومات')}
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('Full Name', 'پورا نام')} *
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, fullName: e.target.value }));
                  setErrors(prev => ({ ...prev, fullName: undefined }));
                }}
                className={`w-full px-4 py-3 rounded-lg border ${errors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500`}
              />
              {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('Phone Number', 'فون نمبر')} *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, phone: e.target.value }));
                  setErrors(prev => ({ ...prev, phone: undefined }));
                }}
                className={`w-full px-4 py-3 rounded-lg border ${errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500`}
                placeholder="+92 300 1234567"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('City', 'شہر')} *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, city: e.target.value }));
                  setErrors(prev => ({ ...prev, city: undefined }));
                }}
                className={`w-full px-4 py-3 rounded-lg border ${errors.city ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500`}
              />
              {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('Address', 'پتہ')} *
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, address: e.target.value }));
                  setErrors(prev => ({ ...prev, address: undefined }));
                }}
                rows={3}
                className={`w-full px-4 py-3 rounded-lg border ${errors.address ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500`}
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
            </div>
          </div>
        )}

        {/* STEP 2: CNIC (Required for ALL users) */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('CNIC Verification', 'شناختی کارڈ کی تصدیق')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('Your CNIC is required for identity verification', 'شناخت کی تصدیق کے لیے آپ کا شناختی کارڈ درکار ہے')}
            </p>
            
            {/* CNIC Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('CNIC Number', 'شناختی کارڈ نمبر')} *
              </label>
              <input
                type="text"
                value={formData.cnicNumber}
                onChange={(e) => {
                  const formatted = formatCNIC(e.target.value);
                  setFormData(prev => ({ ...prev, cnicNumber: formatted }));
                  setErrors(prev => ({ ...prev, cnicNumber: undefined }));
                }}
                maxLength={15}
                className={`w-full px-4 py-3 rounded-lg border ${errors.cnicNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500`}
                placeholder="00000-0000000-0"
              />
              {errors.cnicNumber && <p className="text-red-500 text-sm mt-1">{errors.cnicNumber}</p>}
            </div>
            
            {/* CNIC Front */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('CNIC Front Side', 'شناختی کارڈ سامنے کی طرف')} *
              </label>
              {formData.cnicFrontPreview ? (
                <div className="relative">
                  <img src={formData.cnicFrontPreview} alt="CNIC Front" className="w-full max-w-md rounded-lg" />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, cnicFrontFile: null, cnicFrontPreview: null }))}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => openCamera('cnicFront')}
                    className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 transition-colors"
                  >
                    <Camera size={32} className="text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {t('Take Photo', 'تصویر لیں')}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => document.getElementById('cnicFrontInput').click()}
                    className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 transition-colors"
                  >
                    <Upload size={32} className="text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {t('Upload', 'اپ لوڈ کریں')}
                    </span>
                  </button>
                  <input
                    id="cnicFrontInput"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect('cnicFront', e)}
                  />
                </div>
              )}
              {errors.cnicFront && <p className="text-red-500 text-sm mt-1">{errors.cnicFront}</p>}
            </div>
            
            {/* CNIC Back */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('CNIC Back Side', 'شناختی کارڈ پچھلی طرف')} *
              </label>
              {formData.cnicBackPreview ? (
                <div className="relative">
                  <img src={formData.cnicBackPreview} alt="CNIC Back" className="w-full max-w-md rounded-lg" />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, cnicBackFile: null, cnicBackPreview: null }))}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => openCamera('cnicBack')}
                    className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 transition-colors"
                  >
                    <Camera size={32} className="text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {t('Take Photo', 'تصویر لیں')}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => document.getElementById('cnicBackInput').click()}
                    className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 transition-colors"
                  >
                    <Upload size={32} className="text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {t('Upload', 'اپ لوڈ کریں')}
                    </span>
                  </button>
                  <input
                    id="cnicBackInput"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect('cnicBack', e)}
                  />
                </div>
              )}
              {errors.cnicBack && <p className="text-red-500 text-sm mt-1">{errors.cnicBack}</p>}
            </div>
          </div>
        )}

        {/* STEP 3: Services (Providers Only) */}
        {currentStep === 3 && formData.role === 'provider' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('Select Your Service', 'اپنی سروس منتخب کریں')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('You can only select ONE primary service for smooth app performance', 'ایپ کی بہتر کارکردگی کے لیے آپ صرف ایک سروس منتخب کر سکتے ہیں')}
            </p>
            <p className="text-amber-600 dark:text-amber-400 text-sm font-medium">
              ⚠️ {t('Limit: 1 service per provider account', 'حد: فی پرووائیڈر اکاؤنٹ صرف 1 سروس')}
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              {SERVICES.map(service => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, selectedService: service.id }));
                    setErrors(prev => ({ ...prev, selectedService: undefined }));
                  }}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    formData.selectedService === service.id
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-600'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{service.icon}</div>
                  <div className="font-medium text-gray-900 dark:text-white text-sm">{service.name}</div>
                </button>
              ))}
            </div>
            {errors.selectedService && <p className="text-red-500 text-sm">{errors.selectedService}</p>}
            
            {/* Experience & Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('Years of Experience', 'تجربے کے سال')}
              </label>
              <input
                type="number"
                value={formData.experience}
                onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                min="0"
                max="50"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('Short Bio', 'مختصر تعارف')}
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder={t('Tell customers about yourself...', 'گاہکوں کو اپنے بارے میں بتائیں...')}
              />
            </div>
          </div>
        )}

        {/* STEP 4: Review */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('Review Your Information', 'اپنی معلومات کا جائزہ لیں')}
            </h2>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 space-y-3">
              <ReviewRow label={t('Role', 'کردار')} value={formData.role === 'customer' ? t('Customer', 'گاہک') : t('Service Provider', 'سروس پرووائیڈر')} />
              <ReviewRow label={t('Email', 'ای میل')} value={formData.email} />
              <ReviewRow label={t('Full Name', 'پورا نام')} value={formData.fullName} />
              <ReviewRow label={t('Phone', 'فون')} value={formData.phone} />
              <ReviewRow label={t('City', 'شہر')} value={formData.city} />
              <ReviewRow label={t('CNIC', 'شناختی کارڈ')} value={formData.cnicNumber} />
              {formData.cnicFrontPreview && (
                <div>
                  <span className="text-sm text-gray-500">{t('CNIC Front', 'شناختی کارڈ سامنے')}:</span>
                  <img src={formData.cnicFrontPreview} alt="CNIC Front" className="w-32 rounded mt-1" />
                </div>
              )}
              {formData.cnicBackPreview && (
                <div>
                  <span className="text-sm text-gray-500">{t('CNIC Back', 'شناختی کارڈ پیچھے')}:</span>
                  <img src={formData.cnicBackPreview} alt="CNIC Back" className="w-32 rounded mt-1" />
                </div>
              )}
              {formData.role === 'provider' && (
                <>
                  <ReviewRow label={t('Service', 'سروس')} value={SERVICES.find(s => s.id === formData.selectedService)?.name || '-'} />
                  <ReviewRow label={t('Experience', 'تجربہ')} value={formData.experience ? `${formData.experience} years` : '-'} />
                </>
              )}
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  {t('Creating Account...', 'اکاؤنٹ بن رہا ہے...')}
                </span>
              ) : (
                t('Create Account', 'اکاؤنٹ بنائیں')
              )}
            </button>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={prevStep}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft size={20} />
              {t('Back', 'واپس')}
            </button>
          )}
          <div className="flex-1" />
{currentStep < 4 && (            <button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t('Next', 'اگلا')}
              <ArrowRight size={20} />
            </button>
          )}
        </div>
        
        {/* Sign In Link */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-8">
          {t('Already have an account?', 'پہلے سے اکاؤنٹ ہے؟')}{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            {t('Sign In', 'سائن ان کریں')}
          </Link>
        </p>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white">{value || '-'}</span>
    </div>
  );
}