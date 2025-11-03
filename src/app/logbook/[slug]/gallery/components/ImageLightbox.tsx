'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { Icon } from '@/components/atoms/Icon'
import { GalleryDisplaySettings } from '../GalleryContentUniversal'
import type { GalleryImage } from '@/app/actions/galleryImages'
import styles from './ImageLightbox.module.css'

interface ImageLightboxProps {
  images: GalleryImage[]
  currentIndex: number
  onClose: () => void
  onNavigate: (direction: 'prev' | 'next') => void
  settings: GalleryDisplaySettings
}

export function ImageLightbox({
  images,
  currentIndex,
  onClose,
  onNavigate,
  settings
}: ImageLightboxProps) {
  const currentImage = images[currentIndex]

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          onNavigate('prev')
          break
        case 'ArrowRight':
          onNavigate('next')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onNavigate])

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const formatUploadDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      // Use a consistent format to avoid hydration mismatches
      return new Intl.DateTimeFormat('en-US', { 
        year: 'numeric', 
        month: 'long',
        timeZone: 'UTC'
      }).format(date)
    } catch {
      return 'Unknown date'
    }
  }

  if (!currentImage) return null

  return (
    <div className={styles.lightbox}>
      {/* Background Overlay */}
      <div 
        className={styles.overlay} 
        onClick={onClose}
        aria-label="Close lightbox"
      />

      {/* Close Button */}
      <button
        className={styles.closeButton}
        onClick={onClose}
        aria-label="Close lightbox"
      >
        <Icon name="x" size="lg" />
      </button>

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <button
            className={`${styles.navButton} ${styles.navButtonPrev}`}
            onClick={() => onNavigate('prev')}
            aria-label="Previous image"
          >
            <Icon name="chevron-left" size="lg" />
          </button>
          
          <button
            className={`${styles.navButton} ${styles.navButtonNext}`}
            onClick={() => onNavigate('next')}
            aria-label="Next image"
          >
            <Icon name="chevron-right" size="lg" />
          </button>
        </>
      )}

      {/* Main Content */}
      <div className={styles.content}>
        {/* Image Container */}
        <div className={styles.imageContainer}>
          <Image
            src={currentImage.file_url}
            alt={currentImage.caption || `Gallery image ${currentIndex + 1}`}
            className={styles.image}
            width={800}
            height={600}
            style={{ objectFit: 'contain' }}
          />
        </div>

        {/* Image Info */}
        {settings.display_mode === 'enhanced' && (
          <div className={styles.imageInfo}>
            {settings.show_captions && currentImage.caption && (
              <h2 className={styles.caption}>{currentImage.caption}</h2>
            )}
            
            <div className={styles.metadata}>
              {settings.show_dates && currentImage.upload_date && (
                <span className={styles.date}>
                  {formatUploadDate(currentImage.upload_date)}
                </span>
              )}
              
              {settings.show_uploaders && currentImage.uploader_name && (
                <span className={styles.uploader}>
                  Uploaded by {currentImage.uploader_name}
                </span>
              )}
              
              <span className={styles.counter}>
                {currentIndex + 1} of {images.length}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}