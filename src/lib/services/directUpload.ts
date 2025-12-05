'use client'

import { createClient } from '@/lib/supabase/client'

export interface DirectUploadResult {
  success: boolean
  images?: UploadedImage[]
  error?: string
  details?: {
    total: number
    successful: number
    failed: number
    errors: string[]
  }
}

export interface UploadedImage {
  id: string
  file_url: string
  thumbnail_url?: string
  original_filename: string
  file_size: number
  mime_type: string
  upload_date: string
}

/**
 * 🚀 Direct client-side upload to Supabase Storage
 * No server actions, no size limits, no bullshit
 */
export async function uploadImagesDirectly(
  logbookSlug: string,
  files: File[]
): Promise<DirectUploadResult> {
  console.log('🚀 [DIRECT UPLOAD] Starting client-side upload...')
  console.log('🚀 [DIRECT UPLOAD] Files:', files.length)
  
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Get logbook info
    const { data: logbook, error: logbookError } = await supabase
      .from('logbooks')
      .select('id, name')
      .eq('slug', logbookSlug)
      .single()

    if (logbookError || !logbook) {
      return { success: false, error: 'Logbook not found' }
    }

    const results: UploadedImage[] = []
    const errors: string[] = []

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log(`📁 [DIRECT UPLOAD] Processing file ${i + 1}/${files.length}: ${file.name}`)

      try {
        // Convert HEIC to JPEG if needed
        const processedFile = await convertToWebCompatible(file)
        
        // Generate unique filename
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substring(2, 8)
        const fileExt = processedFile.name.split('.').pop()?.toLowerCase() || 'jpg'
        const fileName = `gallery/${logbook.id}/${timestamp}-${randomId}.${fileExt}`

        console.log(`☁️ [DIRECT UPLOAD] Uploading to: ${fileName}`)

        // Upload directly to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media')
          .upload(fileName, processedFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: processedFile.type
          })

        if (uploadError) {
          console.error(`❌ [DIRECT UPLOAD] Upload failed for ${file.name}:`, uploadError)
          errors.push(`${file.name}: ${uploadError.message}`)
          continue
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(fileName)

        console.log(`✅ [DIRECT UPLOAD] Upload successful: ${fileName}`)

        // Save to database
        const { data: dbData, error: dbError } = await supabase
          .from('gallery_images')
          .insert({
            logbook_id: logbook.id,
            uploader_id: user.id,
            uploader_name: user.user_metadata?.display_name || user.email || 'Unknown',
            file_url: publicUrl,
            original_filename: file.name,
            file_size: processedFile.size,
            mime_type: processedFile.type,
            upload_date: new Date().toISOString()
          })
          .select()
          .single()

        if (dbError) {
          console.error(`❌ [DIRECT UPLOAD] Database save failed for ${file.name}:`, dbError)
          errors.push(`${file.name}: Failed to save to database`)
          
          // Clean up uploaded file
          await supabase.storage.from('media').remove([fileName])
          continue
        }

        results.push({
          id: dbData.id,
          file_url: publicUrl,
          original_filename: file.name,
          file_size: processedFile.size,
          mime_type: processedFile.type,
          upload_date: dbData.upload_date
        })

      } catch (error) {
        console.error(`💥 [DIRECT UPLOAD] Critical error for ${file.name}:`, error)
        errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    const successful = results.length
    const failed = files.length - successful

    console.log(`📊 [DIRECT UPLOAD] Complete: ${successful}/${files.length} successful`)

    return {
      success: successful > 0,
      images: results,
      error: successful === 0 ? 'All uploads failed' : undefined,
      details: {
        total: files.length,
        successful,
        failed,
        errors
      }
    }

  } catch (error) {
    console.error('💥 [DIRECT UPLOAD] Critical error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * 🔄 Convert HEIC/unsupported formats to web-compatible JPEG
 */
async function convertToWebCompatible(file: File): Promise<File> {
  // If already web-compatible, return as-is
  if (['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
    return file
  }

  console.log(`🔄 [CONVERT] Converting ${file.type} to JPEG...`)

  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Canvas not supported'))
      return
    }

    img.onload = () => {
      // Resize if too large
      const maxDimension = 1920
      let { width, height } = img

      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      canvas.width = width
      canvas.height = height

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to convert image'))
          return
        }

        const convertedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
          type: 'image/jpeg',
          lastModified: Date.now()
        })

        console.log(`✅ [CONVERT] Converted to JPEG: ${(blob.size / 1024).toFixed(1)}KB`)
        resolve(convertedFile)
      }, 'image/jpeg', 0.85)
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * 📸 Simple single image upload for inline content
 */
export async function uploadImageToLogbook(logbookSlug: string, file: File): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Get logbook info
    const { data: logbook, error: logbookError } = await supabase
      .from('logbooks')
      .select('id')
      .eq('slug', logbookSlug)
      .single()

    if (logbookError || !logbook) {
      return { success: false, error: 'Logbook not found' }
    }

    // Convert file if needed
    const processedFile = await convertToWebCompatible(file)
    
    // Generate filename
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const fileExt = processedFile.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `content/${logbook.id}/${timestamp}-${randomId}.${fileExt}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(fileName, processedFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: processedFile.type
      })

    if (uploadError) {
      return { success: false, error: uploadError.message }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(fileName)

    return { success: true, url: publicUrl }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * 🗑️ Delete image from both storage and database
 */
export async function deleteImageDirectly(imageId: string): Promise<{ success: boolean; error?: string }> {
  console.log('🗑️ [DELETE] Starting image deletion:', imageId)
  
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Get image info first
    const { data: imageData, error: fetchError } = await supabase
      .from('gallery_images')
      .select('file_url, uploader_id, logbook_id')
      .eq('id', imageId)
      .single()

    if (fetchError || !imageData) {
      console.error('❌ [DELETE] Image not found:', fetchError)
      return { success: false, error: 'Image not found' }
    }

    // Check ownership - users can only delete their own images
    if (imageData.uploader_id !== user.id) {
      console.error('❌ [DELETE] Permission denied - not owner')
      return { success: false, error: 'Permission denied - you can only delete your own images' }
    }

    // Extract storage path from URL
    const url = new URL(imageData.file_url)
    const storagePath = url.pathname.replace('/storage/v1/object/public/media/', '')

    console.log('🗑️ [DELETE] Deleting from storage:', storagePath)

    // Delete from Supabase Storage
    const { error: storageError } = await supabase.storage
      .from('media')
      .remove([storagePath])

    if (storageError) {
      console.error('❌ [DELETE] Storage deletion failed:', storageError)
      return { success: false, error: 'Failed to delete file from storage' }
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('gallery_images')
      .delete()
      .eq('id', imageId)

    if (dbError) {
      console.error('❌ [DELETE] Database deletion failed:', dbError)
      return { success: false, error: 'Failed to delete from database' }
    }

    console.log('✅ [DELETE] Image successfully deleted')
    return { success: true }

  } catch (error) {
    console.error('💥 [DELETE] Critical error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}