'use client'

import { ReactNode } from 'react'
import styles from './Badge.module.css'

export type BadgeVariant = 'parent' | 'family' | 'friend' | 'admin' | 'default'
export type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps {
  variant?: BadgeVariant
  size?: BadgeSize
  children: ReactNode
  className?: string
}

export default function Badge({ 
  variant = 'default',
  size = 'md',
  children,
  className 
}: BadgeProps) {
  const badgeClass = [
    styles.badge,
    className
  ].filter(Boolean).join(' ')

  return (
    <span 
      className={badgeClass}
      data-variant={variant}
      data-size={size}
    >
      {children}
    </span>
  )
}