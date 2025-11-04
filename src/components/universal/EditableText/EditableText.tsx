'use client'

import { useState, useRef, useEffect } from 'react'
import { useContent } from '@/lib/contexts/ContentContext'
import { safeString } from '@/lib/utils/typeUtils'
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
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const currentValue = getContent(path, fallback)
  const canEdit = isEditMode && userRole === 'parent'

  useEffect(() => {
    setValue(safeString(currentValue))
  }, [currentValue])

  const handleClick = () => {
    if (canEdit && !isEditing) {
      setIsEditing(true)
      setValue(safeString(currentValue))
    }
  }

  const handleSave = async () => {
    if (value !== currentValue) {
      await updateContent(path, value)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setValue(safeString(currentValue))
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
    if (isEditing) {
      if (multiline && textareaRef.current) {
        textareaRef.current.focus()
        // For textarea, select all text
        textareaRef.current.setSelectionRange(0, textareaRef.current.value.length)
      } else if (!multiline && inputRef.current) {
        inputRef.current.focus()
        inputRef.current.select()
      }
    }
  }, [isEditing, multiline])

  const editableClasses = [
    className,
    canEdit ? styles.editable : '',
    isEditing ? styles.editing : ''
  ].filter(Boolean).join(' ')

  if (isEditing) {
    return (
      <div className={styles.editingContainer}>
        {multiline ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`${editableClasses} ${styles.input}`}
            rows={4}
          />
        ) : (
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`${editableClasses} ${styles.input}`}
          />
        )}
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

  const displayValue = safeString(currentValue) || placeholder
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