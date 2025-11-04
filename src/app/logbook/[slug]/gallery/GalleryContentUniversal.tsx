'use client'

import { useState, useEffect, useCallback } from 'react'
import { ContentProvider, useContent } from '@/lib/contexts/ContentContext'
import { Header } from '@/components/organisms/Header'
import { EditPanel } from '@/components/universal'
import PageTransition from '@/components/PageTransition'
import { GalleryHeader } from './components/GalleryHeader'
import { GalleryGrid } from './components/GalleryGrid'
import { ImageLightbox } from './components/ImageLightbox'
import styles from './page.module.css'
import type { GalleryImage } from '@/app/actions/galleryImages'
import type { LogbookHome } from '@/app/actions/logbook'
import type { UserRole } from '@/lib/contexts/ContentContext'

// Component-specific settings interface (subset of database settings)
export interface GalleryDisplaySettings {
  logbook_id: string
  show_dates: boolean
  show_captions: boolean
  show_uploaders: boolean
  display_mode: 'simple' | 'enhanced'
}

interface GalleryContentUniversalProps {
  logbook: LogbookHome
  userRole: string
}

// Gallery content component (must be inside ContentProvider)
function GalleryContent({ logbook }: { logbook: GalleryContentUniversalProps['logbook'] }) {
  const { isEditMode } = useContent()
  const [images, setImages] = useState<GalleryImage[]>([])
  const [settings, setSettings] = useState<GalleryDisplaySettings>({
    logbook_id: logbook.slug,
    show_dates: false,
    show_captions: false,
    show_uploaders: false,
    display_mode: 'simple'
  })
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false) // Start as false since we have no data to load yet

  const loadGalleryData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Load gallery settings
      const { getGallerySettings } = await import('@/app/actions/gallerySettings')
      const settingsResult = await getGallerySettings(logbook.slug)
      
      if (settingsResult.success && settingsResult.settings) {
        console.log('✅ [GALLERY] Settings loaded:', settingsResult.settings)
        setSettings(settingsResult.settings)
      } else {
        console.warn('⚠️ [GALLERY] Failed to load settings, using defaults:', settingsResult.error)
      }
      
      // Load images from database
      const { getGalleryImages } = await import('@/app/actions/galleryImages')
      const imagesResult = await getGalleryImages(logbook.slug)
      
      if (imagesResult.success && imagesResult.images) {
        console.log('✅ [GALLERY] Images loaded:', imagesResult.images.length, 'images')
        setImages(imagesResult.images)
      } else {
        console.warn('⚠️ [GALLERY] Failed to load images:', imagesResult.error)
        setImages([])
      }
      setIsLoading(false)
    } catch (error) {
      console.error('💥 [GALLERY] Failed to load gallery data:', error)
      setIsLoading(false)
    }
  }, [logbook.slug])

  // Load images and settings
  useEffect(() => {
    loadGalleryData()
  }, [loadGalleryData])

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index)
    setIsLightboxOpen(true)
  }

  const handleCloseLightbox = () => {
    setIsLightboxOpen(false)
    setSelectedImageIndex(null)
  }

  const handleNavigateImage = (direction: 'prev' | 'next') => {
    if (selectedImageIndex === null) return
    
    if (direction === 'prev') {
      const newIndex = selectedImageIndex > 0 ? selectedImageIndex - 1 : images.length - 1
      setSelectedImageIndex(newIndex)
    } else {
      const newIndex = selectedImageIndex < images.length - 1 ? selectedImageIndex + 1 : 0
      setSelectedImageIndex(newIndex)
    }
  }

  const handleUploadComplete = (newImages: GalleryImage[]) => {
    setImages(prev => [...newImages, ...prev]) // Add new images to beginning
  }

  const handleImageDelete = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId))
  }

  const handleSettingsUpdate = async (newSettings: Partial<GalleryDisplaySettings>) => {
    try {
      console.log('🔧 [GALLERY] Updating settings:', newSettings)
      
      // Update local state immediately for responsiveness
      setSettings(prev => ({ ...prev, ...newSettings }))
      
      // Save to database
      const { updateGallerySettings } = await import('@/app/actions/gallerySettings')
      const result = await updateGallerySettings(logbook.slug, newSettings)
      
      if (result.success) {
        console.log('✅ [GALLERY] Settings saved successfully')
        // Update with server response to ensure consistency
        if (result.settings) {
          setSettings(result.settings)
        }
      } else {
        console.error('❌ [GALLERY] Failed to save settings:', result.error)
        // Revert local changes on error
        loadGalleryData()
      }
    } catch (error) {
      console.error('💥 [GALLERY] Settings update error:', error)
      // Revert local changes on error
      loadGalleryData()
    }
  }

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}>Loading gallery...</div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <GalleryHeader
        onUploadComplete={handleUploadComplete}
        settings={settings}
        onSettingsUpdate={handleSettingsUpdate}
        isEditMode={isEditMode}
      />
      
      <GalleryGrid
        images={images}
        settings={settings}
        onImageClick={handleImageClick}
        onImageDelete={handleImageDelete}
        isEditMode={isEditMode}
        logbookName={logbook.name}
      />

      {isLightboxOpen && selectedImageIndex !== null && (
        <ImageLightbox
          images={images}
          currentIndex={selectedImageIndex}
          onClose={handleCloseLightbox}
          onNavigate={handleNavigateImage}
          settings={settings}
        />
      )}
    </div>
  )
}

interface GalleryContentUniversalProps {
  logbook: LogbookHome
  userRole: string
}

// Main component with ContentProvider
export function GalleryContentUniversal({ logbook, userRole }: GalleryContentUniversalProps) {
  const handleSignOut = () => {
    window.location.href = '/login'
  }

  const handleDashboard = () => {
    window.location.href = '/dashboard'
  }


  const editPanelSections = [
    {
      path: 'gallery.settings',
      label: 'Gallery Settings',
      description: 'Configure how images are displayed'
    }
  ]

  return (
    <ContentProvider 
      logbookSlug={logbook.slug} 
      pageType="gallery"
      userRole={userRole as UserRole}
      initialContent={{}}
    >
      <PageTransition>
        <Header
          logbookName={logbook.name}
          logbookSlug={logbook.slug}
          logbookId={logbook.id}
          userName="Current User"
          userRole={(userRole as 'parent' | 'family' | 'friend') || 'friend'}
          currentPath="Gallery"
          onSignOut={handleSignOut}
          onDashboard={handleDashboard}
        />
        
        <GalleryContent logbook={logbook} />
        
        <EditPanel 
          sections={editPanelSections}
          pageTitle="Gallery"
        />
      </PageTransition>
    </ContentProvider>
  )
}