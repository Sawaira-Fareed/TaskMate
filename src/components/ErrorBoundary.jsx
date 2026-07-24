import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">An unexpected error occurred. Please try again.</p>
            <button onClick={() => window.location.reload()} className="inline-flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors">
              <RefreshCw className="w-4 h-4" /> Reload Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}