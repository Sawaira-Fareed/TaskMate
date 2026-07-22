import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const [checking, setChecking] = useState(true)
  const [isValid, setIsValid] = useState(false)
  const [redirectPath, setRedirectPath] = useState('/')

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setIsValid(false)
        setChecking(false)
        return
      }

      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (error || !userData) {
        await supabase.auth.signOut()
        setIsValid(false)
        setChecking(false)
        return
      }

      // Handle array roles
      const userRoles = Array.isArray(userData.role) ? userData.role : [userData.role]

      // Check role authorization
      if (allowedRoles.length > 0 && !allowedRoles.some(r => userRoles.includes(r))) {
        // Redirect to appropriate dashboard based on first role
        if (userRoles.includes('admin')) setRedirectPath('/admin/dashboard')
        else if (userRoles.includes('provider')) setRedirectPath('/provider/dashboard')
        else setRedirectPath('/customer/dashboard')
        setIsValid(false)
        setChecking(false)
        return
      }

      // For providers: check if approved
      if (userRoles.includes('provider')) {
        const { data: provider } = await supabase
          .from('providers')
          .select('is_approved')
          .eq('user_id', session.user.id)
          .single()

        if (provider && !provider.is_approved) {
          const currentPath = window.location.pathname
          if (currentPath !== '/provider/waiting-approval') {
            setRedirectPath('/provider/waiting-approval')
            setIsValid(false)
            setChecking(false)
            return
          }
        }
      }

      setIsValid(true)
    } catch (err) {
      setIsValid(false)
    }
    setChecking(false)
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!isValid) {
    return <Navigate to={redirectPath} replace />
  }

  return children
}