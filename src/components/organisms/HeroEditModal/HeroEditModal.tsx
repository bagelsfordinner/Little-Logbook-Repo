'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/atoms/Button'
import { FormField } from '@/components/molecules/FormField'
import { Loader } from '@/components/atoms/Loader'
import { Icon } from '@/components/atoms/Icon'
import { updateHeroImage, updateHeroText } from '@/app/actions/logbook'
import styles from './HeroEditModal.module.css'

interface HeroEditModalProps {
  isOpen: boolean
  onClose: () => void
  logbookId: string
  currentTitle?: string
  currentSubtitle?: string
  currentImageUrl?: string
  onSuccess?: () => void
}

export function HeroEditModal({
  isOpen,
  onClose,
  logbookId,
  currentTitle = '',
  currentSubtitle = '',
  currentImageUrl = '',
  onSuccess
}: HeroEditModalProps) {
  const [activeTab, setActiveTab] = useState<'image' | 'text'>('image')
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [title, setTitle] = useState(currentTitle)
  const [subtitle, setSubtitle] = useState(currentSubtitle)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      const result = await updateHeroImage(logbookId, file)
      
      if (result.success) {
        onSuccess?.()
        onClose()
      } else {
        setError(result.error || 'Failed to upload image')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsUploading(false)
    }
  }

  const handleTextSave = async () => {
    setIsSaving(true)
    setError('')

    try {
      const result = await updateHeroText(logbookId, title, subtitle)
      
      if (result.success) {
        onSuccess?.()
        onClose()
      } else {
        setError(result.error || 'Failed to save text')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (!isUploading && !isSaving) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className={styles.modal}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.header}>
            <h2 className={styles.title}>Edit Hero Section</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isUploading || isSaving}
            >
              <Icon name="x" size="sm" />
            </Button>
          </div>

          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'image' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('image')}
              disabled={isUploading || isSaving}
            >
              <Icon name="image" size="sm" />
              Image
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'text' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('text')}
              disabled={isUploading || isSaving}
            >
              <Icon name="edit" size="sm" />
              Text
            </button>
          </div>

          <div className={styles.content}>
            {error && (
              <div className={styles.error}>
                <Icon name="alert-circle" size="sm" />
                {error}
              </div>
            )}

            {activeTab === 'image' && (
              <div className={styles.imageTab}>
                {currentImageUrl && (
                  <div className={styles.currentImage}>
                    <Image 
                      src={currentImageUrl} 
                      alt="Current hero" 
                      width={400}
                      height={250}
                      style={{ objectFit: 'cover' }}
                    />
                    <span className={styles.imageLabel}>Current Image</span>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className={styles.hiddenInput}
                />

                <Button
                  variant="primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  fullWidth
                >
                  {isUploading ? (
                    <>
                      <Loader size="sm" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Icon name="upload" size="sm" />
                      Upload New Image
                    </>
                  )}
                </Button>

                <p className={styles.imageHelp}>
                  Upload a high-quality image (max 10MB). JPEG, PNG, and WebP formats supported.
                </p>
              </div>
            )}

            {activeTab === 'text' && (
              <div className={styles.textTab}>
                <FormField
                  label="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Welcome to Our Journey"
                  disabled={isSaving}
                />

                <FormField
                  label="Subtitle"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Following our adventure"
                  disabled={isSaving}
                />

                <div className={styles.textActions}>
                  <Button
                    variant="secondary"
                    onClick={handleClose}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleTextSave}
                    disabled={isSaving || (!title.trim() && !subtitle.trim())}
                  >
                    {isSaving ? (
                      <>
                        <Loader size="sm" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}