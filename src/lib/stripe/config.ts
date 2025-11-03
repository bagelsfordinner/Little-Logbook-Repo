// Simplified Stripe configuration for single-tier subscription
export const stripeConfig = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  priceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || '',
}

// Stripe webhook signing secret
export const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

// Stripe secret key (server-side only)
export const stripeSecretKey = process.env.STRIPE_SECRET_KEY || ''

// Validate Stripe configuration
export function validateStripeConfig(): { isValid: boolean; missingKeys: string[] } {
  const missingKeys: string[] = []
  
  if (!stripeConfig.publishableKey) {
    missingKeys.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')
  }
  
  if (!stripeSecretKey) {
    missingKeys.push('STRIPE_SECRET_KEY')
  }
  
  if (!stripeWebhookSecret) {
    missingKeys.push('STRIPE_WEBHOOK_SECRET')
  }
  
  if (!stripeConfig.priceId) {
    missingKeys.push('STRIPE_PREMIUM_MONTHLY_PRICE_ID')
  }
  
  return {
    isValid: missingKeys.length === 0,
    missingKeys
  }
}

// Stripe URLs
export const stripeUrls = {
  billing: 'https://billing.stripe.com/p/login/',
  customerPortal: '/api/stripe/customer-portal',
  createSubscription: '/api/stripe/create-subscription',
  cancelSubscription: '/api/stripe/cancel-subscription',
  updateSubscription: '/api/stripe/update-subscription',
  webhook: '/api/stripe/webhook'
}