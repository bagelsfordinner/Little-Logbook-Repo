'use client'

import { useState } from 'react'
import Image from 'next/image'
import styles from './Avatar.module.css'

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps {
  src?: string
  alt: string
  size?: AvatarSize
  fallback?: string
  className?: string
  onClick?: () => void
}

export default function Avatar({ 
  src,
  alt,
  size = 'md',
  fallback,
  className,
  onClick
}: AvatarProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const showImage = src && !imageError
  const showFallback = !showImage

  // Generate initials from alt text if no fallback provided
  const getInitials = () => {
    if (fallback) return fallback
    
    return alt
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  const avatarClass = [
    styles.avatar,
    onClick && styles.interactive,
    className
  ].filter(Boolean).join(' ')

  const handleImageError = () => {
    setImageError(true)
    setImageLoaded(false)
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
    setImageError(false)
  }

  return (
    <div 
      className={avatarClass}
      data-size={size}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      } : undefined}
    >
      {showImage && (
        <Image
          src={src}
          alt={alt}
          className={styles.image}
          width={100}
          height={100}
          style={{ objectFit: 'cover' }}
          onError={handleImageError}
          onLoad={handleImageLoad}
          data-loaded={imageLoaded}
        />
      )}
      
      {showFallback && (
        <span className={styles.fallback} data-size={size}>
          {getInitials()}
        </span>
      )}
      
      {/* Loading state */}
      {src && !imageLoaded && !imageError && (
        <div className={styles.loading} data-size={size}>
          <div className={styles.skeleton} />
        </div>
      )}
    </div>
  )
}