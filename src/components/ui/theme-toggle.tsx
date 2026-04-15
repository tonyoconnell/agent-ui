import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ThemeToggleProps {
  variant?: 'floating' | 'inline'
  size?: 'sm' | 'md' | 'lg'
}

export function ThemeToggle({ variant = 'floating', size = 'md' }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check initial theme
    const theme = localStorage.getItem('theme') || 'light'
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialDark = theme === 'dark' || (theme === 'system' && prefersDark)

    setIsDark(initialDark)
    if (initialDark) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)

    if (newIsDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  // Size configurations
  const sizeClasses = {
    sm: { button: 'h-10 px-4 gap-2', icon: 'w-4 h-4', text: 'text-sm' },
    md: { button: 'h-12 px-6 gap-3', icon: 'w-5 h-5', text: 'text-base' },
    lg: { button: 'h-16 px-8 gap-4', icon: 'w-7 h-7', text: 'text-lg' },
  }

  const currentSize = sizeClasses[size]

  // Floating variant (original)
  if (variant === 'floating') {
    return (
      <button
        onClick={toggleTheme}
        className="fixed bottom-6 left-6 z-50 p-4 rounded-full bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 shadow-lg hover:scale-110 transition-all duration-300 group"
        aria-label="Toggle theme"
      >
        <div className="relative w-6 h-6">
          <Sun
            className={`absolute inset-0 w-6 h-6 text-yellow-500 transition-all duration-300 ${
              isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
            }`}
          />
          <Moon
            className={`absolute inset-0 w-6 h-6 text-blue-600 transition-all duration-300 ${
              isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
            }`}
          />
        </div>
        <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-black dark:bg-white text-white dark:text-black text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
          {isDark ? 'Light mode' : 'Dark mode'}
        </span>
      </button>
    )
  }

  // Inline variant (new - larger buttons side by side)
  return (
    <div className="flex items-center gap-3 p-1 rounded-lg bg-card border shadow-md">
      {/* Light Mode Button */}
      <button
        onClick={() => {
          if (isDark) toggleTheme()
        }}
        className={`${currentSize.button} ${currentSize.text} flex items-center rounded-md font-semibold transition-all ${
          !isDark
            ? 'bg-background text-foreground shadow-lg'
            : 'bg-transparent text-muted-foreground hover:text-foreground'
        }`}
        aria-label="Light mode"
      >
        <Sun className={currentSize.icon} />
        <span>Light</span>
      </button>

      {/* Dark Mode Button */}
      <button
        onClick={() => {
          if (!isDark) toggleTheme()
        }}
        className={`${currentSize.button} ${currentSize.text} flex items-center rounded-md font-semibold transition-all ${
          isDark
            ? 'bg-background text-foreground shadow-lg'
            : 'bg-transparent text-muted-foreground hover:text-foreground'
        }`}
        aria-label="Dark mode"
      >
        <Moon className={currentSize.icon} />
        <span>Dark</span>
      </button>
    </div>
  )
}
