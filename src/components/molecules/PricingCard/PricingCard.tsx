'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import { Loader } from '@/components/atoms/Loader'
import { SubscriptionPlan } from '@/lib/types/subscription'
import { createCheckoutSession } from '@/app/actions/subscription'
import styles from './PricingCard.module.css'

interface PricingCardProps {
  plan: SubscriptionPlan
  isCurrentPlan?: boolean
  isPopular?: boolean
  billingCycle: 'monthly' | 'yearly'
  onPlanSelect?: (planId: string) => void
  className?: string
}

export default function PricingCard({
  plan,
  isCurrentPlan = false,
  isPopular = false,
  billingCycle,
  onPlanSelect,
  className
}: PricingCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const price = billingCycle === 'monthly' 
    ? plan.price_monthly_cents 
    : plan.price_yearly_cents

  const formatPrice = (cents: number) => {
    if (cents === 0) return 'Free'
    return `$${(cents / 100).toFixed(2)}`
  }

  const formatPriceFrequency = () => {
    if (price === 0) return ''
    return billingCycle === 'monthly' ? '/month' : '/year'
  }

  const getYearlySavings = () => {
    if (plan.price_monthly_cents === 0) return null
    const monthlyYearly = plan.price_monthly_cents * 12
    const savings = monthlyYearly - plan.price_yearly_cents
    const savingsPercent = Math.round((savings / monthlyYearly) * 100)
    return { amount: savings, percent: savingsPercent }
  }

  const handleSelectPlan = async () => {
    if (plan.id === 'free' || isCurrentPlan) {
      onPlanSelect?.(plan.id)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const result = await createCheckoutSession(plan.id as 'family' | 'legacy', billingCycle)
      
      if (result.success && result.url) {
        window.location.href = result.url
      } else {
        setError(result.error || 'Failed to create checkout session')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const cardClass = [
    styles.card,
    isPopular && styles.popular,
    isCurrentPlan && styles.current,
    className
  ].filter(Boolean).join(' ')

  const features = Object.entries(plan.features)
    .filter(([, value]) => value === true)
    .map(([key]) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))

  const limits = Object.entries(plan.limits)

  const savings = getYearlySavings()

  return (
    <motion.div
      className={cardClass}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
    >
      {isPopular && (
        <div className={styles.popularBadge}>
          <Icon name="star" size="sm" />
          Most Popular
        </div>
      )}

      <div className={styles.header}>
        <h3 className={styles.planName}>{plan.display_name}</h3>
        <p className={styles.description}>{plan.description}</p>
      </div>

      <div className={styles.pricing}>
        <div className={styles.price}>
          <span className={styles.amount}>{formatPrice(price)}</span>
          <span className={styles.frequency}>{formatPriceFrequency()}</span>
        </div>
        
        {billingCycle === 'yearly' && savings && savings.percent > 0 && (
          <div className={styles.savings}>
            Save {savings.percent}% annually
          </div>
        )}
      </div>

      <div className={styles.features}>
        <h4 className={styles.featuresTitle}>What&apos;s included:</h4>
        <ul className={styles.featuresList}>
          {features.map((feature, index) => (
            <li key={index} className={styles.feature}>
              <Icon name="check" size="sm" className={styles.checkIcon} />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.limits}>
        <h4 className={styles.limitsTitle}>Plan limits:</h4>
        <ul className={styles.limitsList}>
          {limits.map(([key, value]) => (
            <li key={key} className={styles.limit}>
              <Icon name="help-circle" size="sm" className={styles.infoIcon} />
              <span className={styles.limitLabel}>
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
              </span>
              <span className={styles.limitValue}>
                {value === -1 ? 'Unlimited' : 
                 key.includes('storage') ? `${value}GB` :
                 key.includes('gb') ? `${value}GB` :
                 value.toString()}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {error && (
        <div className={styles.error}>
          <Icon name="alert-circle" size="sm" />
          {error}
        </div>
      )}

      <div className={styles.action}>
        <Button
          variant={isPopular ? 'primary' : isCurrentPlan ? 'secondary' : 'ghost'}
          fullWidth
          disabled={isLoading}
          onClick={handleSelectPlan}
          className={styles.selectButton}
        >
          {isLoading ? (
            <>
              <Loader size="sm" variant="spinner" />
              Processing...
            </>
          ) : isCurrentPlan ? (
            'Current Plan'
          ) : plan.id === 'free' ? (
            'Get Started Free'
          ) : (
            `Upgrade to ${plan.display_name}`
          )}
        </Button>
      </div>

      {isCurrentPlan && (
        <div className={styles.currentIndicator}>
          <Icon name="check-circle" size="sm" />
          Your current plan
        </div>
      )}
    </motion.div>
  )
}