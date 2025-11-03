import Stripe from 'stripe'
import { stripeSecretKey } from './config'

// Initialize Stripe with secret key (server-side only)
export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-06-20',
  typescript: true,
})

// Helper functions for common Stripe operations
export class StripeService {
  
  /**
   * Create a Stripe customer
   */
  static async createCustomer(email: string, name: string, userId: string): Promise<Stripe.Customer> {
    return await stripe.customers.create({
      email,
      name,
      metadata: {
        userId
      }
    })
  }

  /**
   * Create a checkout session for subscription (simplified)
   */
  static async createCheckoutSession({
    customerId,
    priceId,
    successUrl,
    cancelUrl,
    userId,
    couponCode
  }: {
    customerId?: string
    priceId: string
    successUrl: string
    cancelUrl: string
    userId: string
    couponCode?: string
  }): Promise<Stripe.Checkout.Session> {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId
      },
      subscription_data: {
        trial_period_days: 7, // 7-day free trial
        metadata: {
          userId
        }
      }
    }

    // Add coupon if provided
    if (couponCode) {
      sessionParams.discounts = [{ coupon: couponCode }]
    }

    // If customer exists, use it; otherwise create one during checkout
    if (customerId) {
      sessionParams.customer = customerId
    } else {
      sessionParams.customer_creation = 'always'
    }

    return await stripe.checkout.sessions.create(sessionParams)
  }

  /**
   * Create customer portal session
   */
  static async createCustomerPortalSession(
    customerId: string, 
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })
  }

  /**
   * Get subscription by ID
   */
  static async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method', 'customer']
    })
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(subscriptionId: string, immediately = false): Promise<Stripe.Subscription> {
    if (immediately) {
      return await stripe.subscriptions.cancel(subscriptionId)
    } else {
      return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      })
    }
  }

  /**
   * Update subscription
   */
  static async updateSubscription(
    subscriptionId: string, 
    newPriceId: string
  ): Promise<Stripe.Subscription> {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    
    return await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'create_prorations',
    })
  }

  /**
   * Get customer by ID
   */
  static async getCustomer(customerId: string): Promise<Stripe.Customer> {
    const customer = await stripe.customers.retrieve(customerId)
    if (customer.deleted) {
      throw new Error('Customer has been deleted')
    }
    return customer as Stripe.Customer
  }

  /**
   * Get invoices for customer
   */
  static async getCustomerInvoices(
    customerId: string, 
    limit = 10
  ): Promise<Stripe.Invoice[]> {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit,
      status: 'paid'
    })
    return invoices.data
  }

  /**
   * Get upcoming invoice for customer
   */
  static async getUpcomingInvoice(customerId: string): Promise<Stripe.Invoice | null> {
    try {
      return await stripe.invoices.retrieveUpcoming({
        customer: customerId
      })
    } catch {
      // No upcoming invoice
      return null
    }
  }

  /**
   * Validate webhook signature
   */
  static validateWebhook(payload: string, signature: string, secret: string): Stripe.Event {
    return stripe.webhooks.constructEvent(payload, signature, secret)
  }

  /**
   * Get payment methods for customer
   */
  static async getCustomerPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card'
    })
    return paymentMethods.data
  }
}