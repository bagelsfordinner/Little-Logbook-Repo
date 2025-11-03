'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/atoms/Button'
import { Icon, type IconName } from '@/components/atoms/Icon'
import { Loader } from '@/components/atoms/Loader'
import { ProgressBar } from '@/components/atoms/ProgressBar'
import { getUserUsageStatus, createCustomerPortalSession } from '@/app/actions/subscription'
import { UsageStatus, UsageWarning } from '@/lib/types/subscription'
import styles from './UsageDashboard.module.css'

interface UsageDashboardProps {
  className?: string
  showUpgradePrompts?: boolean
}

export default function UsageDashboard({ 
  className, 
  showUpgradePrompts = true 
}: UsageDashboardProps) {
  const [usageStatus, setUsageStatus] = useState<UsageStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isPortalLoading, setIsPortalLoading] = useState(false)

  useEffect(() => {
    loadUsageStatus()
  }, [])

  const loadUsageStatus = async () => {
    try {
      setIsLoading(true)
      const result = await getUserUsageStatus()
      
      if (result.success && result.data) {
        setUsageStatus(result.data)
      } else {
        setError(result.error || 'Failed to load usage data')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleManageBilling = async () => {
    try {
      setIsPortalLoading(true)
      const result = await createCustomerPortalSession()
      
      if (result.success && result.url) {
        window.location.href = result.url
      } else {
        setError(result.error || 'Failed to open billing portal')
      }
    } catch {
      setError('Failed to open billing portal')
    } finally {
      setIsPortalLoading(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatLimitValue = (key: string, value: number) => {
    if (value === -1) return 'Unlimited'
    if (key.includes('storage') || key.includes('gb')) return `${value}GB`
    return value.toString()
  }

  // Helper function for future usage color implementation
  // const getUsageColor = (percent: number) => {
  //   if (percent >= 95) return 'var(--color-error)'
  //   if (percent >= 80) return 'var(--color-warning)'
  //   return 'var(--color-success)'
  // }

  if (isLoading) {
    return (
      <div className={`${styles.container} ${className || ''}`}>
        <div className={styles.loading}>
          <Loader size="lg" variant="heartbeat" />
          <p>Loading usage data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${styles.container} ${className || ''}`}>
        <div className={styles.error}>
          <Icon name="alert-circle" size="lg" />
          <h3>Error loading usage data</h3>
          <p>{error}</p>
          <Button variant="secondary" onClick={loadUsageStatus}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!usageStatus) {
    return null
  }

  const { usage, limits, warnings, isOverLimit } = usageStatus

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>Usage Overview</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleManageBilling}
          disabled={isPortalLoading}
        >
          {isPortalLoading ? (
            <>
              <Loader size="sm" variant="spinner" />
              Loading...
            </>
          ) : (
            <>
              <Icon name="settings" size="sm" />
              Manage Billing
            </>
          )}
        </Button>
      </div>

      {/* Warnings */}
      <AnimatePresence>
        {warnings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={styles.warnings}
          >
            {warnings.map((warning, index) => (
              <WarningCard key={warning.type} warning={warning} index={index} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Usage Cards */}
      <div className={styles.grid}>
        <UsageCard
          title="Logbooks"
          icon="book-open"
          current={usage.logbooks_count}
          limit={limits.logbooks}
          percent={usageStatus.logbooksUsagePercent}
          description="Family logbooks created"
        />
        
        <UsageCard
          title="Storage"
          icon="hard-drive"
          current={formatBytes(usage.storage_used_bytes)}
          limit={formatLimitValue('storage_gb', limits.storage_gb)}
          percent={usageStatus.storageUsagePercent}
          description="Photos and videos stored"
        />
        
        <UsageCard
          title="Members"
          icon="users"
          current={usage.total_members_count}
          limit={limits.members_per_logbook === -1 ? 'Unlimited' : `${limits.members_per_logbook} per logbook`}
          percent={usageStatus.membersUsagePercent}
          description="Total family members"
        />
        
        <UsageCard
          title="Monthly Uploads"
          icon="upload"
          current={usage.current_month_uploads}
          limit={limits.monthly_uploads}
          percent={usageStatus.uploadsUsagePercent}
          description="Photos uploaded this month"
        />
      </div>

      {/* Upgrade Prompt */}
      {showUpgradePrompts && isOverLimit && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.upgradePrompt}
        >
          <div className={styles.upgradeContent}>
            <Icon name="arrow-up" size="lg" className={styles.upgradeIcon} />
            <div className={styles.upgradeText}>
              <h3>Time to upgrade!</h3>
              <p>You&apos;ve reached your plan limits. Upgrade to continue adding memories.</p>
            </div>
            <Button variant="primary" href="/pricing">
              View Plans
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Usage Card Component
interface UsageCardProps {
  title: string
  icon: IconName
  current: string | number
  limit: string | number
  percent: number
  description: string
}

function UsageCard({ title, icon, current, limit, percent, description }: UsageCardProps) {
  const isUnlimited = limit === -1 || limit === 'Unlimited'
  const displayPercent = isUnlimited ? 0 : Math.min(percent, 100)
  
  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.cardHeader}>
        <Icon name={icon} size="md" className={styles.cardIcon} />
        <h3 className={styles.cardTitle}>{title}</h3>
      </div>
      
      <div className={styles.cardContent}>
        <div className={styles.usage}>
          <span className={styles.current}>{current}</span>
          {!isUnlimited && (
            <span className={styles.separator}>of</span>
          )}
          <span className={styles.limit}>
            {typeof limit === 'number' && limit === -1 ? 'Unlimited' : limit}
          </span>
        </div>
        
        {!isUnlimited && (
          <div className={styles.progressContainer}>
            <ProgressBar
              value={displayPercent}
              max={100}
              color={getUsageColor(displayPercent)}
              height={8}
              className={styles.progress}
            />
            <span className={styles.percent}>{Math.round(displayPercent)}%</span>
          </div>
        )}
        
        <p className={styles.description}>{description}</p>
      </div>
    </motion.div>
  )
}

// Warning Card Component
interface WarningCardProps {
  warning: UsageWarning
  index: number
}

function WarningCard({ warning, index }: WarningCardProps) {
  const severityIcon = warning.severity === 'critical' ? 'alert-triangle' : 'alert-circle'
  const severityClass = warning.severity === 'critical' ? styles.critical : styles.warning
  
  return (
    <motion.div
      className={`${styles.warningCard} ${severityClass}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Icon name={severityIcon} size="md" className={styles.warningIcon} />
      <div className={styles.warningContent}>
        <p className={styles.warningMessage}>{warning.message}</p>
        <span className={styles.warningPercent}>
          {Math.round(warning.usagePercent)}% used
        </span>
      </div>
    </motion.div>
  )
}