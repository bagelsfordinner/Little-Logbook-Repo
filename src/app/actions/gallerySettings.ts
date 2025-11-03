'use server'

import { createClient } from '@/lib/supabase/server'

export interface GallerySettingsData {
  logbook_id: string
  show_dates: boolean
  show_captions: boolean
  show_uploaders: boolean
  display_mode: 'simple' | 'enhanced'
}

export interface GallerySettingsResult {
  success: boolean
  settings?: GallerySettingsData
  error?: string
}

/**
 * 📋 Get gallery settings for a logbook
 */
export async function getGallerySettings(logbookSlug: string): Promise<GallerySettingsResult> {
  console.log('📋 [GALLERY SETTINGS] Getting settings for logbook:', logbookSlug)
  
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

    // Get settings
    const { data: settings, error: settingsError } = await supabase
      .from('gallery_settings')
      .select('*')
      .eq('logbook_id', logbook.id)
      .single()

    if (settingsError) {
      console.error('Settings error:', settingsError)
      return { success: false, error: 'Failed to load gallery settings' }
    }

    console.log('✅ [GALLERY SETTINGS] Settings loaded:', settings)
    
    return {
      success: true,
      settings: {
        logbook_id: logbookSlug, // Return slug for frontend
        show_dates: settings.show_dates,
        show_captions: settings.show_captions,
        show_uploaders: settings.show_uploaders,
        display_mode: settings.display_mode
      }
    }

  } catch (error) {
    console.error('Gallery settings error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * 💾 Update gallery settings for a logbook
 */
export async function updateGallerySettings(
  logbookSlug: string,
  updates: Partial<Omit<GallerySettingsData, 'logbook_id'>>
): Promise<GallerySettingsResult> {
  console.log('💾 [GALLERY SETTINGS] Updating settings for logbook:', logbookSlug)
  console.log('💾 [GALLERY SETTINGS] Updates:', updates)
  
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

    // Check permissions (only parents can modify settings)
    const { data: userRole } = await supabase
      .from('logbook_members')
      .select('role')
      .eq('logbook_id', logbook.id)
      .eq('user_id', user.id)
      .single()

    if (!userRole || userRole.role !== 'parent') {
      return { success: false, error: 'Only parents can modify gallery settings' }
    }

    // Update settings
    const { data: updatedSettings, error: updateError } = await supabase
      .from('gallery_settings')
      .update(updates)
      .eq('logbook_id', logbook.id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return { success: false, error: 'Failed to update gallery settings' }
    }

    console.log('✅ [GALLERY SETTINGS] Settings updated:', updatedSettings)
    
    return {
      success: true,
      settings: {
        logbook_id: logbookSlug,
        show_dates: updatedSettings.show_dates,
        show_captions: updatedSettings.show_captions,
        show_uploaders: updatedSettings.show_uploaders,
        display_mode: updatedSettings.display_mode
      }
    }

  } catch (error) {
    console.error('Gallery settings update error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}