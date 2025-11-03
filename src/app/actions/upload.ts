'use server'

import { createClient } from '@/lib/supabase/server'
import { updatePageSection } from './content'

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Uploads an image to Supabase Storage and returns the public URL
 */
export async function uploadImage(file: File, folder: string = 'images'): Promise<UploadResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'File must be an image'
      }
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return {
        success: false,
        error: 'Image must be smaller than 5MB'
      }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${folder}/${user.id}/${Date.now()}.${fileExt}`

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('media')
      .upload(fileName, file)

    if (error) {
      console.error('Storage upload error:', error)
      return {
        success: false,
        error: 'Failed to upload image'
      }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(fileName)

    return {
      success: true,
      url: publicUrl
    }
  } catch (error) {
    console.error('Upload image error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred'
    }
  }
}

/**
 * Uploads an image and updates a page section image field
 */
export async function uploadAndUpdateSectionImage(
  logbookSlug: string,
  pageType: string,
  sectionKey: string,
  imageField: string,
  file: File
): Promise<UploadResult> {
  try {
    // Upload the image first
    const uploadResult = await uploadImage(file, `${pageType}/${sectionKey}`)
    
    if (!uploadResult.success) {
      return uploadResult
    }

    // Update the page section with the new image URL
    const updateResult = await updatePageSection(
      logbookSlug, 
      pageType as 'home', 
      sectionKey, 
      { [imageField]: uploadResult.url }
    )

    if (!updateResult.success) {
      return {
        success: false,
        error: updateResult.error || 'Failed to update section'
      }
    }

    return {
      success: true,
      url: uploadResult.url
    }
  } catch (error) {
    console.error('Upload and update section image error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred'
    }
  }
}