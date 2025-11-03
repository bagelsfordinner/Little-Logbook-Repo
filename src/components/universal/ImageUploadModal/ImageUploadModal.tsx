'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from '@/components/atoms/Icon'
import { Loader } from '@/components/atoms/Loader'
import { useContent } from '@/lib/contexts/ContentContext'
import { uploadAndUpdateContent } from '@/app/actions/universal-content'
import styles from './ImageUploadModal.module.css'

interface ImageUploadModalProps {
  isOpen: boolean
  onClose: () => void
  path: string
  title?: string
}

export function ImageUploadModal({ 
  isOpen, 
  onClose, 
  path, 
  title = 'Upload Image' 
}: ImageUploadModalProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { logbookSlug, pageType } = useContent()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const result = await uploadAndUpdateContent(logbookSlug, pageType, path, file)
      
      if (result.success) {
        onClose()
      } else {
        setError(result.error || 'Upload failed')
      }
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            className={styles.modal}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className={styles.header}>
              <h3 className={styles.title}>{title}</h3>
              <button
                onClick={onClose}
                className={styles.closeButton}
                type="button"
              >
                <Icon name="x" />
              </button>
            </div>

            <div className={styles.content}>
              {uploading ? (
                <div className={styles.uploading}>
                  <Loader size="lg" />
                  <p>Uploading image...</p>
                </div>
              ) : (
                <>
                  <div
                    className={`${styles.dropZone} ${dragActive ? styles.dragActive : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={handleClick}
                  >
                    <Icon name="camera" size="lg" />
                    <p className={styles.dropText}>
                      Drag and drop an image here, or click to select
                    </p>
                    <p className={styles.dropSubtext}>
                      Supports JPG, PNG, GIF up to 5MB
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className={styles.hiddenInput}
                  />

                  {error && (
                    <div className={styles.error}>
                      <Icon name="alert-circle" />
                      <span>{error}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}