'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Icon } from '@/components/atoms/Icon'
import { GalleryDisplaySettings } from '../GalleryContentUniversal'
import type { GalleryImage } from '@/app/actions/galleryImages'
import { CardMode } from './GalleryGrid'
import styles from './ImageCard.module.css'

interface ImageCardProps {
  image: GalleryImage
  index: number
  settings: GalleryDisplaySettings
  mode: CardMode
  isSelected: boolean
  onImageClick: (index: number) => void
  onImageSelect: (imageId: string, selected: boolean) => void
  onImageDelete: (imageId: string) => void
  isEditMode: boolean
}

export function ImageCard({
  image,
  index,
  settings,
  mode,
  isSelected,
  onImageClick,
  onImageSelect,
  onImageDelete,
  isEditMode
}: ImageCardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleImageLoad = () => {
    setIsLoading(false)
  }

  const handleImageError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  const handleCardClick = () => {
    if (mode === CardMode.SELECT) {
      onImageSelect(image.id, !isSelected)
    } else if (mode === CardMode.DELETE) {
      // Don't open lightbox in delete mode
      return
    } else {
      onImageClick(index)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to delete this image?')) {
      onImageDelete(image.id)
    }
  }

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onImageSelect(image.id, !isSelected)
  }

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

  const canDelete = true // TODO: Check if user can delete this specific image

  return (
    <div 
      className={`${styles.card} ${isSelected ? styles.cardSelected : ''} ${mode === CardMode.SELECT ? styles.cardSelectable : ''}`}
      onClick={handleCardClick}
    >
      {/* Image Container */}
      <div className={styles.imageContainer}>
        {isLoading && (
          <div className={styles.imagePlaceholder}>
            <Icon name="loader" size="lg" />
          </div>
        )}
        
        {hasError ? (
          <div className={styles.imageError}>
            <Icon name="alert-circle" size="lg" />
            <span>Failed to load image</span>
          </div>
        ) : (
          <Image
            src={image.thumbnail_url || image.file_url}
            alt={image.caption || `Gallery image ${index + 1}`}
            className={styles.image}
            onLoad={handleImageLoad}
            width={300}
            height={200}
            style={{ objectFit: 'cover' }}
            onError={handleImageError}
            loading="lazy"
          />
        )}

        {/* Overlay Controls */}
        <div className={styles.overlay}>
          {/* Selection Checkbox */}
          {mode === CardMode.SELECT && (
            <button
              className={styles.selectButton}
              onClick={handleSelectClick}
              aria-label={isSelected ? 'Deselect image' : 'Select image'}
            >
              <Icon 
                name={isSelected ? 'check-circle' : 'circle'} 
                size="md" 
              />
            </button>
          )}

          {/* Delete Button */}
          {mode === CardMode.DELETE && canDelete && (
            <button
              className={styles.deleteButton}
              onClick={handleDeleteClick}
              aria-label="Delete image"
            >
              <Icon name="trash" size="md" />
            </button>
          )}

          {/* View Mode Controls */}
          {mode === CardMode.VIEW && isEditMode && (
            <div className={styles.viewControls}>
              <button
                className={styles.controlButton}
                onClick={handleSelectClick}
                aria-label="Select image"
              >
                <Icon name="check-square" size="sm" />
              </button>
              {canDelete && (
                <button
                  className={styles.controlButton}
                  onClick={handleDeleteClick}
                  aria-label="Delete image"
                >
                  <Icon name="trash" size="sm" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <div className={styles.selectionIndicator}>
            <Icon name="check-circle" size="lg" />
          </div>
        )}
      </div>

      {/* Image Info */}
      {(settings.show_dates || settings.show_captions || settings.show_uploaders) && (
        <div className={styles.imageInfo}>
          {settings.show_captions && image.caption && (
            <p className={styles.caption}>{image.caption}</p>
          )}
          
          <div className={styles.metadata}>
            {settings.show_dates && image.upload_date && (
              <span className={styles.date}>
                {formatUploadDate(image.upload_date)}
              </span>
            )}
            
            {settings.show_uploaders && image.uploader_name && (
              <span className={styles.uploader}>
                by {image.uploader_name}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}