import { useNavigate, useLocation } from 'react-router-dom'
import { Home, ClipboardList, Calendar, Bell, User, Search } from 'lucide-react'
import { useMediaQuery } from '@/hooks/useMediaQuery'

export default function MobileBottomNav({ role = 'customer' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useMediaQuery('(max-width: 768px)')

  //if (!isMobile) return null

  const customerLinks = [
    { icon: Home, label: 'Home', path: '/customer/dashboard' },
    { icon: Search, label: 'Providers', path: '/customer/providers' },
    { icon: ClipboardList, label: 'Requests', path: '/customer/my-requests' },
    { icon: Calendar, label: 'Bookings', path: '/customer/bookings' },
    { icon: User, label: 'Profile', path: '/customer/profile' },
  ]

  const providerLinks = [
    { icon: Home, label: 'Home', path: '/provider/dashboard' },
    { icon: ClipboardList, label: 'Jobs', path: '/provider/jobs' },
    { icon: Bell, label: 'Alerts', path: '/provider/notifications' },
    { icon: User, label: 'Profile', path: '/provider/profile' },
  ]

 const adminLinks = [
  { icon: Home, label: 'Home', path: '/admin/dashboard' },
  { icon: ClipboardList, label: 'Approvals', path: '/admin/approvals' },
  { icon: User, label: 'Platform', path: '/admin/platform' },
]
  const links = role === 'provider' ? providerLinks : role === 'admin' ? adminLinks : customerLinks

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-area-bottom md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {links.map((link, i) => {
          const isActive = location.pathname === link.path
          const Icon = link.icon
          return (
            <button
              key={i}
              onClick={() => navigate(link.path)}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[60px] py-1 px-2 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <Icon className={`w-5 h-5 transition-all duration-200 ${isActive ? 'scale-110' : ''}`} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className={`text-[10px] font-medium ${isActive ? 'opacity-100' : 'opacity-70'}`}>{link.label}</span>
              {isActive && (
                <span className="absolute -top-0.5 w-8 h-0.5 bg-purple-600 dark:bg-purple-400 rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}