'use client'

import { useState } from 'react'
import { Switch } from '@/components/atoms/Switch'
import { Loader } from '@/components/atoms/Loader'
import styles from './SectionToggle.module.css'

export interface SectionToggleProps {
  sectionKey: string
  label: string
  visible: boolean
  onToggle: (visible: boolean) => void
  disabled?: boolean
  description?: string
}

export function SectionToggle({
  sectionKey,
  label,
  visible,
  onToggle,
  disabled = false,
  description
}: SectionToggleProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async (checked: boolean) => {
    if (disabled || isLoading) return

    setIsLoading(true)
    try {
      await onToggle(checked)
    } catch (error) {
      console.error('Error toggling section visibility:', error)
      // Note: In a real app, you'd want to show a toast notification here
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.main}>
        <div className={styles.labelContainer}>
          <label className={styles.label} htmlFor={`toggle-${sectionKey}`}>
            {label}
          </label>
          {description && (
            <p className={styles.description}>{description}</p>
          )}
        </div>
        
        <div className={styles.controls}>
          {isLoading && (
            <div className={styles.loader}>
              <Loader size="sm" />
            </div>
          )}
          <Switch
            id={`toggle-${sectionKey}`}
            checked={visible}
            onChange={handleToggle}
            disabled={disabled || isLoading}
            size="md"
          />
        </div>
      </div>
    </div>
  )
}