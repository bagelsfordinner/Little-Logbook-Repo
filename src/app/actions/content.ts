'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { 
  PageType, 
  SectionData,
  PageTypeSections
} from '@/lib/constants/pageSections'
import { 
  getPageSections, 
  updateSectionInSections,
  getSectionDifferences
} from '@/lib/utils/pageContent'

export interface ContentResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface PageSectionsResult<T extends PageType> {
  sections: PageTypeSections<T> | null
  error: string | null
}

/**
 * Fetches and merges page sections for a specific logbook and page type.
 * Combines default sections with logbook-specific overrides.
 * 
 * @param logbookSlug - The logbook slug identifier
 * @param pageType - The page type to fetch sections for
 * @returns Merged page sections or error
 */
export async function getLogbookPageSections<T extends PageType>(
  logbookSlug: string,
  pageType: T
): Promise<PageSectionsResult<T>> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        sections: null,
        error: 'Authentication required'
      }
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
      console.error('Error fetching logbook for page sections:', logbookError)
      return {
        sections: null,
        error: 'Logbook not found or access denied'
      }
    }

    // Merge with defaults using utility function
    const mergedSections = getPageSections(logbookData.page_sections, pageType)

    return {
      sections: mergedSections,
      error: null
    }
  } catch (error) {
    console.error('Get logbook page sections error:', error)
    return {
      sections: null,
      error: 'An unexpected error occurred'
    }
  }
}

/**
 * Updates a specific section within a page with new values.
 * Only parents can modify page sections.
 * 
 * @param logbookSlug - The logbook slug identifier
 * @param pageType - The page type containing the section
 * @param sectionKey - The section key to update
 * @param updates - Partial updates to apply to the section
 * @returns Success/error result
 */
export async function updatePageSection<T extends PageType>(
  logbookSlug: string,
  pageType: T,
  sectionKey: string,
  updates: Partial<SectionData>
): Promise<ContentResult> {
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
      console.error('Error fetching logbook for section update:', logbookError)
      return {
        success: false,
        error: 'Logbook not found or access denied'
      }
    }

    // Check if user is a parent
    const userRole = logbookData.logbook_members[0]?.role
    if (userRole !== 'parent') {
      return {
        success: false,
        error: 'Only parents can edit page content'
      }
    }

    // Get current sections and merge with updates
    const currentSections = getPageSections(logbookData.page_sections, pageType)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedSections = updateSectionInSections(currentSections, sectionKey as keyof PageTypeSections<typeof pageType>, updates as any)
    
    // Get only the differences to store in database
    const differences = getSectionDifferences(updatedSections, pageType)
    
    // Update the page_sections JSONB field
    const currentPageSections = logbookData.page_sections || {}
    const newPageSections = {
      ...currentPageSections,
      [pageType]: {
        ...currentPageSections[pageType],
        ...differences
      }
    }

    const { error: updateError } = await supabase
      .from('logbooks')
      .update({ 
        page_sections: newPageSections
      })
      .eq('id', logbookData.id)

    if (updateError) {
      console.error('Error updating page section:', updateError)
      return {
        success: false,
        error: 'Failed to update page section'
      }
    }

    // Revalidate relevant paths
    revalidatePath(`/logbook/${logbookSlug}`)
    revalidatePath(`/logbook/${logbookSlug}/${pageType}`)

    return {
      success: true
    }
  } catch (error) {
    console.error('Update page section error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred'
    }
  }
}

/**
 * Convenience function for toggling section visibility.
 * 
 * @param logbookSlug - The logbook slug identifier
 * @param pageType - The page type containing the section
 * @param sectionKey - The section key to toggle
 * @param visible - New visibility state
 * @returns Success/error result
 */
export async function toggleSectionVisibility<T extends PageType>(
  logbookSlug: string,
  pageType: T,
  sectionKey: string,
  visible: boolean
): Promise<ContentResult> {
  return updatePageSection(logbookSlug, pageType, sectionKey, { visible })
}

/**
 * Resets a page section to its default values.
 * Only parents can reset sections.
 * 
 * @param logbookSlug - The logbook slug identifier
 * @param pageType - The page type containing the section
 * @param sectionKey - The section key to reset
 * @returns Success/error result
 */
export async function resetPageSection<T extends PageType>(
  logbookSlug: string,
  pageType: T,
  sectionKey: string
): Promise<ContentResult> {
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
      console.error('Error fetching logbook for section reset:', logbookError)
      return {
        success: false,
        error: 'Logbook not found or access denied'
      }
    }

    // Check if user is a parent
    const userRole = logbookData.logbook_members[0]?.role
    if (userRole !== 'parent') {
      return {
        success: false,
        error: 'Only parents can edit page content'
      }
    }

    // Remove the section from page_sections to reset to defaults
    const currentPageSections = logbookData.page_sections || {}
    const pageTypeSections = currentPageSections[pageType] || {}
    
    // Remove the specific section
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [sectionKey]: _removed, ...remainingSections } = pageTypeSections
    
    const newPageSections = {
      ...currentPageSections,
      [pageType]: remainingSections
    }

    const { error: updateError } = await supabase
      .from('logbooks')
      .update({ 
        page_sections: newPageSections
      })
      .eq('id', logbookData.id)

    if (updateError) {
      console.error('Error resetting page section:', updateError)
      return {
        success: false,
        error: 'Failed to reset page section'
      }
    }

    // Revalidate relevant paths
    revalidatePath(`/logbook/${logbookSlug}`)
    revalidatePath(`/logbook/${logbookSlug}/${pageType}`)

    return {
      success: true
    }
  } catch (error) {
    console.error('Reset page section error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred'
    }
  }
}