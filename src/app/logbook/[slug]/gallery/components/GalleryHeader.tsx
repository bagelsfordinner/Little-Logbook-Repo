'use client'

import { useRef } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { GalleryDisplaySettings } from '../GalleryContentUniversal'
import type { GalleryImage } from '@/app/actions/galleryImages'
import styles from './GalleryHeader.module.css'

interface GalleryHeaderProps {
  onUploadComplete: (images: GalleryImage[]) => void
  settings: GalleryDisplaySettings
  onSettingsUpdate: (settings: Partial<GalleryDisplaySettings>) => void
  isEditMode: boolean
}

export function GalleryHeader({ 
  onUploadComplete, 
  settings, 
  onSettingsUpdate, 
  isEditMode 
}: GalleryHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    console.log('📁 [GALLERY UI] User selected files:', files.length)
    
    // Convert FileList to Array
    const fileArray = Array.from(files)
    
    // Reset input immediately
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    try {
      // Import the direct upload service
      const { uploadImagesDirectly } = await import('@/lib/services/directUpload')
      
      console.log('🚀 [GALLERY UI] Starting direct upload...')
      
      // Get logbook slug from URL
      const logbookSlug = window.location.pathname.split('/')[2]
      
      // Call direct upload function
      const result = await uploadImagesDirectly(logbookSlug, fileArray)

      console.log('📊 [GALLERY UI] Upload result:', {
        success: result.success,
        imagesUploaded: result.images?.length || 0,
        details: result.details
      })

      if (result.success && result.images) {
        console.log('🎉 [GALLERY UI] Upload successful!')
        
        // Convert to expected format for parent component
        const galleryImages = result.images.map(img => ({
          id: img.id,
          logbook_id: logbookSlug,
          uploader_id: '',
          uploader_name: '',
          file_url: img.file_url,
          thumbnail_url: img.thumbnail_url,
          caption: undefined,
          upload_date: img.upload_date,
          file_size: img.file_size,
          mime_type: img.mime_type,
          original_filename: img.original_filename
        }))
        
        onUploadComplete(galleryImages)
        
        // Show success message
        if (result.details) {
          const { successful, failed, total } = result.details
          if (failed > 0) {
            console.warn(`⚠️ [GALLERY UI] Partial success: ${successful}/${total} files uploaded`)
          } else {
            console.log(`✅ [GALLERY UI] All ${successful} files uploaded successfully`)
          }
        }
      } else {
        console.error('❌ [GALLERY UI] Upload failed:', result.error)
        
        // Show detailed error information
        if (result.details?.errors) {
          console.error('📝 [GALLERY UI] Detailed errors:')
          result.details.errors.forEach((error, index) => {
            console.error(`   ${index + 1}. ${error}`)
          })
        }
        
        alert(`Upload failed: ${result.error}`)
      }

    } catch (error) {
      console.error('💥 [GALLERY UI] Critical upload error:', error)
      alert(`Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const canUpload = true // TODO: Check user permissions (parent || family)

  return (
    <div className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Gallery</h1>
        </div>
        
        <div className={styles.headerRight}>
          {canUpload && (
            <>
              <button
                className={styles.uploadButton}
                onClick={handleUploadClick}
                aria-label="Upload images"
              >
                <Icon name="upload" size="sm" />
                <span>Upload Photos</span>
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className={styles.hiddenInput}
                aria-hidden="true"
              />
            </>
          )}
        </div>
      </div>

      {/* Gallery Settings Panel (Edit Mode Only) */}
      {isEditMode && (
        <div className={styles.settingsPanel}>
          <div className={styles.settingsContent}>
            <h3 className={styles.settingsTitle}>Gallery Display Settings</h3>
            
            <div className={styles.settingsGrid}>
              <div className={styles.settingGroup}>
                <label className={styles.settingLabel}>
                  <input
                    type="checkbox"
                    checked={settings.show_dates}
                    onChange={(e) => onSettingsUpdate({ show_dates: e.target.checked })}
                    className={styles.checkbox}
                  />
                  <span className={styles.checkboxLabel}>Show upload dates</span>
                </label>
              </div>

              <div className={styles.settingGroup}>
                <label className={styles.settingLabel}>
                  <input
                    type="checkbox"
                    checked={settings.show_captions}
                    onChange={(e) => onSettingsUpdate({ show_captions: e.target.checked })}
                    className={styles.checkbox}
                  />
                  <span className={styles.checkboxLabel}>Show captions</span>
                </label>
              </div>

              <div className={styles.settingGroup}>
                <label className={styles.settingLabel}>
                  <input
                    type="checkbox"
                    checked={settings.show_uploaders}
                    onChange={(e) => onSettingsUpdate({ show_uploaders: e.target.checked })}
                    className={styles.checkbox}
                  />
                  <span className={styles.checkboxLabel}>Show uploader names</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}