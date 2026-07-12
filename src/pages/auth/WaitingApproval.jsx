// src/pages/auth/WaitingApproval.jsx
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Clock, Mail, ArrowLeft, LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function WaitingApproval() {
  const navigate = useNavigate();
  const { language, user, clearAuth } = useAuthStore();
  
  const t = (en, ur) => language === 'ur' ? ur : en;

  async function handleLogout() {
    await supabase.auth.signOut();
    clearAuth();
    navigate('/');
  }

  function handleContactSupport() {
    // Navigate to FAQ which has contact options, or open email
    navigate('/faq');
  }

  function handleEmailSupport() {
    window.location.href = 'mailto:support@zaria.app?subject=Approval%20Status%20Inquiry';
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock size={40} className="text-amber-600 dark:text-amber-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('Waiting for Approval', 'منظوری کا انتظار ہے')}
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t(
            'Your service provider account is being reviewed by our team. This usually takes 24-48 hours. You will be notified once approved.',
            'آپ کے سروس پرووائیڈر اکاؤنٹ کا ہماری ٹیم جائزہ لے رہی ہے۔ عام طور پر 24-48 گھنٹے لگتے ہیں۔ منظوری کے بعد آپ کو مطلع کیا جائے گا۔'
          )}
        </p>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6 text-left">
          <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
            {t('What happens next?', 'آگے کیا ہوگا؟')}
          </p>
          <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1 list-disc list-inside">
            <li>{t('Admin reviews your documents', 'ایڈمن آپ کے دستاویزات چیک کرے گا')}</li>
            <li>{t('CNIC and certifications verified', 'شناختی کارڈ اور سرٹیفکیٹس کی تصدیق')}</li>
            <li>{t('You receive email notification', 'آپ کو ای میل اطلاع ملے گی')}</li>
            <li>{t('Start receiving customer requests', 'گاہکوں کی درخواستیں ملنا شروع ہو جائیں گی')}</li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleContactSupport}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Mail size={18} />
            {t('Contact Support', 'سپورٹ سے رابطہ کریں')}
          </button>
          
          <button
            onClick={handleEmailSupport}
            className="w-full py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <Mail size={18} />
            {t('Email: support@zaria.app', 'ای میل: support@zaria.app')}
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            {t('Sign Out', 'سائن آؤٹ')}
          </button>
        </div>
      </div>
    </div>
  );
}