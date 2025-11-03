import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { StripeService } from '@/lib/stripe/client'

export async function POST() {
  try {
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

    // Get user's subscription
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id, status')
      .eq('user_id', user.id)
      .single()

    if (error || !subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      )
    }

    // Don't allow portal access for lifetime users
    if (subscription.status === 'lifetime') {
      return NextResponse.json(
        { error: 'Lifetime users do not need billing management' },
        { status: 400 }
      )
    }

    // Create customer portal session
    const returnUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/billing`
    
    const session = await StripeService.createCustomerPortalSession(
      subscription.stripe_customer_id,
      returnUrl
    )

    return NextResponse.json({
      success: true,
      url: session.url
    })

  } catch (error) {
    console.error('Customer portal error:', error)
    return NextResponse.json(
      { error: 'Failed to create customer portal session' },
      { status: 500 }
    )
  }
}