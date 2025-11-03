'use client'

import { forwardRef, TextareaHTMLAttributes } from 'react'
import styles from './TextArea.module.css'

export type TextAreaSize = 'sm' | 'md' | 'lg'

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
  size?: TextAreaSize
  fullWidth?: boolean
  maxLength?: number
  showCharCount?: boolean
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ 
    error,
    size = 'md',
    fullWidth = false,
    disabled,
    className,
    maxLength,
    showCharCount = false,
    value = '',
    ...props
  }, ref) => {
    const hasError = Boolean(error)
    const currentLength = String(value).length

    const textareaClass = [
      styles.textarea,
      hasError && styles.error,
      fullWidth && styles.fullWidth,
      className
    ].filter(Boolean).join(' ')

    return (
      <div className={styles.container}>
        <textarea
          ref={ref}
          disabled={disabled}
          className={textareaClass}
          data-size={size}
          data-error={hasError}
          aria-invalid={hasError}
          aria-describedby={error ? `${props.id || props.name}-error` : undefined}
          maxLength={maxLength}
          value={value}
          {...props}
        />
        
        <div className={styles.footer}>
          {error && (
            <span 
              id={`${props.id || props.name}-error`}
              className={styles.errorMessage}
              role="alert"
            >
              {error}
            </span>
          )}
          
          {(showCharCount || maxLength) && (
            <span className={styles.charCount} data-over-limit={maxLength ? currentLength > maxLength : false}>
              {currentLength}{maxLength && ` / ${maxLength}`}
            </span>
          )}
        </div>
      </div>
    )
  }
)

TextArea.displayName = 'TextArea'

export default TextArea