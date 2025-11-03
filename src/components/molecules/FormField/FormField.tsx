'use client'

import { InputHTMLAttributes } from 'react'
import { Label } from '../../atoms/Label'
import { Input } from '../../atoms/Input'
import styles from './FormField.module.css'

interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string
  error?: string
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

export default function FormField({
  label,
  error,
  size = 'md',
  fullWidth = true,
  required,
  id,
  name,
  className,
  ...inputProps
}: FormFieldProps) {
  const fieldId = id || (name ? `field-${name}` : `field-${label.toLowerCase().replace(/\s+/g, '-')}`)

  const containerClass = [
    styles.container,
    fullWidth && styles.fullWidth,
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={containerClass}>
      <Label
        htmlFor={fieldId}
        required={required}
        size={size}
      >
        {label}
      </Label>
      <Input
        id={fieldId}
        name={name}
        error={error}
        size={size}
        fullWidth={fullWidth}
        {...inputProps}
      />
    </div>
  )
}