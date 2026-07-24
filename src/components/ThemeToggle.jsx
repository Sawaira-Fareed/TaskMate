import { Moon, Sun } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('zaria-theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('zaria-theme', dark ? 'dark' : 'light')
  }, [dark])

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => {
      const saved = localStorage.getItem('zaria-theme')
      if (!saved) setDark(e.matches)
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const toggle = () => setDark(prev => !prev)

  return (
    <button onClick={toggle} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
      <div className="relative w-4 h-4">
        <Sun className={`w-4 h-4 text-amber-400 absolute inset-0 transition-all duration-300 ${dark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-0'}`} />
        <Moon className={`w-4 h-4 text-gray-500 absolute inset-0 transition-all duration-300 ${dark ? 'opacity-0 -rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`} />
      </div>
    </button>
  )
}