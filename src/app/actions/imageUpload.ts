'use server'

/**
 * 🖼️ Server Actions for Image Upload
 * 
 * Industry-standard Server Actions following Next.js 14+ best practices
 * Integrates with our robust image upload service
 */

import { uploadImage, getUploadOptionsFor, type ImageUploadOptions } from '@/lib/services/imageUpload'
import { updateLogbookContent } from './universal-content'

export interface ImageUploadActionResult {
  success: boolean
  url?: string
  error?: string
  metadata?: {
    originalName: string
    size: number
    type: string
    uploadedAt: string
    strategy: string
  }
}

/**
 * 🚀 Upload image and update logbook content
 * 
 * This is the main action used by the UI components
 */
export async function uploadImageToLogbook(
  logbookSlug: string,
  pageType: string,
  contentPath: string,
  file: File,
  uploadType: 'hero' | 'gallery' | 'profile' = 'hero'
): Promise<ImageUploadActionResult> {
  
  console.log('🎯 [ACTION] uploadImageToLogbook called:', {
    logbookSlug,
    pageType,
    contentPath,
    uploadType,
    fileName: file.name,
    fileSize: file.size
  })

  try {
    // Step 1: Upload the image using our robust service
    console.log('📤 [ACTION] Starting image upload...')
    const uploadOptions = getUploadOptionsFor[uploadType]()
    const uploadResult = await uploadImage(file, uploadOptions)

    if (!uploadResult.success) {
      console.error('❌ [ACTION] Image upload failed:', uploadResult.error)
      return {
        success: false,
        error: uploadResult.error || 'Image upload failed'
      }
    }

    console.log('✅ [ACTION] Image uploaded successfully')

    // Step 2: Update the logbook content with the new image URL
    console.log('💾 [ACTION] Updating logbook content...')
    const contentResult = await updateLogbookContent(
      logbookSlug,
      pageType,
      contentPath,
      uploadResult.url!
    )

    if (!contentResult.success) {
      console.error('❌ [ACTION] Content update failed:', contentResult.error)
      return {
        success: false,
        error: contentResult.error || 'Failed to update content'
      }
    }

    console.log('🎉 [ACTION] Upload and content update completed successfully!')
    
    return {
      success: true,
      url: uploadResult.url,
      metadata: uploadResult.metadata
    }

  } catch (error) {
    console.error('💥 [ACTION] uploadImageToLogbook error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error occurred'
    }
  }
}

/**
 * 🖼️ Upload image only (without updating content)
 * 
 * Useful for getting image URLs before deciding where to use them
 */
export async function uploadImageOnly(
  file: File,
  options: Partial<ImageUploadOptions> = {}
): Promise<ImageUploadActionResult> {
  
  console.log('🖼️ [ACTION] uploadImageOnly called:', {
    fileName: file.name,
    fileSize: file.size,
    options
  })

  try {
    const uploadResult = await uploadImage(file, options)
    
    if (uploadResult.success) {
      return {
        success: true,
        url: uploadResult.url,
        metadata: uploadResult.metadata
      }
    } else {
      return {
        success: false,
        error: uploadResult.error
      }
    }

  } catch (error) {
    console.error('💥 [ACTION] uploadImageOnly error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error occurred'
    }
  }
}

/**
 * 🗑️ Delete image (future enhancement)
 */
export async function deleteImage(imageUrl: string): Promise<{ success: boolean; error?: string }> {
  console.log('🗑️ [ACTION] deleteImage - Feature available for future implementation', { imageUrl })
  
  // Future: Implement image deletion
  // - Parse URL to determine storage strategy
  // - Delete from Supabase Storage or remove from content
  // - Update any references
  
  return { success: false, error: 'Delete image feature not yet implemented' }
}

/**
 * 📋 Get upload recommendations for different contexts
 */
export async function getUploadRecommendations(context: 'hero' | 'gallery' | 'profile') {
  const options = getUploadOptionsFor[context]()
  
  return {
    maxSizeMB: (options.maxSizeBytes || 5 * 1024 * 1024) / 1024 / 1024,
    allowedTypes: options.allowedTypes || ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    strategy: options.strategy || 'base64',
    folder: options.folder || 'uploads'
  }
}