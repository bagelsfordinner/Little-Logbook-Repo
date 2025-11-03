'use server'

import { createClient } from '@/lib/supabase/server'
import { uploadImage, getUploadOptionsFor } from '@/lib/services/imageUpload'

export interface GalleryUploadResult {
  success: boolean
  images?: GalleryImageData[]
  error?: string
  details?: {
    total: number
    successful: number
    failed: number
    errors: string[]
  }
}

export interface GalleryImageData {
  id: string
  logbook_id: string
  uploader_id: string
  uploader_name: string
  file_url: string
  thumbnail_url?: string
  caption?: string
  upload_date: string
  file_size: number
  mime_type: string
  original_filename: string
}

/**
 * 🖼️ Upload multiple images to gallery with robust error handling
 */
export async function uploadGalleryImages(
  logbookSlug: string,
  files: File[]
): Promise<GalleryUploadResult> {
  console.log('🎨 [GALLERY UPLOAD] ='.repeat(60))
  console.log('🎨 [GALLERY UPLOAD] Starting bulk gallery upload...')
  console.log('🎨 [GALLERY UPLOAD] Files to upload:', files.length)
  console.log('🎨 [GALLERY UPLOAD] Logbook:', logbookSlug)

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any

    // Step 1: Authentication check
    console.log('🔐 [GALLERY UPLOAD] Checking authentication...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('❌ [GALLERY UPLOAD] Authentication failed:', userError)
      return {
        success: false,
        error: 'Authentication required to upload images'
      }
    }
    console.log('✅ [GALLERY UPLOAD] User authenticated:', user.email)

    // Step 2: Get logbook and verify permissions
    console.log('📝 [GALLERY UPLOAD] Verifying logbook access...')
    const { data: logbook, error: logbookError } = await supabase
      .from('logbooks')
      .select('id, slug, name')
      .eq('slug', logbookSlug)
      .single()

    if (logbookError || !logbook) {
      console.error('❌ [GALLERY UPLOAD] Logbook not found:', logbookError)
      return {
        success: false,
        error: 'Logbook not found or access denied'
      }
    }
    console.log('✅ [GALLERY UPLOAD] Logbook found:', logbook.name)

    // Step 3: Check user role/permissions
    console.log('🔍 [GALLERY UPLOAD] Checking user permissions...')
    console.log('🔍 [GALLERY UPLOAD] Looking for user_id:', user.id)
    console.log('🔍 [GALLERY UPLOAD] Looking for logbook_id:', logbook.id)
    
    const { data: userRole, error: roleError } = await supabase
      .from('logbook_members')
      .select('role')
      .eq('logbook_id', logbook.id)
      .eq('user_id', user.id)
      .single()

    console.log('🔍 [GALLERY UPLOAD] Role query result:', { userRole, roleError })

    // Debug: Let's also check what logbook_members exist for this logbook
    const { data: allLogbookMembers, error: debugError } = await supabase
      .from('logbook_members')
      .select('user_id, role')
      .eq('logbook_id', logbook.id)
    
    console.log('🔍 [GALLERY UPLOAD] All members for this logbook:', allLogbookMembers)
    console.log('🔍 [GALLERY UPLOAD] Debug query error:', debugError)

    if (roleError || !userRole || !['parent', 'family'].includes(userRole.role)) {
      console.error('❌ [GALLERY UPLOAD] Insufficient permissions:')
      console.error('   Role found:', userRole?.role)
      console.error('   Role error:', roleError)
      console.error('   Expected roles: parent, family')
      return {
        success: false,
        error: 'You do not have permission to upload images to this logbook'
      }
    }
    console.log('✅ [GALLERY UPLOAD] Permission granted for role:', userRole.role)

    // Step 4: Get user profile for uploader name
    console.log('👤 [GALLERY UPLOAD] Getting user profile...')
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single()

    const uploaderName = profile 
      ? `${profile.first_name} ${profile.last_name}`.trim()
      : user.email?.split('@')[0] || 'Unknown User'
    
    console.log('✅ [GALLERY UPLOAD] Uploader name:', uploaderName)

    // Step 5: Process each file
    const results: GalleryImageData[] = []
    const errors: string[] = []
    let successful = 0
    let failed = 0

    const uploadOptions = getUploadOptionsFor.gallery()
    
    console.log('📤 [GALLERY UPLOAD] Starting individual file uploads...')
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log(`\n🔄 [GALLERY UPLOAD] Processing file ${i + 1}/${files.length}: ${file.name}`)
      
      try {
        // Upload image using the robust image upload service
        console.log('☁️ [GALLERY UPLOAD] Uploading to storage...')
        const uploadResult = await uploadImage(file, {
          ...uploadOptions,
          folder: `gallery/${logbookSlug}`
        })

        if (!uploadResult.success) {
          console.error(`❌ [GALLERY UPLOAD] File ${i + 1} upload failed:`, uploadResult.error)
          errors.push(`${file.name}: ${uploadResult.error}`)
          failed++
          continue
        }

        console.log('✅ [GALLERY UPLOAD] File uploaded successfully to:', uploadResult.url?.substring(0, 100) + '...')

        // Save to database
        console.log('💾 [GALLERY UPLOAD] Saving to database...')
        const { data: savedImage, error: dbError } = await supabase
          .from('gallery_images')
          .insert({
            logbook_id: logbook.id,
            uploader_id: user.id,
            uploader_name: uploaderName,
            file_url: uploadResult.url,
            original_filename: file.name,
            file_size: file.size,
            mime_type: file.type,
            upload_date: new Date().toISOString()
          })
          .select('*')
          .single()

        if (dbError) {
          console.error(`❌ [GALLERY UPLOAD] Database save failed for file ${i + 1}:`, dbError)
          errors.push(`${file.name}: Failed to save to database - ${dbError.message}`)
          failed++
          continue
        }

        console.log('✅ [GALLERY UPLOAD] File saved to database with ID:', savedImage.id)
        
        results.push({
          ...savedImage,
          logbook_id: logbookSlug // Return slug instead of ID for frontend
        })
        successful++

      } catch (error) {
        console.error(`💥 [GALLERY UPLOAD] Unexpected error for file ${i + 1}:`, error)
        errors.push(`${file.name}: Unexpected error - ${error instanceof Error ? error.message : 'Unknown error'}`)
        failed++
      }
    }

    // Step 6: Prepare final result
    console.log('\n📊 [GALLERY UPLOAD] Upload summary:')
    console.log(`   Total files: ${files.length}`)
    console.log(`   Successful: ${successful}`)
    console.log(`   Failed: ${failed}`)
    
    if (errors.length > 0) {
      console.log('❌ [GALLERY UPLOAD] Errors encountered:')
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`)
      })
    }

    const isSuccess = successful > 0
    const result: GalleryUploadResult = {
      success: isSuccess,
      images: results,
      details: {
        total: files.length,
        successful,
        failed,
        errors
      }
    }

    if (!isSuccess) {
      result.error = failed === files.length 
        ? 'All uploads failed'
        : `${failed} of ${files.length} uploads failed`
    }

    console.log('🎨 [GALLERY UPLOAD] ='.repeat(60))
    return result

  } catch (error) {
    console.error('💥 [GALLERY UPLOAD] Critical error:', error)
    console.log('🎨 [GALLERY UPLOAD] ='.repeat(60))
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'A critical error occurred during upload'
    }
  }
}

/**
 * 🗑️ Delete gallery image with permission checks
 */
export async function deleteGalleryImage(
  logbookSlug: string,
  imageId: string
): Promise<{ success: boolean; error?: string }> {
  console.log('🗑️ [GALLERY DELETE] Deleting image:', imageId)
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Get logbook
    const { data: logbook } = await supabase
      .from('logbooks')
      .select('id')
      .eq('slug', logbookSlug)
      .single()

    if (!logbook) {
      return { success: false, error: 'Logbook not found' }
    }

    // Get user role
    const { data: userRole } = await supabase
      .from('logbook_members')
      .select('role')
      .eq('logbook_id', logbook.id)
      .eq('user_id', user.id)
      .single()

    // Get image to check ownership
    const { data: image } = await supabase
      .from('gallery_images')
      .select('uploader_id')
      .eq('id', imageId)
      .single()

    if (!image) {
      return { success: false, error: 'Image not found' }
    }

    // Check permissions: user owns the image OR user is a parent
    const canDelete = image.uploader_id === user.id || userRole?.role === 'parent'
    
    if (!canDelete) {
      return { success: false, error: 'You do not have permission to delete this image' }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('gallery_images')
      .delete()
      .eq('id', imageId)

    if (deleteError) {
      console.error('Database delete error:', deleteError)
      return { success: false, error: 'Failed to delete image' }
    }

    console.log('✅ [GALLERY DELETE] Image deleted successfully')
    return { success: true }

  } catch (error) {
    console.error('Gallery delete error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}