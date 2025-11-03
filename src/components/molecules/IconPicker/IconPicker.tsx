'use client'

import { useState } from 'react'
import { Icon, type IconName } from '@/components/atoms/Icon'
import styles from './IconPicker.module.css'

export interface IconPickerProps {
  value?: IconName
  onChange: (iconName: IconName) => void
  className?: string
  disabled?: boolean
  asClickable?: boolean
}

// Available icons for picking - can be extended
const availableIcons: IconName[] = [
  'heart',
  'star',
  'home',
  'user',
  'users',
  'camera',
  'image',
  'video',
  'calendar',
  'clock',
  'bell',
  'mail',
  'phone',
  'archive',
  'circle',
  'check-circle',
  'square',
  'check-square',
  'plus-circle',
  'search',
  'settings',
  'filter',
  'grid',
  'list',
  'share',
  'copy',
  'external-link',
  'download',
  'upload',
  'edit',
  'trash',
  'eye',
  'lock'
]

export function IconPicker({ value, onChange, disabled }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleIconSelect = (iconName: IconName) => {
    onChange(iconName)
    setIsOpen(false)
  }

  // Always render as clickable mode (this is the modern usage)
  return (
    <>
      {disabled ? (
        // Non-edit mode: static square with icon
        <div className={styles.iconDisplay}>
          <Icon name={value || 'circle'} size="sm" />
        </div>
      ) : (
        // Edit mode: clickable square with icon
        <button
          type="button"
          className={styles.clickableIcon}
          onClick={() => setIsOpen(true)}
          aria-label="Select icon"
        >
          <Icon name={value || 'circle'} size="sm" />
        </button>
      )}

      {/* Modal for icon selection */}
      {isOpen && !disabled && (
        <>
          <div className={styles.modalOverlay} onClick={() => setIsOpen(false)} />
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Choose Icon</h3>
              <button
                className={styles.modalClose}
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                <Icon name="x" size="sm" />
              </button>
            </div>
            <div className={styles.modalGrid}>
              {availableIcons.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  className={`${styles.modalIconOption} ${value === iconName ? styles.modalSelected : ''}`}
                  onClick={() => handleIconSelect(iconName)}
                  title={iconName}
                >
                  <Icon name={iconName} size="md" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}