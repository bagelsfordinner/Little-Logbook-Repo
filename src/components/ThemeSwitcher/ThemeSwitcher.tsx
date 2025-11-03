'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader } from '../atoms/Loader'
import styles from './ThemeSwitcher.module.css'

const THEMES = [
  { value: 'forest-light', label: 'Forest Light' },
  { value: 'forest-dark', label: 'Forest Dark' },
  { value: 'soft-pastels', label: 'Soft Pastels' },
] as const

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; SameSite=Lax`
}

export function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState('forest-light')
  const [isChanging, setIsChanging] = useState(false)
  const [pendingTheme, setPendingTheme] = useState<string | null>(null)

  useEffect(() => {
    // Get initial theme from cookie
    const savedTheme = getCookie('theme') || 'forest-light'
    setCurrentTheme(savedTheme)
  }, [])

  const handleThemeChange = async (newTheme: string) => {
    if (newTheme === currentTheme || isChanging) return
    
    setIsChanging(true)
    setPendingTheme(newTheme)
    
    // Add a small delay to show the loading state
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Set cookie
    setCookie('theme', newTheme)
    
    // Update DOM with smooth transition
    document.documentElement.style.transition = 'all 0.3s ease-in-out'
    document.documentElement.setAttribute('data-theme', newTheme)
    
    // Clean up transition after it completes
    setTimeout(() => {
      document.documentElement.style.transition = ''
    }, 300)
    
    // Update state
    setCurrentTheme(newTheme)
    setIsChanging(false)
    setPendingTheme(null)
  }

  return (
    <div className={styles.container}>
      <div className={styles.selectWrapper}>
        <select
          value={currentTheme}
          onChange={(e) => handleThemeChange(e.target.value)}
          className={`${styles.select} ${isChanging ? styles.loading : ''}`}
          disabled={isChanging}
        >
          {THEMES.map((theme) => (
            <option key={theme.value} value={theme.value}>
              {theme.label}
            </option>
          ))}
        </select>
        
        <AnimatePresence>
          {isChanging && (
            <motion.div
              className={styles.loadingIndicator}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Loader size="sm" variant="spinner" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {pendingTheme && (
        <motion.div
          className={styles.preview}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          Switching to {THEMES.find(t => t.value === pendingTheme)?.label}...
        </motion.div>
      )}
    </div>
  )
}