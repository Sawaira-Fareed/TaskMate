import { Moon, Sun } from 'lucide-react'
import { useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(
    document.documentElement.classList.contains('dark')
  )

  const toggle = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('zaria-theme', 'light')
      setDark(false)
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('zaria-theme', 'dark')
      setDark(true)
    }
  }

  return (
    <button onClick={toggle} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
      {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-500" />}
    </button>
  )
}