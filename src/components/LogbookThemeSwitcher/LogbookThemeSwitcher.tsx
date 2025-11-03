'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader } from '../atoms/Loader'
import { updateLogbookTheme, getLogbookTheme } from '@/app/actions/theme'
import styles from '../ThemeSwitcher/ThemeSwitcher.module.css'

const THEMES = [
  { value: 'forest-light', label: 'Forest Light' },
  { value: 'forest-dark', label: 'Forest Dark' },
  { value: 'soft-pastels', label: 'Soft Pastels' },
] as const

interface LogbookThemeSwitcherProps {
  logbookId: string
  userRole: 'parent' | 'family' | 'friend'
  initialTheme?: string
}

export function LogbookThemeSwitcher({ 
  logbookId, 
  userRole, 
  initialTheme = 'forest-light' 
}: LogbookThemeSwitcherProps) {
  const [currentTheme, setCurrentTheme] = useState(initialTheme)
  const [isChanging, setIsChanging] = useState(false)
  const [pendingTheme, setPendingTheme] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Only parents can change themes
  const canChangeTheme = userRole === 'parent'

  const loadLogbookTheme = useCallback(async () => {
    try {
      const result = await getLogbookTheme(logbookId)
      if (result.success && result.theme) {
        setCurrentTheme(result.theme)
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', result.theme)
      }
    } catch (error) {
      console.error('Failed to load logbook theme:', error)
    } finally {
      setIsLoading(false)
    }
  }, [logbookId])

  useEffect(() => {
    loadLogbookTheme()
  }, [loadLogbookTheme])

  const handleThemeChange = async (newTheme: string) => {
    if (newTheme === currentTheme || isChanging || !canChangeTheme) return
    
    setIsChanging(true)
    setPendingTheme(newTheme)
    
    try {
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Update theme in database
      const result = await updateLogbookTheme(
        logbookId, 
        newTheme as 'forest-light' | 'forest-dark' | 'soft-pastels'
      )
      
      if (result.success) {
        // Update DOM with smooth transition
        document.documentElement.style.transition = 'all 0.3s ease-in-out'
        document.documentElement.setAttribute('data-theme', newTheme)
        
        // Clean up transition after it completes
        setTimeout(() => {
          document.documentElement.style.transition = ''
        }, 300)
        
        // Update state
        setCurrentTheme(newTheme)
      } else {
        alert(result.error || 'Failed to update theme')
      }
    } catch (error) {
      console.error('Failed to update theme:', error)
      alert('Failed to update theme')
    } finally {
      setIsChanging(false)
      setPendingTheme(null)
    }
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.selectWrapper}>
          <Loader size="sm" variant="spinner" />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.selectWrapper}>
        <select
          value={currentTheme}
          onChange={(e) => handleThemeChange(e.target.value)}
          className={`${styles.select} ${isChanging ? styles.loading : ''}`}
          disabled={isChanging || !canChangeTheme}
          title={!canChangeTheme ? 'Only logbook parents can change the theme' : 'Change logbook theme'}
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

      {!canChangeTheme && (
        <p style={{ 
          fontSize: '0.8rem', 
          color: 'var(--text-secondary)', 
          marginTop: 'var(--spacing-xs)',
          fontStyle: 'italic'
        }}>
          Theme set by logbook parent
        </p>
      )}
    </div>
  )
}