'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export interface CreateLogbookResult {
  success: boolean
  error?: string
  logbookSlug?: string
}

const createLogbookSchema = z.object({
  name: z.string().min(1, 'Logbook name is required'),
  slug: z.string().min(1, 'Logbook slug is required'),
})

export async function createLogbook(
  name: string,
  slug: string
): Promise<CreateLogbookResult> {
  try {
    // Validate inputs
    const validation = createLogbookSchema.safeParse({ name, slug })

    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || 'Invalid input',
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      redirect('/login')
    }

    // Check if slug is already taken
    const { data: existingLogbook } = await supabase
      .from('logbooks')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingLogbook) {
      return {
        success: false,
        error: 'Logbook slug is already taken',
      }
    }

    // Create logbook record
    const { data: logbookData, error: logbookError } = await supabase
      .from('logbooks')
      .insert({
        name,
        slug,
        created_by: user.id,
      })
      .select()
      .single()

    if (logbookError || !logbookData) {
      console.error('Error creating logbook:', logbookError)
      return {
        success: false,
        error: 'Failed to create logbook',
      }
    }

    // Create logbook_members record with parent role
    const { error: memberError } = await supabase
      .from('logbook_members')
      .insert({
        logbook_id: logbookData.id,
        user_id: user.id,
        role: 'parent',
        last_visited_at: new Date().toISOString(),
      })

    if (memberError) {
      console.error('Error adding user to logbook:', memberError)
      return {
        success: false,
        error: 'Failed to add user to logbook',
      }
    }

    revalidatePath('/dashboard')
    return {
      success: true,
      logbookSlug: slug,
    }
  } catch (error) {
    console.error('Create logbook error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

export async function getLogbookBySlug(slug: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      redirect('/login')
    }

    // Get logbook and verify user has access
    const { data: logbookData, error: logbookError } = await supabase
      .from('logbooks')
      .select(`
        id,
        name,
        slug,
        created_at,
        created_by,
        logbook_members!inner (
          role,
          user_id
        )
      `)
      .eq('slug', slug)
      .eq('logbook_members.user_id', user.id)
      .single()

    if (logbookError || !logbookData) {
      console.error('Error fetching logbook:', logbookError)
      redirect('/dashboard')
    }

    return {
      id: logbookData.id,
      name: logbookData.name,
      slug: logbookData.slug,
      created_at: logbookData.created_at,
      created_by: logbookData.created_by,
      userRole: logbookData.logbook_members[0]?.role,
      isOwner: logbookData.created_by === user.id,
    }
  } catch (error) {
    console.error('Get logbook error:', error)
    redirect('/dashboard')
  }
}

export async function navigateToLogbook(logbookId: string, slug: string) {
  // Update last visited before redirecting
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    await supabase
      .from('logbook_members')
      .update({
        last_visited_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('logbook_id', logbookId)
  }

  redirect(`/logbook/${slug}`)
}

export interface LogbookHome {
  id: string
  name: string
  slug: string
  baby_name?: string
  due_date?: string
  birth_date?: string
  hero_image_url?: string
  hero_title?: string
  hero_subtitle?: string
  userRole: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page_sections?: any
}

export async function getLogbookHome(slug: string): Promise<LogbookHome | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      redirect('/login')
    }

    // Get logbook data and verify user has access
    const { data: logbookData, error: logbookError } = await supabase
      .from('logbooks')
      .select(`
        id,
        name,
        slug,
        baby_name,
        due_date,
        birth_date,
        logbook_members!inner (
          role,
          user_id
        )
      `)
      .eq('slug', slug)
      .eq('logbook_members.user_id', user.id)
      .single()

    if (logbookError || !logbookData) {
      console.error('Error fetching logbook home:', logbookError)
      return null
    }

    return {
      id: logbookData.id,
      name: logbookData.name,
      slug: logbookData.slug,
      baby_name: logbookData.baby_name,
      due_date: logbookData.due_date,
      birth_date: logbookData.birth_date,
      hero_image_url: undefined,
      hero_title: undefined,
      hero_subtitle: undefined,
      userRole: logbookData.logbook_members[0]?.role || 'friend',
    }
  } catch (error) {
    console.error('Get logbook home error:', error)
    return null
  }
}

export async function getUserRole(logbookSlug: string): Promise<string | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return null
    }

    // Get user's role for this logbook
    const { data: memberData, error: memberError } = await supabase
      .from('logbook_members')
      .select(`
        role,
        logbooks!inner (slug)
      `)
      .eq('user_id', user.id)
      .eq('logbooks.slug', logbookSlug)
      .single()

    if (memberError || !memberData) {
      return null
    }

    return memberData.role
  } catch (error) {
    console.error('Get user role error:', error)
    return null
  }
}

export async function updateHeroImage(logbookId: string, imageFile: File): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Check if user is a parent of this logbook
    const { data: memberData, error: memberError } = await supabase
      .from('logbook_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('logbook_id', logbookId)
      .single()

    if (memberError || !memberData || memberData.role !== 'parent') {
      return { success: false, error: 'Unauthorized: Parent access required' }
    }

    // Upload image to Supabase Storage
    const fileName = `hero-${logbookId}-${Date.now()}.${imageFile.name.split('.').pop()}`
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(fileName, imageFile)

    if (uploadError) {
      console.error('Error uploading hero image:', uploadError)
      return { success: false, error: 'Failed to upload image' }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(fileName)

    // TODO: Update logbook with new hero image URL when schema is updated
    // const { error: updateError } = await supabase
    //   .from('logbooks')
    //   .update({ hero_image_url: publicUrl })
    //   .eq('id', logbookId)

    // if (updateError) {
    //   console.error('Error updating logbook hero image:', updateError)
    //   return { success: false, error: 'Failed to update logbook' }
    // }

    revalidatePath('/logbook/[slug]', 'page')
    return { success: true, imageUrl: publicUrl }
  } catch (error) {
    console.error('Update hero image error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function updateHeroText(logbookId: string, title: string, subtitle: string): Promise<{ success: boolean; error?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Check if user is a parent of this logbook
    const { data: memberData, error: memberError } = await supabase
      .from('logbook_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('logbook_id', logbookId)
      .single()

    if (memberError || !memberData || memberData.role !== 'parent') {
      return { success: false, error: 'Unauthorized: Parent access required' }
    }

    // TODO: Update logbook hero text when schema is updated
    console.log('Hero text update requested:', { logbookId, title, subtitle })
    // const { error: updateError } = await supabase
    //   .from('logbooks')
    //   .update({ 
    //     hero_title: title,
    //     hero_subtitle: subtitle
    //   })
    //   .eq('id', logbookId)

    // if (updateError) {
    //   console.error('Error updating logbook hero text:', updateError)
    //   return { success: false, error: 'Failed to update logbook' }
    // }

    revalidatePath('/logbook/[slug]', 'page')
    return { success: true }
  } catch (error) {
    console.error('Update hero text error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export interface LogbookStats {
  photoCount: number
  commentCount: number
  memberCount: number
}

export async function getLogbookStats(slug: string): Promise<LogbookStats | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return null
    }

    // Get logbook ID first
    const { data: logbookData, error: logbookError } = await supabase
      .from('logbooks')
      .select('id')
      .eq('slug', slug)
      .single()

    if (logbookError || !logbookData) {
      return null
    }

    // Get stats in parallel
    const [photoResult, commentResult, memberResult] = await Promise.all([
      // Photo count - for now return 0, will implement when media table exists
      Promise.resolve({ count: 0 }),
      // Comment count - for now return 0, will implement when comments table exists  
      Promise.resolve({ count: 0 }),
      // Member count
      supabase
        .from('logbook_members')
        .select('id', { count: 'exact' })
        .eq('logbook_id', logbookData.id)
    ])

    return {
      photoCount: photoResult.count || 0,
      commentCount: commentResult.count || 0,
      memberCount: memberResult.count || 0
    }
  } catch (error) {
    console.error('Get logbook stats error:', error)
    return null
  }
}