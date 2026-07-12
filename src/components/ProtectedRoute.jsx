// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, role, setUser, setRole, clearAuth } = useAuthStore();
  const [checking, setChecking] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        clearAuth();
        setIsValid(false);
        setChecking(false);
        return;
      }

      // Fetch user from users table (not profiles)
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error || !userData) {
        await supabase.auth.signOut();
        clearAuth();
        setIsValid(false);
        setChecking(false);
        return;
      }

      // Check role authorization
      if (allowedRoles.length > 0 && !allowedRoles.includes(userData.role)) {
        setIsValid(false);
        setChecking(false);
        return;
      }

      setUser(userData);
      setRole(userData.role);
      setIsValid(true);
    } catch (err) {
      clearAuth();
      setIsValid(false);
    }
    setChecking(false);
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isValid) {
    if (role) {
      if (role === 'customer') return <Navigate to="/customer/dashboard" replace />;
      if (role === 'provider') return <Navigate to="/provider/dashboard" replace />;
      if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}