import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { StripeService } from '@/lib/stripe/client'
import { stripeWebhookSecret } from '@/lib/stripe/config'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      console.error('No Stripe signature found')
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      )
    }

    let event: Stripe.Event
    try {
      event = StripeService.validateWebhook(body, signature, stripeWebhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    console.log('Received Stripe webhook:', event.type)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any

    switch (event.type) {
      case 'customer.subscription.created': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscription = event.data.object as any
        const userId = subscription.metadata.userId

        if (!userId) {
          console.error('No userId in subscription metadata')
          break
        }

        await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            stripe_price_id: subscription.items.data[0]?.price.id,
            status: subscription.status === 'trialing' ? 'trial' : 'active',
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            trial_ends_at: subscription.trial_end 
              ? new Date(subscription.trial_end * 1000).toISOString() 
              : null
          })

        console.log('Subscription created for user:', userId)
        break
      }

      case 'customer.subscription.updated': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscription = event.data.object as any
        const userId = subscription.metadata.userId

        if (!userId) {
          console.error('No userId in subscription metadata')
          break
        }

        await supabase
          .from('user_subscriptions')
          .update({
            status: subscription.status === 'trialing' ? 'trial' : subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            canceled_at: subscription.canceled_at 
              ? new Date(subscription.canceled_at * 1000).toISOString() 
              : null
          })
          .eq('stripe_subscription_id', subscription.id)

        console.log('Subscription updated for user:', userId)
        break
      }

      case 'customer.subscription.deleted': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscription = event.data.object as any

        await supabase
          .from('user_subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)

        console.log('Subscription canceled:', subscription.id)
        break
      }

      case 'invoice.payment_succeeded': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription as string

        if (subscriptionId) {
          // Get subscription to find user
          const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subscriptionId)
            .single()

          if (subscription) {
            // Record successful payment
            await supabase
              .from('billing_history')
              .insert({
                user_id: subscription.user_id,
                stripe_invoice_id: invoice.id,
                stripe_payment_intent_id: invoice.payment_intent as string,
                amount_cents: invoice.amount_paid,
                currency: invoice.currency,
                status: 'paid',
                period_start: new Date(invoice.period_start * 1000).toISOString(),
                period_end: new Date(invoice.period_end * 1000).toISOString(),
                description: invoice.description || 'Little Logbook Premium',
                invoice_url: invoice.hosted_invoice_url
              })

            // Ensure subscription is active
            await supabase
              .from('user_subscriptions')
              .update({ status: 'active' })
              .eq('stripe_subscription_id', subscriptionId)

            console.log('Payment succeeded for user:', subscription.user_id)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription as string

        if (subscriptionId) {
          const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subscriptionId)
            .single()

          if (subscription) {
            // Record failed payment
            await supabase
              .from('billing_history')
              .insert({
                user_id: subscription.user_id,
                stripe_invoice_id: invoice.id,
                amount_cents: invoice.amount_due,
                currency: invoice.currency,
                status: 'failed',
                description: invoice.description || 'Little Logbook Premium (Failed)'
              })

            // Update subscription status
            await supabase
              .from('user_subscriptions')
              .update({ status: 'past_due' })
              .eq('stripe_subscription_id', subscriptionId)

            console.log('Payment failed for user:', subscription.user_id)
          }
        }
        break
      }

      default:
        console.log('Unhandled webhook event:', event.type)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}