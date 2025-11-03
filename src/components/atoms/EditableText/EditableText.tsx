'use client'

import { useState, useRef, useEffect } from 'react'
import { useEditMode } from '@/lib/contexts/EditModeContext'
import styles from './EditableText.module.css'

interface EditableTextProps {
  value: string
  onChange: (value: string) => Promise<void>
  placeholder?: string
  className?: string
  variant?: 'title' | 'subtitle' | 'body'
  canEdit?: boolean
  multiline?: boolean
}

export function EditableText({
  value,
  onChange,
  placeholder = 'Click to edit...',
  className = '',
  variant = 'body',
  canEdit = true,
  multiline = false
}: EditableTextProps) {
  const { isEditMode } = useEditMode()
  const [isEditing, setIsEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  const showEditable = isEditMode && canEdit
  
  useEffect(() => {
    setTempValue(value)
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleClick = () => {
    if (showEditable && !isEditing) {
      setIsEditing(true)
    }
  }

  const handleSave = async () => {
    if (tempValue !== value) {
      setIsLoading(true)
      try {
        await onChange(tempValue)
      } catch (error) {
        console.error('Failed to save:', error)
        setTempValue(value) // Revert on error
      } finally {
        setIsLoading(false)
      }
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTempValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    } else if (e.key === 'Enter' && e.metaKey && multiline) {
      handleSave()
    }
  }

  const handleBlur = () => {
    handleSave()
  }

  const displayValue = value || placeholder
  const isEmpty = !value

  if (isEditing) {
    const InputComponent = multiline ? 'textarea' : 'input'
    return (
      <InputComponent
        ref={inputRef as React.RefObject<HTMLInputElement & HTMLTextAreaElement>}
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={`${styles.input} ${styles[variant]} ${className}`}
        placeholder={placeholder}
        disabled={isLoading}
        rows={multiline ? 3 : undefined}
      />
    )
  }

  const containerClasses = [
    styles.container,
    styles[variant],
    showEditable && styles.editable,
    isEmpty && styles.empty,
    isLoading && styles.loading,
    className
  ].filter(Boolean).join(' ')

  return (
    <div
      className={containerClasses}
      onClick={handleClick}
      role={showEditable ? 'button' : undefined}
      tabIndex={showEditable ? 0 : undefined}
    >
      {displayValue}
      {showEditable && (
        <div className={styles.editHint}>
          Click to edit
        </div>
      )}
    </div>
  )
}