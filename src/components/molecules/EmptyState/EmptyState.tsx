'use client'

import { Button } from '../../atoms/Button'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
  icon?: string
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export default function EmptyState({
  icon = '📷',
  title,
  description,
  actionLabel,
  onAction,
  className
}: EmptyStateProps) {
  const containerClass = [
    styles.container,
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={containerClass}>
      <div className={styles.icon}>{icon}</div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {actionLabel && onAction && (
        <Button
          variant="primary"
          onClick={onAction}
          className={styles.action}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}