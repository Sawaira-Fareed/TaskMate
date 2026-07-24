import { WifiOff, AlertCircle, Inbox, Loader2, RefreshCw, Wifi } from 'lucide-react'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

export default function PageWrapper({ 
  children, 
  loading = false, 
  error = null, 
  empty = false,
  emptyTitle = 'Nothing here yet',
  emptyDescription = '',
  emptyAction,
  onRetry 
}) {
  const { isOnline, isSlow } = useNetworkStatus()

  if (!isOnline) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
        <WifiOff className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Internet Connection</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Please check your connection and try again.</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium">
          Retry
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Something went wrong</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        {onRetry && (
          <button onClick={onRetry} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        )}
      </div>
    )
  }

  if (empty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
        <Inbox className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{emptyTitle}</h3>
        {emptyDescription && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{emptyDescription}</p>}
        {emptyAction}
      </div>
    )
  }

  return (
    <>
      {isSlow && (
        <div className="sticky top-0 z-50 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs text-center py-1.5 flex items-center justify-center gap-2">
          <Wifi className="w-3 h-3" /> Slow connection detected
        </div>
      )}
      {children}
    </>
  )
}