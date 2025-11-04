'use client'

import { forwardRef, InputHTMLAttributes, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import styles from './Input.module.css'

export type InputSize = 'sm' | 'md' | 'lg'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  error?: string
  size?: InputSize
  fullWidth?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    error,
    size = 'md',
    fullWidth = false,
    disabled,
    type = 'text',
    className,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const hasError = Boolean(error)
    const isPassword = type === 'password'

    const inputType = isPassword && showPassword ? 'text' : type

    const containerClass = [
      styles.container,
      fullWidth && styles.fullWidth,
    ].filter(Boolean).join(' ')

    const inputClass = [
      styles.input,
      hasError && styles.error,
      isPassword && styles.withIcon,
      className
    ].filter(Boolean).join(' ')

    const togglePassword = () => {
      setShowPassword(!showPassword)
    }

    return (
      <div className={containerClass}>
        <div className={styles.inputWrapper}>
          <input
            ref={ref}
            type={inputType}
            disabled={disabled}
            className={inputClass}
            data-size={size}
            data-error={hasError}
            aria-invalid={hasError}
            aria-describedby={error ? `${props.id || props.name}-error` : undefined}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={togglePassword}
              disabled={disabled}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={0}
            >
              <Icon 
                name={showPassword ? 'eye-off' : 'eye'} 
                size="sm" 
                color="var(--text-secondary)"
              />
            </button>
          )}
        </div>
        {error && (
          <span 
            id={`${props.id || props.name}-error`}
            className={styles.errorMessage}
            role="alert"
          >
            {error}
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input