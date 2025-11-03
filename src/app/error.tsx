'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@/components/atoms/Icon'
import styles from './error.module.css'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error monitoring service
    console.error('Application Error:', error)
    
    // You could send this to error tracking service like Sentry
    // trackError(error)
  }, [error])

  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Animated Error Icon */}
        <motion.div
          className={styles.iconContainer}
          initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            className={styles.errorIcon}
            animate={{ 
              y: [0, -5, 0],
              rotate: [0, 2, -2, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className={styles.brokenLogbook}>
              <div className={styles.logbookLeft}>
                <div className={styles.spine}></div>
                <div className={styles.pages}>
                  <div className={styles.page}></div>
                  <div className={styles.page}></div>
                </div>
              </div>
              
              <motion.div 
                className={styles.logbookRight}
                animate={{ 
                  x: [0, 2, 0],
                  rotate: [0, 1, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <div className={styles.pages}>
                  <div className={styles.page}></div>
                  <div className={styles.page}></div>
                </div>
              </motion.div>
              
              <motion.div 
                className={styles.crackedHeart}
                animate={{ 
                  scale: [1, 1.05, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                💔
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Error Message */}
        <motion.div
          className={styles.message}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h1 className={styles.title}>Oops! Something went wrong</h1>
          <p className={styles.subtitle}>
            Don&apos;t worry - your precious memories are safe. 
            <br />
            Let&apos;s get your logbook back on track!
          </p>
        </motion.div>

        {/* Error Details (Development Only) */}
        {isDevelopment && (
          <motion.div
            className={styles.errorDetails}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <details className={styles.details}>
              <summary className={styles.detailsSummary}>
                <Icon name="settings" size="sm" />
                Error Details (Development Mode)
              </summary>
              <div className={styles.detailsContent}>
                <p className={styles.errorName}>{error.name}</p>
                <p className={styles.errorMessage}>{error.message}</p>
                {error.digest && (
                  <p className={styles.errorDigest}>
                    Error ID: <code>{error.digest}</code>
                  </p>
                )}
                {error.stack && (
                  <pre className={styles.errorStack}>{error.stack}</pre>
                )}
              </div>
            </details>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          className={styles.actions}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <button 
            onClick={reset}
            className={styles.primaryButton}
          >
            <Icon name="settings" size="sm" />
            Try Again
          </button>
          
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className={styles.secondaryButton}
          >
            <Icon name="home" size="sm" />
            Go to Dashboard
          </button>
        </motion.div>

        {/* Help Section */}
        <motion.div
          className={styles.helpSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <p className={styles.helpText}>
            Still having trouble? Here are some quick fixes:
          </p>
          
          <div className={styles.helpGrid}>
            <div className={styles.helpItem}>
              <Icon name="settings" size="sm" />
              <div>
                <strong>Refresh the page</strong>
                <p>Sometimes a simple refresh fixes the issue</p>
              </div>
            </div>
            
            <div className={styles.helpItem}>
              <Icon name="settings" size="sm" />
              <div>
                <strong>Check your connection</strong>
                <p>Make sure you&apos;re connected to the internet</p>
              </div>
            </div>
            
            <div className={styles.helpItem}>
              <Icon name="settings" size="sm" />
              <div>
                <strong>Contact support</strong>
                <p>We&apos;re here to help get you back on track</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Floating Elements */}
        <div className={styles.decorations}>
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className={styles.floatingElement}
              style={{
                left: `${10 + i * 12}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
              animate={{
                y: [0, -15, 0],
                opacity: [0.2, 0.5, 0.2],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 4 + i * 0.3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.4,
              }}
            >
              {['⚠️', '🔧', '💻', '🔄', '❓', '🆘', '⚡', '🛠️'][i]}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}