'use server'

import { createClient } from '@/lib/supabase/server'
export interface GalleryImage {
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

export interface GalleryImagesResult {
  success: boolean
  images?: GalleryImage[]
  error?: string
}

/**
 * 🖼️ Get all gallery images for a logbook
 */
export async function getGalleryImages(logbookSlug: string): Promise<GalleryImagesResult> {
  console.log('🖼️ [GALLERY IMAGES] Getting images for logbook:', logbookSlug)
  
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

    // Check user has access to logbook
    const { data: userRole } = await supabase
      .from('logbook_members')
      .select('role')
      .eq('logbook_id', logbook.id)
      .eq('user_id', user.id)
      .single()

    if (!userRole) {
      return { success: false, error: 'Access denied' }
    }

    // Get gallery images
    const { data: images, error: imagesError } = await supabase
      .from('gallery_images')
      .select('*')
      .eq('logbook_id', logbook.id)
      .order('upload_date', { ascending: false })

    if (imagesError) {
      console.error('Images query error:', imagesError)
      return { success: false, error: 'Failed to load gallery images' }
    }

    console.log('✅ [GALLERY IMAGES] Found', images.length, 'images')
    
    return {
      success: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      images: images.map((image: any) => ({
        ...image,
        logbook_id: logbookSlug // Return slug for frontend
      }))
    }

  } catch (error) {
    console.error('Gallery images error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}