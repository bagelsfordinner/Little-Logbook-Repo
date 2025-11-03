'use client'

import { LabelHTMLAttributes, ReactNode } from 'react'
import styles from './Label.module.css'

export type LabelSize = 'sm' | 'md' | 'lg'

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode
  required?: boolean
  size?: LabelSize
}

export default function Label({ 
  children, 
  required = false,
  size = 'md',
  className,
  ...props 
}: LabelProps) {
  const labelClass = [
    styles.label,
    className
  ].filter(Boolean).join(' ')

  return (
    <label 
      className={labelClass}
      data-size={size}
      {...props}
    >
      {children}
      {required && (
        <span className={styles.required} aria-label="required">
          *
        </span>
      )}
    </label>
  )
}