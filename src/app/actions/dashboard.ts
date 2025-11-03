'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export interface UserLogbook {
  id: string
  name: string
  slug: string
  role: 'parent' | 'family' | 'friend'
  last_visited_at: string | null
  created_at: string
}

export interface DashboardResult {
  logbooks?: UserLogbook[]
  error?: string
}

export async function getUserLogbooks(): Promise<DashboardResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      redirect('/login')
    }

    // Query logbooks the user is a member of
    const { data: logbooksData, error: logbooksError } = await supabase
      .from('logbook_members')
      .select(`
        role,
        last_visited_at,
        logbooks (
          id,
          name,
          slug,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .order('last_visited_at', { ascending: false, nullsLast: true })

    if (logbooksError) {
      console.error('Error fetching logbooks:', logbooksError)
      return {
        error: 'Failed to fetch logbooks'
      }
    }

    // Transform the data
    const logbooks: UserLogbook[] = (logbooksData || [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((item: any) => item.logbooks) // Filter out any null logbooks
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => ({
        id: item.logbooks!.id,
        name: item.logbooks!.name,
        slug: item.logbooks!.slug,
        role: item.role as 'parent' | 'family' | 'friend',
        last_visited_at: item.last_visited_at,
        created_at: item.logbooks!.created_at
      }))

    return {
      logbooks
    }
  } catch (error) {
    console.error('Dashboard error:', error)
    return {
      error: 'An unexpected error occurred'
    }
  }
}

export async function updateLastVisited(logbookId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'Not authenticated'
      }
    }

    // Update last_visited_at for this user and logbook
    const { error: updateError } = await supabase
      .from('logbook_members')
      .update({
        last_visited_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('logbook_id', logbookId)

    if (updateError) {
      console.error('Error updating last visited:', updateError)
      return {
        success: false,
        error: 'Failed to update last visited'
      }
    }

    return {
      success: true
    }
  } catch (error) {
    console.error('Update last visited error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred'
    }
  }
}

export async function getCurrentUser() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, email')
      .eq('id', user.id)
      .single()

    return {
      id: user.id,
      email: user.email,
      display_name: profile?.display_name || user.email?.split('@')[0] || 'User'
    }
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}