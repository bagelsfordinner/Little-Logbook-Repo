'use client'

import { forwardRef } from 'react'
import styles from './Switch.module.css'

export interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  size?: 'sm' | 'md' | 'lg'
  id?: string
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ checked, onChange, disabled = false, label, size = 'md', id }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.checked)
    }

    return (
      <label 
        className={`${styles.switch} ${styles[size]} ${disabled ? styles.disabled : ''}`}
        htmlFor={id}
      >
        <input
          ref={ref}
          type="checkbox"
          id={id}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className={styles.input}
          aria-label={label}
        />
        <span className={styles.slider}>
          <span className={styles.thumb} />
        </span>
        {label && <span className={styles.label}>{label}</span>}
      </label>
    )
  }
)

Switch.displayName = 'Switch'