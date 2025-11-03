import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { StripeService } from '@/lib/stripe/client'
import { stripeConfig } from '@/lib/stripe/config'

export async function POST(request: NextRequest) {
  try {
    const { couponCode } = await request.json()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Check if user already has a subscription
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id, status')
      .eq('user_id', user.id)
      .single()

    // If user already has active subscription, redirect to customer portal
    if (existingSubscription?.status === 'active') {
      return NextResponse.json(
        { error: 'User already has an active subscription' },
        { status: 400 }
      )
    }

    // Validate coupon if provided
    let validCoupon = null
    if (couponCode) {
      const { data: coupon } = await supabase
        .from('coupon_codes')
        .select('*')
        .eq('code', couponCode)
        .eq('is_active', true)
        .single()
      
      if (coupon && coupon.used_count < coupon.max_uses) {
        if (!coupon.expires_at || new Date(coupon.expires_at) > new Date()) {
          validCoupon = coupon
        }
      }
    }

    // Create Stripe checkout session
    const successUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?subscription=success`
    const cancelUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?subscription=canceled`

    const session = await StripeService.createCheckoutSession({
      customerId: existingSubscription?.stripe_customer_id,
      priceId: stripeConfig.priceId,
      successUrl,
      cancelUrl,
      userId: user.id,
      couponCode: validCoupon?.code
    })

    // If using a lifetime coupon, apply it immediately
    if (validCoupon?.type === 'lifetime_free') {
      // Create or update subscription with lifetime status
      await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          status: 'lifetime',
          coupon_code: validCoupon.code,
          coupon_applied_at: new Date().toISOString()
        })

      // Update coupon usage
      await supabase
        .from('coupon_codes')
        .update({ used_count: validCoupon.used_count + 1 })
        .eq('id', validCoupon.id)

      return NextResponse.json({
        success: true,
        message: 'Lifetime access granted!',
        redirect: '/dashboard?subscription=lifetime'
      })
    }

    return NextResponse.json({
      success: true,
      url: session.url
    })

  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}