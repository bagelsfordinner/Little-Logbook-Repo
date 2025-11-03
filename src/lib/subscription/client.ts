import { createClient } from '@/lib/supabase/client'

export interface SubscriptionStatus {
  hasAccess: boolean
  accessType: 'trial' | 'paid' | 'lifetime' | 'expired'
  daysRemaining?: number
  subscription?: {
    has_access: boolean
    access_type: string
    days_remaining?: number
    subscription?: unknown
  }
  isLoading: boolean
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return {
        hasAccess: false,
        accessType: 'expired',
        isLoading: false
      }
    }

    // Call the Supabase function we created
    const { data, error } = await supabase
      .rpc('get_user_subscription_status', { check_user_id: user.id })

    if (error) {
      console.error('Subscription status error:', error)
      return {
        hasAccess: false,
        accessType: 'expired',
        isLoading: false
      }
    }

    const statusData = data as {
      has_access: boolean
      access_type: 'trial' | 'paid' | 'lifetime' | 'expired'
      days_remaining?: number
      subscription?: unknown
    }
    
    return {
      hasAccess: statusData.has_access,
      accessType: statusData.access_type,
      daysRemaining: statusData.days_remaining,
      subscription: statusData.subscription,
      isLoading: false
    }

  } catch (error) {
    console.error('Failed to get subscription status:', error)
    return {
      hasAccess: false,
      accessType: 'expired',
      isLoading: false
    }
  }
}

export async function applyCouponCode(couponCode: string): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, message: 'Authentication required' }
    }

    const { data, error } = await supabase
      .rpc('apply_coupon_code', { 
        check_user_id: user.id, 
        coupon_code_input: couponCode 
      })

    if (error) {
      console.error('Coupon application error:', error)
      return { success: false, message: 'Failed to apply coupon' }
    }

    const result = data as { success: boolean; message: string }
    
    if (result.success) {
      return { 
        success: true, 
        message: result.coupon_type === 'lifetime_free' 
          ? 'Lifetime access granted!' 
          : result.message 
      }
    } else {
      return { success: false, message: result.error }
    }

  } catch (error) {
    console.error('Failed to apply coupon:', error)
    return { success: false, message: 'Failed to apply coupon' }
  }
}