'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Skeleton } from '../Skeleton/Skeleton'
import styles from './ProgressiveImage.module.css'

interface ProgressiveImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  placeholder?: 'blur' | 'skeleton'
  blurDataURL?: string
  sizes?: string
  fill?: boolean
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  onLoadComplete?: () => void
  onError?: () => void
}

export default function ProgressiveImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  placeholder = 'skeleton',
  blurDataURL,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  fill = false,
  objectFit = 'cover',
  onLoadComplete,
  onError
}: ProgressiveImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    )

    const currentRef = imgRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      observer.disconnect()
    }
  }, [priority])

  const handleLoadComplete = () => {
    setIsLoading(false)
    onLoadComplete?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }

  const containerClass = [
    styles.container,
    fill && styles.fill,
    className
  ].filter(Boolean).join(' ')

  return (
    <div ref={imgRef} className={containerClass}>
      <AnimatePresence mode="wait">
        {!isVisible ? (
          // Placeholder before intersection
          <motion.div
            key="placeholder"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.placeholder}
            style={{
              width: fill ? '100%' : width,
              height: fill ? '100%' : height,
            }}
          >
            <Skeleton 
              variant="image" 
              width="100%" 
              height="100%" 
            />
          </motion.div>
        ) : hasError ? (
          // Error state
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={styles.error}
            style={{
              width: fill ? '100%' : width,
              height: fill ? '100%' : height,
            }}
          >
            <div className={styles.errorContent}>
              <span className={styles.errorIcon}>📷</span>
              <span className={styles.errorText}>Failed to load</span>
            </div>
          </motion.div>
        ) : (
          // Image container
          <motion.div
            key="image"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={styles.imageContainer}
          >
            {/* Loading skeleton overlay */}
            <AnimatePresence>
              {isLoading && placeholder === 'skeleton' && (
                <motion.div
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={styles.loadingSkeleton}
                >
                  <Skeleton 
                    variant="image" 
                    width="100%" 
                    height="100%" 
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actual image */}
            <Image
              src={src}
              alt={alt}
              width={fill ? undefined : width}
              height={fill ? undefined : height}
              fill={fill}
              sizes={sizes}
              priority={priority}
              placeholder={placeholder === 'blur' && blurDataURL ? 'blur' : 'empty'}
              blurDataURL={blurDataURL}
              onLoadingComplete={handleLoadComplete}
              onError={handleError}
              style={{ 
                objectFit: objectFit,
                transition: 'opacity 0.3s ease'
              }}
              className={styles.image}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export { ProgressiveImage }