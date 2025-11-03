'use client'

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader } from '../Loader'
import { Icon } from '../Icon'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'warning' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'
export type ButtonState = 'default' | 'loading' | 'success' | 'error'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  state?: ButtonState
  children: ReactNode
  fullWidth?: boolean
  successText?: string
  errorText?: string
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary',
    size = 'md',
    loading = false,
    state = 'default',
    disabled,
    children,
    fullWidth = false,
    successText,
    errorText,
    className,
    type = 'button',
    ...props
  }, ref) => {
    const currentState = loading ? 'loading' : state
    const isDisabled = disabled || currentState === 'loading'

    const buttonClass = [
      styles.button,
      fullWidth && styles.fullWidth,
      className
    ].filter(Boolean).join(' ')

    const getStateContent = () => {
      switch (currentState) {
        case 'loading':
          return (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={styles.stateContent}
            >
              <Loader size={size === 'sm' ? 'sm' : 'sm'} />
              <span>Loading...</span>
            </motion.div>
          )
        case 'success':
          return (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={styles.stateContent}
            >
              <Icon name="check" size="sm" />
              <span>{successText || 'Success!'}</span>
            </motion.div>
          )
        case 'error':
          return (
            <motion.div
              key="error"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className={styles.stateContent}
            >
              <Icon name="x" size="sm" />
              <span>{errorText || 'Error'}</span>
            </motion.div>
          )
        default:
          return (
            <motion.span
              key="default"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.content}
            >
              {children}
            </motion.span>
          )
      }
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={buttonClass}
        data-variant={variant}
        data-size={size}
        data-state={currentState}
        {...props}
      >
        <AnimatePresence mode="wait">
          {getStateContent()}
        </AnimatePresence>
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button