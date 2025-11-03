'use client'

import { useState } from 'react'
import { MediaCard } from '@/components/molecules/MediaCard'
import { GalleryDisplaySettings } from '../GalleryContentUniversal'
import type { GalleryImage } from '@/app/actions/galleryImages'
import { downloadAsZip, generateBulkDownloadFilename, DownloadableImage } from '@/lib/utils/downloadUtils'
import { DynamicDeleteConfirmModal } from '@/lib/utils/dynamicImports'
import styles from './GalleryGrid.module.css'

export enum CardMode {
  VIEW = 'view',
  SELECT = 'select',
  DELETE = 'delete'
}

interface GalleryGridProps {
  images: GalleryImage[]
  settings: GalleryDisplaySettings
  onImageClick: (index: number) => void
  onImageDelete: (imageId: string) => void
  isEditMode: boolean
  logbookName: string
}

export function GalleryGrid({ 
  images, 
  settings, 
  onImageClick, 
  onImageDelete, 
  isEditMode,
  logbookName
}: GalleryGridProps) {
  const [cardMode, setCardMode] = useState<CardMode>(CardMode.VIEW)
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteType, setDeleteType] = useState<'single' | 'bulk'>('bulk')
  const [singleDeleteId, setSingleDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleImageSelect = (imageId: string, selected: boolean) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(imageId)
      } else {
        newSet.delete(imageId)
      }
      return newSet
    })
  }

  const handleBulkDownload = async () => {
    if (selectedImages.size === 0) return
    
    try {
      console.log('📦 [BULK DOWNLOAD] Starting download of', selectedImages.size, 'images')
      
      // Get the selected images
      const selectedImageData = images.filter(img => selectedImages.has(img.id))
      const downloadableImages: DownloadableImage[] = selectedImageData.map(img => ({
        id: img.id,
        file_url: img.file_url,
        original_filename: img.original_filename
      }))
      
      // Generate filename
      const filename = generateBulkDownloadFilename(
        logbookName,
        'User', // TODO: Get actual user name
        selectedImages.size
      )
      
      // Download as zip
      await downloadAsZip(downloadableImages, filename)
      
      console.log('✅ [BULK DOWNLOAD] Download completed successfully')
      
    } catch (error) {
      console.error('❌ [BULK DOWNLOAD] Download failed:', error)
      // TODO: Show error toast to user
    }
  }

  const handleBulkDelete = () => {
    if (selectedImages.size === 0) return
    setDeleteType('bulk')
    setShowDeleteModal(true)
  }

  const handleSingleDelete = (imageId: string) => {
    setSingleDeleteId(imageId)
    setDeleteType('single')
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    
    try {
      if (deleteType === 'single' && singleDeleteId) {
        await onImageDelete(singleDeleteId)
      } else if (deleteType === 'bulk') {
        // TODO: Check permissions and only delete images user owns
        for (const imageId of selectedImages) {
          await onImageDelete(imageId)
        }
        setSelectedImages(new Set())
      }
      
      setShowDeleteModal(false)
      setSingleDeleteId(null)
      
    } catch (error) {
      console.error('Delete failed:', error)
      // TODO: Show error toast
    } finally {
      setIsDeleting(false)
    }
  }

  const clearSelection = () => {
    setSelectedImages(new Set())
    setCardMode(CardMode.VIEW)
  }

  const handleCaptionUpdate = async (imageId: string, caption: string) => {
    try {
      // TODO: Implement caption update API call
      console.log('Updating caption for image:', imageId, 'to:', caption)
      // Update local state temporarily
      // setImages(prev => prev.map(img => 
      //   img.id === imageId ? { ...img, caption } : img
      // ))
    } catch (error) {
      console.error('Failed to update caption:', error)
    }
  }

  if (images.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyContent}>
          <h2 className={styles.emptyTitle}>No photos yet</h2>
          <p className={styles.emptyDescription}>
            Upload your first photos to get started building your family gallery.
          </p>
        </div>
      </div>
    )
  }

  // Calculate permission counts for bulk delete
  const selectedImageData = images.filter(img => selectedImages.has(img.id))
  const ownedSelectedImages = selectedImageData.filter(img => img.uploader_id === 'current_user_id') // TODO: Get actual current user ID
  const notOwnedSelectedImages = selectedImageData.filter(img => img.uploader_id !== 'current_user_id') // TODO: Get actual current user ID
  
  const getDeleteModalProps = () => {
    if (deleteType === 'single') {
      return {
        imageCount: 1,
        ownedCount: 1, // TODO: Check if user owns this specific image
        notOwnedCount: 0
      }
    } else {
      return {
        imageCount: selectedImages.size,
        ownedCount: ownedSelectedImages.length,
        notOwnedCount: notOwnedSelectedImages.length
      }
    }
  }

  return (
    <div className={styles.container}>
      {/* Bulk Action Controls */}
      {selectedImages.size > 0 && (
        <div className={styles.bulkControls}>
          <div className={styles.bulkInfo}>
            <span className={styles.selectionCount}>
              {selectedImages.size} image{selectedImages.size !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className={styles.bulkActions}>
            <button
              className={styles.bulkButton}
              onClick={handleBulkDownload}
              disabled={selectedImages.size === 0}
            >
              Download Selected
            </button>
            <button
              className={`${styles.bulkButton} ${styles.bulkButtonDanger}`}
              onClick={handleBulkDelete}
              disabled={selectedImages.size === 0}
            >
              Delete Selected
            </button>
            <button
              className={styles.bulkButtonSecondary}
              onClick={clearSelection}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Mode Controls */}
      {isEditMode && (
        <div className={styles.modeControls}>
          <div className={styles.modeButtons}>
            <button
              className={`${styles.modeButton} ${cardMode === CardMode.VIEW ? styles.modeButtonActive : ''}`}
              onClick={() => setCardMode(CardMode.VIEW)}
            >
              View
            </button>
            <button
              className={`${styles.modeButton} ${cardMode === CardMode.SELECT ? styles.modeButtonActive : ''}`}
              onClick={() => setCardMode(CardMode.SELECT)}
            >
              Select
            </button>
            <button
              className={`${styles.modeButton} ${cardMode === CardMode.DELETE ? styles.modeButtonActive : ''}`}
              onClick={() => setCardMode(CardMode.DELETE)}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Image Grid */}
      <div className={styles.grid}>
        {images.map((image, index) => (
          <div 
            key={image.id} 
            className={styles.mediaCardWrapper}
          >
            <MediaCard
              mediaUrl={image.thumbnail_url || image.file_url}
              caption={settings.show_captions ? image.caption || undefined : undefined}
              mediaType="image"
              isOwner={true} // TODO: Check actual ownership based on user permissions
              onDelete={() => handleSingleDelete(image.id)}
              onImageClick={() => onImageClick(index)}
              onSelect={() => handleImageSelect(image.id, !selectedImages.has(image.id))}
              isSelected={selectedImages.has(image.id)}
            />
            
            {/* Metadata overlay for settings */}
            {(settings.show_dates || settings.show_uploaders) && (
              <div className={styles.metadata}>
                {settings.show_dates && image.upload_date && (
                  <span className={styles.date}>
                    {new Intl.DateTimeFormat('en-US', { 
                      year: 'numeric', 
                      month: 'long',
                      timeZone: 'UTC'
                    }).format(new Date(image.upload_date))}
                  </span>
                )}
                
                {settings.show_uploaders && image.uploader_name && (
                  <span className={styles.uploader}>
                    by {image.uploader_name}
                  </span>
                )}
              </div>
            )}
            
            {/* Caption Input - appears when captions are enabled and not in edit mode */}
            {settings.show_captions && !isEditMode && (
              <div className={styles.captionInput}>
                <input
                  type="text"
                  placeholder="Add a caption..."
                  defaultValue={image.caption || ''}
                  className={styles.captionField}
                  onBlur={(e) => handleCaptionUpdate(image.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur()
                    }
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Delete Confirmation Modal */}
      <DynamicDeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSingleDeleteId(null)
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        {...getDeleteModalProps()}
      />
    </div>
  )
}