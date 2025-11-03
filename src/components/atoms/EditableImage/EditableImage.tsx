'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useEditMode } from '@/lib/contexts/EditModeContext'
import { Icon } from '@/components/atoms/Icon'
import styles from './EditableImage.module.css'

interface EditableImageProps {
  src: string
  alt: string
  onChange: (file: File) => Promise<void>
  className?: string
  canEdit?: boolean
  placeholder?: string
  aspectRatio?: 'square' | 'landscape' | 'portrait' | 'auto'
}

export function EditableImage({
  src,
  alt,
  onChange,
  className = '',
  canEdit = true,
  placeholder = '/placeholder-hero.jpg',
  aspectRatio = 'auto'
}: EditableImageProps) {
  const { isEditMode } = useEditMode()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showEditable = isEditMode && canEdit
  const imageSrc = src || placeholder

  const handleClick = () => {
    if (showEditable && !isLoading) {
      fileInputRef.current?.click()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await onChange(file)
    } catch (err) {
      console.error('Failed to upload image:', err)
      setError('Failed to upload image. Please try again.')
    } finally {
      setIsLoading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const containerClasses = [
    styles.container,
    styles[aspectRatio],
    showEditable && styles.editable,
    isLoading && styles.loading,
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={containerClasses}>
      <div
        className={styles.imageContainer}
        onClick={handleClick}
        role={showEditable ? 'button' : undefined}
        tabIndex={showEditable ? 0 : undefined}
      >
        <Image
          src={imageSrc}
          alt={alt}
          width={500}
          height={300}
          style={{ objectFit: 'cover' }}
          className={styles.image}
          onError={(e) => {
            (e.target as HTMLImageElement).src = placeholder
          }}
        />
        
        {showEditable && (
          <div className={styles.overlay}>
            <div className={styles.editContent}>
              {isLoading ? (
                <div className={styles.loadingSpinner}>
                  <Icon name="loader" size="lg" />
                  <span>Uploading...</span>
                </div>
              ) : (
                <div className={styles.editPrompt}>
                  <Icon name="camera" size="lg" />
                  <span>Click to change image</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className={styles.error}>
          <Icon name="alert-circle" size="sm" />
          <span>{error}</span>
          <button 
            onClick={() => setError(null)} 
            className={styles.closeError}
          >
            <Icon name="x" size="sm" />
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className={styles.hiddenInput}
      />
    </div>
  )
}