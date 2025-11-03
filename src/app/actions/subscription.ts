'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { StripeService } from '@/lib/stripe/client'
// Simple inline function to get price ID
function getStripePriceId(planId: 'family' | 'legacy', billingCycle: 'monthly' | 'yearly'): string {
  // This is a simplified implementation - in a real app you'd load this from config
  const priceIds = {
    family: {
      monthly: process.env.STRIPE_FAMILY_MONTHLY_PRICE_ID || '',
      yearly: process.env.STRIPE_FAMILY_YEARLY_PRICE_ID || ''
    },
    legacy: {
      monthly: process.env.STRIPE_LEGACY_MONTHLY_PRICE_ID || '',
      yearly: process.env.STRIPE_LEGACY_YEARLY_PRICE_ID || ''
    }
  }
  return priceIds[planId][billingCycle]
}
import { 
  SubscriptionPlan, 
  UserSubscription, 
  UserUsage, 
  BillingHistory,
  SubscriptionResponse,
  UsageResponse,
  PlansResponse,
  BillingResponse,
  UsageStatus,
  UsageWarning
} from '@/lib/types/subscription'

/**
 * Get all available subscription plans
 */
export async function getSubscriptionPlans(): Promise<PlansResponse> {
  try {
    const supabase = createAdminClient()
    
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')

    if (error) {
      throw error
    }

    return {
      success: true,
      data: plans as SubscriptionPlan[]
    }
  } catch (error) {
    console.error('Error fetching subscription plans:', error)
    return {
      success: false,
      error: 'Failed to fetch subscription plans'
    }
  }
}

/**
 * Get user's current subscription
 */
export async function getUserSubscription(): Promise<SubscriptionResponse> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }

    return {
      success: true,
      data: subscription as UserSubscription | undefined
    }
  } catch (error) {
    console.error('Error fetching user subscription:', error)
    return {
      success: false,
      error: 'Failed to fetch subscription'
    }
  }
}

/**
 * Get user's usage statistics
 */
export async function getUserUsage(): Promise<UsageResponse> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    // Trigger usage update first
    await supabase.rpc('update_user_usage_stats', { user_id: user.id })

    const { data: usage, error } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    // Create default usage if doesn't exist
    if (!usage) {
      const { data: newUsage, error: insertError } = await supabase
        .from('user_usage')
        .insert({
          user_id: user.id,
          logbooks_count: 0,
          storage_used_bytes: 0,
          total_members_count: 0,
          current_month_uploads: 0
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      return {
        success: true,
        data: newUsage as UserUsage
      }
    }

    return {
      success: true,
      data: usage as UserUsage
    }
  } catch (error) {
    console.error('Error fetching user usage:', error)
    return {
      success: false,
      error: 'Failed to fetch usage statistics'
    }
  }
}

/**
 * Get user's usage status with warnings
 */
export async function getUserUsageStatus(): Promise<{ success: boolean; error?: string; data?: UsageStatus }> {
  try {
    const [usageResult, subscriptionResult, plansResult] = await Promise.all([
      getUserUsage(),
      getUserSubscription(),
      getSubscriptionPlans()
    ])

    if (!usageResult.success || !usageResult.data) {
      throw new Error('Failed to fetch usage data')
    }

    if (!plansResult.success || !plansResult.data) {
      throw new Error('Failed to fetch plans data')
    }

    const usage = usageResult.data
    const subscription = subscriptionResult.data
    const planId = subscription?.plan_id || 'free'
    const plan = plansResult.data.find(p => p.id === planId)

    if (!plan) {
      throw new Error('Plan not found')
    }

    const limits = plan.limits
    const warnings: UsageWarning[] = []

    // Calculate usage percentages
    const logbooksUsagePercent = limits.logbooks === -1 ? 0 : (usage.logbooks_count / limits.logbooks) * 100
    const storageUsagePercent = (usage.storage_used_bytes / (limits.storage_gb * 1024 * 1024 * 1024)) * 100
    const membersUsagePercent = limits.members_per_logbook === -1 ? 0 : (usage.total_members_count / (limits.members_per_logbook * usage.logbooks_count || 1)) * 100
    const uploadsUsagePercent = limits.monthly_uploads === -1 ? 0 : (usage.current_month_uploads / limits.monthly_uploads) * 100

    // Check for warnings
    if (logbooksUsagePercent >= 80 && limits.logbooks !== -1) {
      warnings.push({
        type: 'logbooks',
        message: `You're using ${usage.logbooks_count} of ${limits.logbooks} logbooks`,
        severity: logbooksUsagePercent >= 95 ? 'critical' : 'warning',
        currentUsage: usage.logbooks_count,
        limit: limits.logbooks,
        usagePercent: logbooksUsagePercent
      })
    }

    if (storageUsagePercent >= 80) {
      warnings.push({
        type: 'storage',
        message: `Storage is ${storageUsagePercent.toFixed(1)}% full`,
        severity: storageUsagePercent >= 95 ? 'critical' : 'warning',
        currentUsage: usage.storage_used_bytes,
        limit: limits.storage_gb * 1024 * 1024 * 1024,
        usagePercent: storageUsagePercent
      })
    }

    if (uploadsUsagePercent >= 80 && limits.monthly_uploads !== -1) {
      warnings.push({
        type: 'uploads',
        message: `You've used ${usage.current_month_uploads} of ${limits.monthly_uploads} monthly uploads`,
        severity: uploadsUsagePercent >= 95 ? 'critical' : 'warning',
        currentUsage: usage.current_month_uploads,
        limit: limits.monthly_uploads,
        usagePercent: uploadsUsagePercent
      })
    }

    const isOverLimit = warnings.some(w => w.severity === 'critical')

    return {
      success: true,
      data: {
        usage,
        limits,
        logbooksUsagePercent,
        storageUsagePercent,
        membersUsagePercent,
        uploadsUsagePercent,
        isOverLimit,
        warnings
      }
    }
  } catch (error) {
    console.error('Error getting usage status:', error)
    return {
      success: false,
      error: 'Failed to get usage status'
    }
  }
}

/**
 * Create Stripe checkout session for subscription
 */
export async function createCheckoutSession(
  planId: 'family' | 'legacy',
  billingCycle: 'monthly' | 'yearly'
): Promise<{ success: boolean; error?: string; url?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    // Get user profile for customer creation
    const { error: profileError } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single()

    if (profileError) {
      throw profileError
    }

    // Check if user already has a Stripe customer
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    const priceId = getStripePriceId(planId, billingCycle)
    const successUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?subscription=success`
    const cancelUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?subscription=canceled`

    const session = await StripeService.createCheckoutSession({
      customerId: existingSubscription?.stripe_customer_id,
      priceId,
      successUrl,
      cancelUrl,
      userId: user.id
    })

    return {
      success: true,
      url: session.url || undefined
    }
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return {
      success: false,
      error: 'Failed to create checkout session'
    }
  }
}

/**
 * Create customer portal session
 */
export async function createCustomerPortalSession(): Promise<{ success: boolean; error?: string; url?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (error || !subscription?.stripe_customer_id) {
      throw new Error('No active subscription found')
    }

    const returnUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/billing`
    
    const session = await StripeService.createCustomerPortalSession(
      subscription.stripe_customer_id,
      returnUrl
    )

    return {
      success: true,
      url: session.url
    }
  } catch (error) {
    console.error('Error creating customer portal session:', error)
    return {
      success: false,
      error: 'Failed to create customer portal session'
    }
  }
}

/**
 * Get user's billing history
 */
export async function getBillingHistory(): Promise<BillingResponse> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    const { data: billing, error } = await supabase
      .from('billing_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      throw error
    }

    return {
      success: true,
      data: billing as BillingHistory[]
    }
  } catch (error) {
    console.error('Error fetching billing history:', error)
    return {
      success: false,
      error: 'Failed to fetch billing history'
    }
  }
}

/**
 * Check if user can perform action based on limits
 */
export async function checkUserLimit(
  action: 'create_logbook' | 'upload_media' | 'add_member'
): Promise<{ success: boolean; error?: string; canProceed?: boolean }> {
  try {
    const usageStatusResult = await getUserUsageStatus()
    if (!usageStatusResult.success || !usageStatusResult.data) {
      throw new Error('Failed to get usage status')
    }

    const { usage, limits } = usageStatusResult.data

    switch (action) {
      case 'create_logbook':
        if (limits.logbooks === -1) {
          return { success: true, canProceed: true }
        }
        return { 
          success: true, 
          canProceed: usage.logbooks_count < limits.logbooks,
          error: usage.logbooks_count >= limits.logbooks ? 'Logbook limit reached' : undefined
        }

      case 'upload_media':
        if (limits.monthly_uploads === -1) {
          return { success: true, canProceed: true }
        }
        return { 
          success: true, 
          canProceed: usage.current_month_uploads < limits.monthly_uploads,
          error: usage.current_month_uploads >= limits.monthly_uploads ? 'Monthly upload limit reached' : undefined
        }

      case 'add_member':
        if (limits.members_per_logbook === -1) {
          return { success: true, canProceed: true }
        }
        // This is a simplified check - in reality you'd check per-logbook
        return { success: true, canProceed: true }

      default:
        return { success: true, canProceed: true }
    }
  } catch (error) {
    console.error('Error checking user limit:', error)
    return {
      success: false,
      error: 'Failed to check limits'
    }
  }
}