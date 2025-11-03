export interface SubscriptionPlan {
  id: 'free' | 'family' | 'legacy'
  name: string
  display_name: string
  description: string
  price_monthly_cents: number
  price_yearly_cents: number
  stripe_price_id_monthly?: string
  stripe_price_id_yearly?: string
  features: SubscriptionFeatures
  limits: SubscriptionLimits
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface SubscriptionFeatures {
  basic_themes?: boolean
  all_themes?: boolean
  custom_themes?: boolean
  community_support?: boolean
  priority_support?: boolean
  premium_support?: boolean
  mobile_app?: boolean
  advanced_media_tools?: boolean
  bulk_download?: boolean
  pdf_export?: boolean
  print_integration?: boolean
  analytics?: boolean
  all_features?: boolean
  unlimited_everything?: boolean
}

export interface SubscriptionLimits {
  logbooks: number // -1 for unlimited
  storage_gb: number
  members_per_logbook: number // -1 for unlimited
  monthly_uploads: number // -1 for unlimited
}

export interface UserSubscription {
  id: string
  user_id: string
  plan_id: 'free' | 'family' | 'legacy'
  stripe_customer_id?: string
  stripe_subscription_id?: string
  stripe_price_id?: string
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing'
  billing_cycle: 'monthly' | 'yearly'
  current_period_start?: string
  current_period_end?: string
  trial_end?: string
  canceled_at?: string
  created_at: string
  updated_at: string
}

export interface UserUsage {
  id: string
  user_id: string
  logbooks_count: number
  storage_used_bytes: number
  total_members_count: number
  current_month_uploads: number
  last_reset_at: string
  created_at: string
  updated_at: string
}

export interface BillingHistory {
  id: string
  user_id: string
  stripe_invoice_id?: string
  stripe_payment_intent_id?: string
  amount_cents: number
  currency: string
  status: 'paid' | 'pending' | 'failed' | 'refunded'
  description?: string
  invoice_url?: string
  period_start?: string
  period_end?: string
  created_at: string
}

// Utility types for components
export interface PlanComparison {
  plan: SubscriptionPlan
  isCurrentPlan: boolean
  isUpgrade: boolean
  isDowngrade: boolean
  canUpgrade: boolean
}

export interface UsageStatus {
  usage: UserUsage
  limits: SubscriptionLimits
  logbooksUsagePercent: number
  storageUsagePercent: number
  membersUsagePercent: number
  uploadsUsagePercent: number
  isOverLimit: boolean
  warnings: UsageWarning[]
}

export interface UsageWarning {
  type: 'logbooks' | 'storage' | 'members' | 'uploads'
  message: string
  severity: 'warning' | 'critical'
  currentUsage: number
  limit: number
  usagePercent: number
}

// Stripe-related types
export interface StripeConfig {
  publishableKey: string
  priceIds: {
    family_monthly: string
    family_yearly: string
    legacy_monthly: string
    legacy_yearly: string
  }
}

export interface PaymentIntent {
  client_secret: string
  status: string
}

export interface SubscriptionCheckout {
  plan_id: 'family' | 'legacy'
  billing_cycle: 'monthly' | 'yearly'
  success_url: string
  cancel_url: string
}

// API Response types
export interface SubscriptionResponse {
  success: boolean
  error?: string
  data?: UserSubscription
}

export interface UsageResponse {
  success: boolean
  error?: string
  data?: UserUsage
}

export interface PlansResponse {
  success: boolean
  error?: string
  data?: SubscriptionPlan[]
}

export interface BillingResponse {
  success: boolean
  error?: string
  data?: BillingHistory[]
}

// Webhook types for Stripe
export interface StripeWebhookEvent {
  id: string
  type: string
  data: {
    object: unknown
  }
}

export type StripeEventType = 
  | 'customer.subscription.created'
  | 'customer.subscription.updated' 
  | 'customer.subscription.deleted'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed'
  | 'customer.created'
  | 'customer.updated'