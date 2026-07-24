import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <Search className="w-10 h-10 text-purple-400" />
        </div>
        <h1 className="text-6xl font-bold text-purple-600 mb-2">404</h1>
        <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Page not found</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
          <button onClick={() => navigate('/')} className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors">
            <Home className="w-4 h-4" /> Home
          </button>
        </div>
      </div>
    </div>
  )
}