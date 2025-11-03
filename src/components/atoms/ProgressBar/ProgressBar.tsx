'use client'

import { forwardRef } from 'react'
import styles from './ProgressBar.module.css'

export interface ProgressBarProps {
  value: number
  max: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showLabel?: boolean
  label?: string
}

const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(({
  value,
  max,
  size = 'md',
  className,
  showLabel = false,
  label,
  ...props
}, ref) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  
  const progressClass = [
    styles.progressBar,
    styles[size],
    className
  ].filter(Boolean).join(' ')

  return (
    <div ref={ref} className={styles.container} {...props}>
      <div className={progressClass}>
        <div 
          className={styles.progressFill}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className={styles.label}>
          {label || `${value}/${max}`}
        </div>
      )}
    </div>
  )
})

ProgressBar.displayName = 'ProgressBar'

export default ProgressBar