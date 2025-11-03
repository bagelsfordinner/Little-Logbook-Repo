'use client'

import { motion } from 'framer-motion'
import styles from './Loader.module.css'

export type LoaderSize = 'sm' | 'md' | 'lg'
export type LoaderVariant = 'spinner' | 'pulse' | 'dots' | 'logbook' | 'heartbeat' | 'memory' | 'pages'

interface LoaderProps {
  size?: LoaderSize
  variant?: LoaderVariant
  text?: string
  center?: boolean
  className?: string
}

function Loader({ 
  size = 'md',
  variant = 'spinner',
  text, 
  center = false, 
  className 
}: LoaderProps) {
  const containerClass = [
    styles.container,
    center && styles.center,
    className
  ].filter(Boolean).join(' ')

  const renderLoader = () => {
    switch (variant) {
      case 'pulse':
        return (
          <motion.div
            className={styles.pulse}
            animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            data-size={size}
          />
        )
      
      case 'dots':
        return (
          <div className={styles.dots} data-size={size}>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={styles.dot}
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        )
      
      case 'logbook':
        return (
          <div className={styles.logbook} data-size={size}>
            <motion.div
              className={styles.bookCover}
              animate={{ rotateY: [0, 180, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className={styles.bookPages}
              animate={{ x: [-2, 2, -2] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        )
      
      case 'heartbeat':
        return (
          <div className={styles.heartbeat} data-size={size}>
            <motion.div
              className={styles.heart}
              animate={{ 
                scale: [1, 1.3, 1, 1.3, 1],
                opacity: [0.7, 1, 0.7, 1, 0.7]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              ❤️
            </motion.div>
          </div>
        )
      
      case 'memory':
        return (
          <div className={styles.memory} data-size={size}>
            {['📸', '📝', '🌟'].map((emoji, i) => (
              <motion.div
                key={i}
                className={styles.memoryIcon}
                animate={{ 
                  y: [0, -8, 0],
                  opacity: [0.5, 1, 0.5],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: "easeInOut"
                }}
              >
                {emoji}
              </motion.div>
            ))}
          </div>
        )
      
      case 'pages':
        return (
          <div className={styles.pages} data-size={size}>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={styles.page}
                animate={{ 
                  x: [0, 10, 0],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        )
      
      default: // spinner
        return (
          <motion.div
            className={styles.spinner}
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
            data-size={size}
          />
        )
    }
  }

  return (
    <div className={containerClass}>
      <div className={styles.loader} data-size={size} data-variant={variant}>
        {renderLoader()}
      </div>

      {text && (
        <motion.p 
          className={styles.text}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          data-size={size}
        >
          {text}
        </motion.p>
      )}
    </div>
  )
}

export { Loader }
export default Loader