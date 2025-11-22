'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export interface InviteCodeResult {
  success: boolean
  error?: string
  inviteCode?: string
  inviteUrl?: string
}

export interface InviteCode {
  id: string
  code: string
  role: 'family' | 'friend'
  max_uses: number
  uses_count: number
  expires_at: string | null
  created_at: string
}

export interface InviteCodeListResult {
  success: boolean
  error?: string
  inviteCodes?: InviteCode[]
}

const createInviteCodeSchema = z.object({
  logbookId: z.string().min(1, 'Logbook ID is required'),
  role: z.enum(['family', 'friend'], { message: 'Role must be family or friend' }),
  maxUses: z.number().min(1, 'Max uses must be at least 1').max(100, 'Max uses cannot exceed 100'),
  expiresInDays: z.number().optional(),
})

function generateInviteCode(): string {
  // Generate a random 8-character code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function createInviteCode(
  logbookId: string,
  role: 'family' | 'friend',
  maxUses: number = 1,
  expiresInDays?: number
): Promise<InviteCodeResult> {
  try {
    // Validate inputs
    const validation = createInviteCodeSchema.safeParse({
      logbookId,
      role,
      maxUses,
      expiresInDays,
    })

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
        error: 'Only logbook parents can create invite codes',
      }
    }

    // Generate unique code
    let code = generateInviteCode()
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
      const { data: existingCode } = await supabase
        .from('invite_codes')
        .select('id')
        .eq('code', code)
        .single()

      if (!existingCode) {
        break // Code is unique
      }

      code = generateInviteCode()
      attempts++
    }

    if (attempts >= maxAttempts) {
      return {
        success: false,
        error: 'Failed to generate unique invite code',
      }
    }

    // Calculate expiration date
    let expiresAt: string | null = null
    if (expiresInDays && expiresInDays > 0) {
      const expireDate = new Date()
      expireDate.setDate(expireDate.getDate() + expiresInDays)
      expiresAt = expireDate.toISOString()
    }
    
    console.log('🔧 Creating invite code:', { code, logbookId, role, maxUses, expiresAt })

    // Create invite code
    const { error: insertError } = await supabase
      .from('invite_codes')
      .insert({
        code,
        logbook_id: logbookId,
        role,
        max_uses: maxUses,
        expires_at: expiresAt,
        created_by: user.id,
      })

    if (insertError) {
      console.error('Error creating invite code:', insertError)
      return {
        success: false,
        error: 'Failed to create invite code',
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const inviteUrl = `${baseUrl}/join/${code}`

    revalidatePath(`/logbook/${logbookId}/admin`)
    return {
      success: true,
      inviteCode: code,
      inviteUrl,
    }
  } catch (error) {
    console.error('Create invite code error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

export async function getInviteCodes(logbookId: string): Promise<InviteCodeListResult> {
  try {
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
        error: 'Only logbook parents can view invite codes',
      }
    }

    // Get invite codes for this logbook
    const { data: inviteCodes, error: inviteError } = await supabase
      .from('invite_codes')
      .select('id, code, role, max_uses, uses_count, expires_at, created_at')
      .eq('logbook_id', logbookId)
      .order('created_at', { ascending: false })

    if (inviteError) {
      console.error('Error fetching invite codes:', inviteError)
      return {
        success: false,
        error: 'Failed to fetch invite codes',
      }
    }

    return {
      success: true,
      inviteCodes: inviteCodes || [],
    }
  } catch (error) {
    console.error('Get invite codes error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

export async function deleteInviteCode(inviteCodeId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Get invite code and verify user is a parent of the logbook
    const { data: inviteCode, error: inviteError } = await supabase
      .from('invite_codes')
      .select(`
        id,
        logbook_id,
        logbook_members!inner(role)
      `)
      .eq('id', inviteCodeId)
      .eq('logbook_members.user_id', user.id)
      .single()

    if (inviteError || !inviteCode) {
      return {
        success: false,
        error: 'Invite code not found',
      }
    }

    // Verify user is a parent
    if (inviteCode.logbook_members?.role !== 'parent') {
      return {
        success: false,
        error: 'Only logbook parents can delete invite codes',
      }
    }

    // Delete the invite code
    const { error: deleteError } = await supabase
      .from('invite_codes')
      .delete()
      .eq('id', inviteCodeId)

    if (deleteError) {
      console.error('Error deleting invite code:', deleteError)
      return {
        success: false,
        error: 'Failed to delete invite code',
      }
    }

    revalidatePath(`/logbook/${inviteCode.logbook_id}/admin`)
    return { success: true }
  } catch (error) {
    console.error('Delete invite code error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}