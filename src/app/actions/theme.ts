'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export interface ThemeResult {
  success: boolean
  error?: string
  theme?: string
}

const updateThemeSchema = z.object({
  logbookId: z.string().min(1, 'Logbook ID is required'),
  theme: z.enum(['forest-light', 'forest-dark', 'soft-pastels'], { 
    message: 'Invalid theme selection' 
  }),
})

export async function updateLogbookTheme(
  logbookId: string,
  theme: 'forest-light' | 'forest-dark' | 'soft-pastels'
): Promise<ThemeResult> {
  try {
    // Validate inputs
    const validation = updateThemeSchema.safeParse({ logbookId, theme })

    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || 'Invalid input',
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any

    // Get current user and verify they're a parent of this logbook
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Verify user is a parent of this logbook
    const { data: membership, error: membershipError } = await supabase
      .from('logbook_members')
      .select('role')
      .eq('logbook_id', logbookId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership || membership.role !== 'parent') {
      return {
        success: false,
        error: 'Only logbook parents can change the theme',
      }
    }

    // Update logbook theme
    const { error: updateError } = await supabase
      .from('logbooks')
      .update({ theme })
      .eq('id', logbookId)

    if (updateError) {
      console.error('Error updating logbook theme:', updateError)
      return {
        success: false,
        error: 'Failed to update theme',
      }
    }

    // Revalidate the logbook page to refresh the theme
    revalidatePath(`/logbook/${logbookId}`)
    
    return {
      success: true,
      theme,
    }
  } catch (error) {
    console.error('Update theme error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

export async function getLogbookTheme(logbookId: string): Promise<ThemeResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any

    // Get current user and verify they're a member of this logbook
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Verify user is a member of this logbook and get the theme
    const { data: logbook, error: logbookError } = await supabase
      .from('logbooks')
      .select('theme')
      .eq('id', logbookId)
      .single()

    if (logbookError || !logbook) {
      console.error('Error fetching logbook theme:', logbookError)
      return {
        success: false,
        error: 'Logbook not found',
      }
    }

    // Verify user is a member
    const { data: membership, error: membershipError } = await supabase
      .from('logbook_members')
      .select('role')
      .eq('logbook_id', logbookId)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return {
        success: false,
        error: 'Access denied',
      }
    }

    return {
      success: true,
      theme: logbook.theme || 'forest-light',
    }
  } catch (error) {
    console.error('Get theme error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}