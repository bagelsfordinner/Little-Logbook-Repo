'use client'

import { useState, useRef, useEffect } from 'react'
import { useContent } from '@/lib/contexts/ContentContext'
import styles from './EditableText.module.css'

interface EditableTextProps {
  path: string
  fallback?: string
  placeholder?: string
  className?: string
  element?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
  multiline?: boolean
}

export function EditableText({
  path,
  fallback = '',
  placeholder = 'Click to edit...',
  className = '',
  element = 'p',
  multiline = false
}: EditableTextProps) {
  const { getContent, updateContent, isEditMode, userRole } = useContent()
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  const currentValue = getContent(path, fallback)
  const canEdit = isEditMode && userRole === 'parent'

  useEffect(() => {
    setValue(currentValue)
  }, [currentValue])

  const handleClick = () => {
    if (canEdit && !isEditing) {
      setIsEditing(true)
      setValue(currentValue)
    }
  }

  const handleSave = async () => {
    if (value !== currentValue) {
      await updateContent(path, value)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setValue(currentValue)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select()
      } else {
        // For textarea, select all text
        inputRef.current.setSelectionRange(0, inputRef.current.value.length)
      }
    }
  }, [isEditing])

  const editableClasses = [
    className,
    canEdit ? styles.editable : '',
    isEditing ? styles.editing : ''
  ].filter(Boolean).join(' ')

  if (isEditing) {
    const InputComponent = multiline ? 'textarea' : 'input'
    
    return (
      <div className={styles.editingContainer}>
        <InputComponent
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`${editableClasses} ${styles.input}`}
          rows={multiline ? 4 : undefined}
        />
        <div className={styles.editingControls}>
          <button 
            onClick={handleSave}
            className={styles.saveButton}
            type="button"
          >
            Save
          </button>
          <button 
            onClick={handleCancel}
            className={styles.cancelButton}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  const displayValue = currentValue || placeholder
  const Element = element

  return (
    <Element
      onClick={handleClick}
      className={editableClasses}
      data-placeholder={!currentValue}
    >
      {displayValue}
    </Element>
  )
}