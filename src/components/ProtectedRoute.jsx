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

      // Check role authorization
      if (allowedRoles.length > 0 && !allowedRoles.includes(userData.role)) {
        setIsValid(false)
        setChecking(false)
        return
      }

      // For providers: check if approved
      if (userData.role === 'provider') {
        const { data: provider } = await supabase
          .from('providers')
          .select('is_approved')
          .eq('user_id', session.user.id)
          .single()

        if (provider && !provider.is_approved) {
          // Allow only the waiting-approval page
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