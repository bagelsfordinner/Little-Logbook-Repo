'use client'

import { forwardRef, SelectHTMLAttributes } from 'react'
import styles from './Select.module.css'

export type SelectSize = 'sm' | 'md' | 'lg'

interface SelectOption {
  label: string
  value: string
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: SelectOption[]
  error?: string
  size?: SelectSize
  fullWidth?: boolean
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    options,
    error,
    size = 'md',
    fullWidth = false,
    disabled,
    placeholder,
    className,
    ...props
  }, ref) => {
    const hasError = Boolean(error)

    const selectClass = [
      styles.select,
      hasError && styles.error,
      fullWidth && styles.fullWidth,
      className
    ].filter(Boolean).join(' ')

    return (
      <div className={styles.container}>
        <div className={styles.selectWrapper}>
          <select
            ref={ref}
            disabled={disabled}
            className={selectClass}
            data-size={size}
            data-error={hasError}
            aria-invalid={hasError}
            aria-describedby={error ? `${props.id || props.name}-error` : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className={styles.icon}>
            <svg
              width="12"
              height="8"
              viewBox="0 0 12 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 1L6 6L11 1"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
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

Select.displayName = 'Select'

export default Select
export type { SelectOption }