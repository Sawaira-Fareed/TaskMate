import { Outlet, useLocation } from 'react-router-dom'
import MobileBottomNav from './MobileBottomNav'

export default function Layout() {
  const location = useLocation()
  
  // Determine role from URL path
  const getRole = () => {
    if (location.pathname.startsWith('/provider')) return 'provider'
    if (location.pathname.startsWith('/admin')) return 'admin'
    return 'customer'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <main className="pb-20 md:pb-0">
        <Outlet />
      </main>
      <MobileBottomNav role={getRole()} />
    </div>
  )
}