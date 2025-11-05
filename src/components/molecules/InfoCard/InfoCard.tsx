'use client'

import { Icon, IconName } from '../../atoms/Icon'
import styles from './InfoCard.module.css'

export type InfoCardVariant = 'default' | 'accent' | 'muted' | 'inverted'

interface InfoCardProps {
  icon: IconName
  title: string
  description: string
  variant?: InfoCardVariant
  onClick?: () => void
  className?: string
}

export default function InfoCard({
  icon,
  title,
  description,
  variant = 'default',
  onClick,
  className
}: InfoCardProps) {
  const isClickable = Boolean(onClick)

  const cardClass = [
    styles.card,
    styles[variant],
    isClickable && styles.clickable,
    className
  ].filter(Boolean).join(' ')

  const iconWrapperClass = [
    styles.iconWrapper,
    styles[variant]
  ].filter(Boolean).join(' ')

  const handleClick = () => {
    if (onClick) {
      onClick()
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      onClick()
    }
  }

  return (
    <div 
      className={cardClass}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
      aria-label={isClickable ? `${title}: ${description}` : undefined}
    >
      <div className={iconWrapperClass}>
        <Icon name={icon} size="md" />
      </div>
      
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
      </div>
    </div>
  )
}