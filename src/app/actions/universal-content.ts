'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ContentResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Get all content for a logbook page
 */
export async function getLogbookContent(
  logbookSlug: string,
  pageType: string
): Promise<ContentResult<Record<string, unknown>>> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Get logbook and verify user has access
    const { data: logbookData, error: logbookError } = await supabase
      .from('logbooks')
      .select(`
        id,
        page_sections,
        logbook_members!inner (
          role,
          user_id
        )
      `)
      .eq('slug', logbookSlug)
      .eq('logbook_members.user_id', user.id)
      .single()

    if (logbookError || !logbookData) {
      console.error('Error fetching logbook content:', logbookError)
      return { success: false, error: 'Logbook not found or access denied' }
    }

    // Extract content for the specific page
    const content = logbookData.page_sections || {}
    const pageContent = content[pageType] || {}

    return { success: true, data: pageContent }
  } catch (error) {
    console.error('Get logbook content error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update content at a specific path using dot notation
 */
export async function updateLogbookContent(
  logbookSlug: string,
  pageType: string,
  path: string,
  value: unknown
): Promise<ContentResult> {
  console.log('📝 [UPDATE CONTENT] Starting updateLogbookContent with:', {
    logbookSlug,
    pageType,
    path,
    valueType: typeof value,
    valueLength: typeof value === 'string' ? value.length : 'N/A'
  })

  try {
    console.log('🔑 [UPDATE CONTENT] Creating Supabase client...')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any

    // Get current user
    console.log('👤 [UPDATE CONTENT] Getting current user...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.log('❌ [UPDATE CONTENT] Authentication failed:', userError)
      return { success: false, error: 'Authentication required' }
    }
    console.log('✅ [UPDATE CONTENT] User authenticated:', user.id)

    // Get logbook and verify user is a parent
    console.log('🔍 [UPDATE CONTENT] Querying logbook with slug:', logbookSlug)
    console.log('🔍 [UPDATE CONTENT] For user ID:', user.id)
    
    const { data: logbookData, error: logbookError } = await supabase
      .from('logbooks')
      .select(`
        id,
        page_sections,
        logbook_members!inner (
          role,
          user_id
        )
      `)
      .eq('slug', logbookSlug)
      .eq('logbook_members.user_id', user.id)
      .single()

    console.log('📋 [UPDATE CONTENT] Logbook query result:', {
      data: logbookData,
      error: logbookError
    })

    if (logbookError || !logbookData) {
      console.error('❌ [UPDATE CONTENT] Error fetching logbook for content update:', logbookError)
      return { success: false, error: 'Logbook not found or access denied' }
    }

    // Check if user is a parent
    const userRole = logbookData.logbook_members[0]?.role
    if (userRole !== 'parent') {
      return { success: false, error: 'Only parents can edit content' }
    }

    // Get current content
    const currentContent = logbookData.page_sections || {}
    const pageContent = currentContent[pageType] || {}

    // Update content at the specified path
    const updatedPageContent = setNestedValue(pageContent, path, value)

    // Update the page_sections JSONB field
    const newContent = {
      ...currentContent,
      [pageType]: updatedPageContent
    }

    const { error: updateError } = await supabase
      .from('logbooks')
      .update({ page_sections: newContent })
      .eq('id', logbookData.id)

    if (updateError) {
      console.error('Error updating logbook content:', updateError)
      return { success: false, error: 'Failed to update content' }
    }

    // Revalidate relevant paths
    revalidatePath(`/logbook/${logbookSlug}`)
    revalidatePath(`/logbook/${logbookSlug}/${pageType}`)

    return { success: true }
  } catch (error) {
    console.error('Update logbook content error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Batch update multiple content paths
 */
export async function batchUpdateLogbookContent(
  logbookSlug: string,
  pageType: string,
  updates: Record<string, unknown>
): Promise<ContentResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Get logbook and verify user is a parent
    const { data: logbookData, error: logbookError } = await supabase
      .from('logbooks')
      .select(`
        id,
        page_sections,
        logbook_members!inner (
          role,
          user_id
        )
      `)
      .eq('slug', logbookSlug)
      .eq('logbook_members.user_id', user.id)
      .single()

    if (logbookError || !logbookData) {
      console.error('Error fetching logbook for batch content update:', logbookError)
      return { success: false, error: 'Logbook not found or access denied' }
    }

    // Check if user is a parent
    const userRole = logbookData.logbook_members[0]?.role
    if (userRole !== 'parent') {
      return { success: false, error: 'Only parents can edit content' }
    }

    // Get current content
    const currentContent = logbookData.page_sections || {}
    let pageContent = currentContent[pageType] || {}

    // Apply all updates
    for (const [path, value] of Object.entries(updates)) {
      pageContent = setNestedValue(pageContent, path, value)
    }

    // Update the page_sections JSONB field
    const newContent = {
      ...currentContent,
      [pageType]: pageContent
    }

    const { error: updateError } = await supabase
      .from('logbooks')
      .update({ page_sections: newContent })
      .eq('id', logbookData.id)

    if (updateError) {
      console.error('Error batch updating logbook content:', updateError)
      return { success: false, error: 'Failed to update content' }
    }

    // Revalidate relevant paths
    revalidatePath(`/logbook/${logbookSlug}`)
    revalidatePath(`/logbook/${logbookSlug}/${pageType}`)

    return { success: true }
  } catch (error) {
    console.error('Batch update logbook content error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Upload image and update content path
 */
export async function uploadAndUpdateContent(
  logbookSlug: string,
  pageType: string,
  path: string,
  file: File
): Promise<ContentResult<{ url: string }>> {
  console.log('🔧 [SERVER] uploadAndUpdateContent called with:', {
    logbookSlug,
    pageType,
    path,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type
  })

  try {
    console.log('🔑 [SERVER] Creating Supabase client...')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any

    // Get current user
    console.log('👤 [SERVER] Getting current user...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.log('❌ [SERVER] Authentication failed:', userError)
      return { success: false, error: 'Authentication required' }
    }
    console.log('✅ [SERVER] User authenticated:', user.id)

    // Validate file type and size
    console.log('🔍 [SERVER] Validating file...')
    if (!file.type.startsWith('image/')) {
      console.log('❌ [SERVER] Invalid file type:', file.type)
      return { success: false, error: 'File must be an image' }
    }
    if (file.size > 5 * 1024 * 1024) {
      console.log('❌ [SERVER] File too large:', file.size)
      return { success: false, error: 'Image must be smaller than 5MB' }
    }
    console.log('✅ [SERVER] File validation passed')

    // Convert file to base64 as a fallback for RLS issues
    console.log('🔄 [SERVER] Converting file to base64...')
    const fileBuffer = await file.arrayBuffer()
    const base64String = Buffer.from(fileBuffer).toString('base64')
    const dataUrl = `data:${file.type};base64,${base64String}`
    console.log('✅ [SERVER] Base64 conversion complete, length:', base64String.length)

    // Update content with base64 data URL (bypasses storage RLS issues)
    console.log('💾 [SERVER] Updating logbook content...')
    const updateResult = await updateLogbookContent(logbookSlug, pageType, path, dataUrl)
    
    console.log('📋 [SERVER] Update result:', updateResult)
    
    if (!updateResult.success) {
      console.log('❌ [SERVER] Content update failed:', updateResult.error)
      return { success: false, error: updateResult.error }
    }

    console.log('🎉 [SERVER] Upload and update successful!')
    return { success: true, data: { url: dataUrl } }
  } catch (error) {
    console.error('💥 [SERVER] Upload and update content error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Helper function to set nested object value using dot notation
 */
function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const keys = path.split('.')
  const result = JSON.parse(JSON.stringify(obj)) // Deep clone
  
  let current = result
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {}
    }
    current = current[key]
  }
  
  current[keys[keys.length - 1]] = value
  return result
}

