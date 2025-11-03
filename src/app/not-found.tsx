'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Icon } from '@/components/atoms/Icon'
import styles from './not-found.module.css'

export default function NotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Animated Logbook Icon */}
        <motion.div
          className={styles.iconContainer}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.div
            className={styles.logbook}
            animate={{ 
              rotateY: [0, 10, 0],
              rotateX: [0, -5, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className={styles.logbookCover}>
              <div className={styles.logbookSpine}></div>
              <div className={styles.logbookPages}>
                <div className={styles.page}></div>
                <div className={styles.page}></div>
                <div className={styles.page}></div>
              </div>
              <motion.div 
                className={styles.logbookHeart}
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                ❤️
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Main Message */}
        <motion.div
          className={styles.message}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1 className={styles.title}>Page Not Found</h1>
          <p className={styles.subtitle}>
            Looks like this page has wandered off the beaten path. 
            <br />
            Let&apos;s get you back to your family adventures!
          </p>
        </motion.div>

        {/* Error Code */}
        <motion.div
          className={styles.errorCode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          404
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className={styles.actions}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Link href="/dashboard" className={styles.primaryButton}>
            <Icon name="home" size="sm" />
            Go to Dashboard
          </Link>
          
          <Link href="/create-logbook" className={styles.secondaryButton}>
            <Icon name="plus" size="sm" />
            Create New Logbook
          </Link>
        </motion.div>

        {/* Helpful Links */}
        <motion.div
          className={styles.helpfulLinks}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <p className={styles.helpText}>Popular destinations:</p>
          <div className={styles.linkGrid}>
            <Link href="/dashboard" className={styles.helpLink}>
              <Icon name="book-open" size="xs" />
              My Logbooks
            </Link>
            <Link href="/help" className={styles.helpLink}>
              <Icon name="help-circle" size="xs" />
              Help Center
            </Link>
            <Link href="/join" className={styles.helpLink}>
              <Icon name="users" size="xs" />
              Join Logbook
            </Link>
          </div>
        </motion.div>

        {/* Decorative Elements */}
        <div className={styles.decorations}>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className={styles.floatingIcon}
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 2) * 40}%`,
              }}
              animate={{
                y: [0, -10, 0],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2,
              }}
            >
              {['📸', '📝', '❤️', '🌟', '📚', '✨'][i]}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}