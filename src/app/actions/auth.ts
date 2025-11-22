'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

export interface AuthResult {
  success: boolean
  error?: string
  logbookSlug?: string
}

export interface InviteValidationResult {
  valid: boolean
  error?: string
  logbookName?: string
  role?: string
}

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1, 'Display name is required'),
  logbookName: z.string().min(1, 'Logbook name is required'),
  logbookSlug: z.string().min(1, 'Logbook slug is required'),
})

const signUpWithInviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1, 'Display name is required'),
  inviteCode: z.string().min(1, 'Invite code is required'),
})

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export async function signUp(
  email: string,
  password: string,
  displayName: string,
  logbookName: string,
  logbookSlug: string
): Promise<AuthResult> {
  console.log('🚀 Starting signup process...', { email, displayName, logbookName, logbookSlug })
  
  try {
    // Validate inputs
    const validation = signUpSchema.safeParse({
      email,
      password,
      displayName,
      logbookName,
      logbookSlug,
    })

    if (!validation.success) {
      console.error('❌ Validation failed:', validation.error.issues)
      return {
        success: false,
        error: validation.error.issues[0]?.message || 'Invalid input',
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any
    console.log('✅ Supabase client created')

    // Check if slug is already taken
    try {
      const { data: existingLogbook, error: slugCheckError } = await supabase
        .from('logbooks')
        .select('id')
        .eq('slug', logbookSlug)
        .single()

      if (slugCheckError && slugCheckError.code !== 'PGRST116') {
        // PGRST116 is "not found" which is what we want
        console.error('❌ Error checking slug availability:', slugCheckError)
        return {
          success: false,
          error: 'Failed to check logbook URL availability',
        }
      }

      if (existingLogbook) {
        console.log('❌ Slug already taken:', logbookSlug)
        return {
          success: false,
          error: `Logbook URL '${logbookSlug}' is already taken`,
        }
      }
      
      console.log('✅ Slug is available:', logbookSlug)
    } catch (slugError) {
      console.error('❌ Exception checking slug:', slugError)
      return {
        success: false,
        error: 'Failed to verify logbook URL availability',
      }
    }

    // Step 1: Sign up the user
    let userId: string
    try {
      console.log('📝 Creating auth user...')
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        console.error('❌ Auth signup error:', authError)
        if (authError.message.includes('already registered')) {
          return {
            success: false,
            error: 'Email already in use',
          }
        }
        return {
          success: false,
          error: `Failed to create account: ${authError.message}`,
        }
      }

      if (!authData.user) {
        console.error('❌ No user returned from auth signup')
        return {
          success: false,
          error: 'Failed to create account - no user returned',
        }
      }

      userId = authData.user.id
      console.log('✅ Auth user created:', userId)
    } catch (authException) {
      console.error('❌ Exception during auth signup:', authException)
      return {
        success: false,
        error: 'Unexpected error during account creation',
      }
    }

    // Step 2: Create profile record using admin client (bypasses RLS)
    // Note: This happens AFTER auth.signUp creates the auth.users record
    // We use admin client because the user session isn't established yet
    try {
      console.log('👤 Creating user profile...')
      const adminSupabase = createAdminClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: profileError } = await (adminSupabase as any)
        .from('profiles')
        .insert({
          id: userId,
          display_name: displayName,
          avatar_url: null,
        })

      if (profileError) {
        console.error('❌ Profile creation error:', profileError)
        return {
          success: false,
          error: `Failed to create user profile: ${profileError.message}`,
        }
      }
      
      console.log('✅ Profile created successfully')
    } catch (profileException) {
      console.error('❌ Exception during profile creation:', profileException)
      return {
        success: false,
        error: 'Unexpected error creating user profile',
      }
    }

    // Step 3: Create logbook record using admin client (bypasses RLS)
    // Note: We use admin client because the user session context isn't established yet
    const adminSupabase2 = createAdminClient()
    let logbookId: string
    try {
      console.log('📚 Creating logbook...')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: logbookData, error: logbookError } = await (adminSupabase2 as any)
        .from('logbooks')
        .insert({
          name: logbookName,
          slug: logbookSlug,
          created_by: userId,
        })
        .select()
        .single()

      if (logbookError) {
        console.error('❌ Logbook creation error:', logbookError)
        return {
          success: false,
          error: `Failed to create logbook: ${logbookError.message}`,
        }
      }

      if (!logbookData) {
        console.error('❌ No logbook data returned')
        return {
          success: false,
          error: 'Failed to create logbook - no data returned',
        }
      }

      logbookId = logbookData.id
      console.log('✅ Logbook created:', logbookId)
    } catch (logbookException) {
      console.error('❌ Exception during logbook creation:', logbookException)
      return {
        success: false,
        error: 'Unexpected error creating logbook',
      }
    }

    // Step 4: Create logbook_members record with parent role using admin client
    // Note: We use admin client because the user session context isn't established yet
    try {
      console.log('👨‍👩‍👧‍👦 Adding user as parent...')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: memberError } = await (adminSupabase2 as any)
        .from('logbook_members')
        .insert({
          logbook_id: logbookId,
          user_id: userId,
          role: 'parent',
        })

      if (memberError) {
        console.error('❌ Member creation error:', memberError)
        return {
          success: false,
          error: `Failed to add you as logbook admin: ${memberError.message}`,
        }
      }
      
      console.log('✅ User added as parent successfully')
    } catch (memberException) {
      console.error('❌ Exception during member creation:', memberException)
      return {
        success: false,
        error: 'Unexpected error adding you to logbook',
      }
    }

    console.log('🎉 Signup complete!')
    revalidatePath('/')
    return {
      success: true,
      logbookSlug,
    }
  } catch (error) {
    console.error('❌ Unexpected signup error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred during signup',
    }
  }
}

export async function signUpWithInvite(
  email: string,
  password: string,
  displayName: string,
  inviteCode: string
): Promise<AuthResult> {
  console.log('\n======== SIGNUP WITH INVITE START ========')
  console.log('🚀 [SIGNUP_INVITE] Starting signup process with:', {
    email,
    displayName,
    inviteCode,
    passwordLength: password?.length
  })
  
  try {
    // Validate inputs
    console.log('📋 [SIGNUP_INVITE] Validating input schema...')
    const validation = signUpWithInviteSchema.safeParse({
      email,
      password,
      displayName,
      inviteCode,
    })

    if (!validation.success) {
      console.log('❌ [SIGNUP_INVITE] Schema validation failed:', validation.error.issues)
      return {
        success: false,
        error: validation.error.issues[0]?.message || 'Invalid input',
      }
    }
    console.log('✅ [SIGNUP_INVITE] Schema validation passed')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any
    console.log('✅ [SIGNUP_INVITE] Supabase client created')

    // Validate invite code
    console.log('🔍 [SIGNUP_INVITE] Re-validating invite code in signup process:', inviteCode)
    const { data: inviteData, error: inviteError } = await supabase
      .from('invite_codes')
      .select(`
        id,
        logbook_id,
        role,
        max_uses,
        uses_count,
        expires_at,
        logbooks (
          name,
          slug
        )
      `)
      .eq('code', inviteCode)
      .single()

    console.log('📊 [SIGNUP_INVITE] Invite validation result:', { inviteData, inviteError })
    
    if (inviteError || !inviteData) {
      console.log('❌ [SIGNUP_INVITE] Invite code validation failed during signup')
      return {
        success: false,
        error: 'Invalid invite code',
      }
    }
    console.log('✅ [SIGNUP_INVITE] Invite code validated successfully')

    // Check if invite code is expired
    if (inviteData.expires_at && new Date(inviteData.expires_at) < new Date()) {
      return {
        success: false,
        error: 'Invite code has expired',
      }
    }

    // Check if invite code has remaining uses
    if (inviteData.max_uses && inviteData.uses_count >= inviteData.max_uses) {
      return {
        success: false,
        error: 'Invite code has reached maximum uses',
      }
    }

    // Sign up the user
    console.log('👤 [SIGNUP_INVITE] Creating auth user account...')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    console.log('📊 [SIGNUP_INVITE] Auth signup result:', {
      hasAuthData: !!authData,
      hasUser: !!authData?.user,
      userId: authData?.user?.id,
      authError: authError
    })

    if (authError || !authData.user) {
      console.log('❌ [SIGNUP_INVITE] Auth user creation failed:', authError)
      return {
        success: false,
        error: authError?.message || 'Failed to create account',
      }
    }

    const userId = authData.user.id
    console.log('✅ [SIGNUP_INVITE] Auth user created successfully:', userId)

    // Create profile record using admin client (bypasses RLS)
    console.log('📝 [SIGNUP_INVITE] Creating user profile with admin client...')
    console.log('📋 [SIGNUP_INVITE] Profile data:', { id: userId, display_name: displayName })
    
    const adminClient = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: profileError } = await (adminClient as any)
      .from('profiles')
      .insert({
        id: userId,
        display_name: displayName,
        avatar_url: null,
      })

    console.log('📊 [SIGNUP_INVITE] Profile creation result:', { profileError })

    if (profileError) {
      console.log('❌ [SIGNUP_INVITE] Profile creation failed:', profileError)
      return {
        success: false,
        error: `Failed to create user profile: ${profileError.message}`,
      }
    }
    console.log('✅ [SIGNUP_INVITE] Profile created successfully')

    // Create logbook_members record with role from invite
    console.log('👥 [SIGNUP_INVITE] Adding user to logbook as member...')
    console.log('📋 [SIGNUP_INVITE] Member data:', {
      logbook_id: inviteData.logbook_id,
      user_id: userId,
      role: inviteData.role
    })
    
    const { error: memberError } = await supabase
      .from('logbook_members')
      .insert({
        logbook_id: inviteData.logbook_id,
        user_id: userId,
        role: inviteData.role,
      })

    console.log('📊 [SIGNUP_INVITE] Member insertion result:', { 
      memberError,
      errorCode: memberError?.code,
      errorMessage: memberError?.message,
      errorDetails: memberError?.details
    })

    if (memberError) {
      console.log('❌ [SIGNUP_INVITE] Failed to add user to logbook:', {
        error: memberError,
        logbook_id: inviteData.logbook_id,
        user_id: userId,
        role: inviteData.role
      })
      return {
        success: false,
        error: 'Failed to add user to logbook',
      }
    }
    console.log('✅ [SIGNUP_INVITE] User added to logbook successfully')

    // Increment invite code uses
    console.log('🔢 [SIGNUP_INVITE] Incrementing invite code usage count...')
    const newUsesCount = inviteData.uses_count + 1
    console.log('📋 [SIGNUP_INVITE] Usage update:', {
      currentCount: inviteData.uses_count,
      newCount: newUsesCount,
      inviteId: inviteData.id
    })
    
    const { error: updateError } = await supabase
      .from('invite_codes')
      .update({
        uses_count: newUsesCount,
      })
      .eq('id', inviteData.id)

    console.log('📊 [SIGNUP_INVITE] Usage count update result:', { updateError })

    if (updateError) {
      console.error('❌ [SIGNUP_INVITE] Failed to update invite code uses:', updateError)
    } else {
      console.log('✅ [SIGNUP_INVITE] Invite code usage count updated successfully')
    }

    console.log('🎉 [SIGNUP_INVITE] Signup process completed successfully!')
    console.log('📋 [SIGNUP_INVITE] Final result:', {
      logbookSlug: inviteData.logbooks?.slug,
      userId: userId,
      role: inviteData.role
    })
    
    revalidatePath('/')
    return {
      success: true,
      logbookSlug: inviteData.logbooks?.slug,
    }
  } catch (error) {
    console.error('💥 [SIGNUP_INVITE] Unexpected error during signup:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : null
    })
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  } finally {
    console.log('======== SIGNUP WITH INVITE END ========\n')
  }
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    // Validate inputs
    const validation = signInSchema.safeParse({ email, password })

    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || 'Invalid input',
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    revalidatePath('/')
    return {
      success: true,
    }
  } catch (error) {
    console.error('Sign in error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

export async function signOut(): Promise<AuthResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any

    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    revalidatePath('/')
    redirect('/')
  } catch (error) {
    console.error('Sign out error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

export async function validateInviteCode(code: string): Promise<InviteValidationResult> {
  console.log('\n======== INVITE CODE VALIDATION START ========')
  try {
    console.log('🔍 [VALIDATE] Input received:', { 
      code, 
      codeType: typeof code, 
      codeLength: code?.length,
      codeCharCodes: code ? Array.from(code).map(c => c.charCodeAt(0)) : null
    })
    
    if (!code) {
      console.log('❌ [VALIDATE] No invite code provided')
      return {
        valid: false,
        error: 'Invite code is required',
      }
    }

    console.log('📞 [VALIDATE] Creating Supabase client...')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any
    console.log('✅ [VALIDATE] Supabase client created successfully')
    
    console.log('📝 [VALIDATE] Executing database query with code:', code)
    console.log('📝 [VALIDATE] SQL Query: SELECT id, role, max_uses, uses_count, expires_at, logbooks(name) FROM invite_codes WHERE code = \'', code, '\'')

    const { data: inviteData, error: inviteError } = await supabase
      .from('invite_codes')
      .select(`
        id,
        role,
        max_uses,
        uses_count,
        expires_at,
        logbooks (
          name
        )
      `)
      .eq('code', code)
      .single()
      
    console.log('📊 [VALIDATE] Raw database response:', { 
      inviteData, 
      inviteError,
      errorCode: inviteError?.code,
      errorMessage: inviteError?.message,
      errorDetails: inviteError?.details
    })

    if (inviteError || !inviteData) {
      console.log('❌ [VALIDATE] Query failed or no data returned')
      console.log('❌ [VALIDATE] Error details:', {
        hasError: !!inviteError,
        hasData: !!inviteData,
        errorCode: inviteError?.code,
        errorMessage: inviteError?.message
      })
      return {
        valid: false,
        error: 'Invalid invite code',
      }
    }
    
    console.log('✅ [VALIDATE] Data found, checking validity conditions')
    console.log('📝 [VALIDATE] Invite data:', {
      id: inviteData.id,
      role: inviteData.role,
      max_uses: inviteData.max_uses,
      uses_count: inviteData.uses_count,
      expires_at: inviteData.expires_at,
      logbooks: inviteData.logbooks,
      logbook_name: inviteData.logbooks?.name,
      hasLogbooks: !!inviteData.logbooks,
      logbooksType: typeof inviteData.logbooks
    })

    // Check if invite code is expired
    if (inviteData.expires_at) {
      const expiryDate = new Date(inviteData.expires_at)
      const currentDate = new Date()
      console.log('🕓 [VALIDATE] Checking expiration:', {
        expires_at: inviteData.expires_at,
        expiryDate: expiryDate.toISOString(),
        currentDate: currentDate.toISOString(),
        isExpired: expiryDate < currentDate
      })
      
      if (expiryDate < currentDate) {
        console.log('❌ [VALIDATE] Invite code has expired')
        return {
          valid: false,
          error: 'Invite code has expired',
        }
      }
    } else {
      console.log('✅ [VALIDATE] No expiration date set')
    }

    // Check if invite code has remaining uses
    console.log('🔢 [VALIDATE] Checking usage limits:', {
      max_uses: inviteData.max_uses,
      uses_count: inviteData.uses_count,
      hasMaxUses: !!inviteData.max_uses,
      isAtLimit: inviteData.max_uses && inviteData.uses_count >= inviteData.max_uses
    })
    
    if (inviteData.max_uses && inviteData.uses_count >= inviteData.max_uses) {
      console.log('❌ [VALIDATE] Invite code has reached maximum uses')
      return {
        valid: false,
        error: 'Invite code has reached maximum uses',
      }
    }
    
    console.log('🎉 [VALIDATE] All checks passed, invite code is valid!')
    const result = {
      valid: true,
      logbookName: inviteData.logbooks?.name,
      role: inviteData.role,
    }
    console.log('📎 [VALIDATE] Returning result:', result)
    return result
  } catch (error) {
    console.error('💥 [VALIDATE] Unexpected error occurred:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : null
    })
    return {
      valid: false,
      error: 'An unexpected error occurred',
    }
  } finally {
    console.log('======== INVITE CODE VALIDATION END ========\n')
  }
}

export async function checkSlugAvailability(slug: string): Promise<{ available: boolean }> {
  try {
    if (!slug) {
      return { available: false }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any

    const { data } = await supabase
      .from('logbooks')
      .select('id')
      .eq('slug', slug)
      .single()

    return { available: !data }
  } catch (error) {
    console.error('Check slug availability error:', error)
    return { available: false }
  }
}