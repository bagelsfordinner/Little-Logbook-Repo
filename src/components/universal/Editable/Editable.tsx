'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { useContent, ContentType } from '@/lib/contexts/ContentContext'
import { uploadImageToLogbook } from '@/lib/services/directUpload'
import { Icon } from '@/components/atoms/Icon'
import Image from 'next/image'
import { safeString, safeBoolean } from '@/lib/utils/typeUtils'
import styles from './Editable.module.css'

interface EditableProps {
  path: string
  type?: ContentType
  fallback?: string | number | boolean | null
  className?: string
  children?: ReactNode
  placeholder?: string
  multiline?: boolean
  allowedFormats?: string[]
}


export function Editable({
  path,
  type = 'text',
  fallback = '',
  className = '',
  children,
  placeholder,
  multiline = false,
  allowedFormats = ['image/*']
}: EditableProps) {
  const { 
    getContent, 
    updateContent, 
    isEditMode, 
    canEdit,
    logbookSlug,
    pageType
  } = useContent()
  
  const [isEditing, setIsEditing] = useState(false)
  const [tempValue, setTempValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const content = getContent(path, fallback)
  const showEditable = isEditMode && canEdit(path)

  // Initialize temp value when editing starts
  useEffect(() => {
    if (isEditing) {
      setTempValue(safeString(content))
    }
  }, [isEditing, content])

  // Focus and select input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      if (type === 'text') {
        inputRef.current.select()
      }
    }
  }, [isEditing, type])

  const handleClick = () => {
    if (showEditable && !isEditing && !isLoading) {
      if (type === 'image') {
        fileInputRef.current?.click()
      } else if (type === 'boolean') {
        handleBooleanToggle()
      } else {
        setIsEditing(true)
      }
    }
  }

  const handleSave = async () => {
    if (tempValue !== content) {
      setIsLoading(true)
      setError(null)
      
      try {
        await updateContent(path, tempValue)
      } catch (err) {
        setError('Failed to save changes')
        console.error('Save error:', err)
      } finally {
        setIsLoading(false)
      }
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTempValue(safeString(content))
    setIsEditing(false)
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    } else if (e.key === 'Enter' && e.metaKey && multiline) {
      e.preventDefault()
      handleSave()
    }
  }

  const handleBlur = () => {
    if (isEditing) {
      handleSave()
    }
  }

  const handleBooleanToggle = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      await updateContent(path, !content)
    } catch (err) {
      setError('Failed to update')
      console.error('Boolean toggle error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🎯 [IMAGE UPLOAD] Starting image upload process')
    const file = e.target.files?.[0]
    if (!file) {
      console.log('❌ [IMAGE UPLOAD] No file selected')
      return
    }

    console.log('📁 [IMAGE UPLOAD] File selected:', {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeInMB: (file.size / 1024 / 1024).toFixed(2)
    })

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('❌ [IMAGE UPLOAD] Invalid file type:', file.type)
      setError('Please select an image file')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      console.log('❌ [IMAGE UPLOAD] File too large:', file.size)
      setError('Image must be smaller than 5MB')
      return
    }

    console.log('✅ [IMAGE UPLOAD] File validation passed')
    console.log('🔄 [IMAGE UPLOAD] Context info:', {
      logbookSlug,
      pageType,
      path
    })

    setIsLoading(true)
    setError(null)

    try {
      console.log('🚀 [IMAGE UPLOAD] Calling new robust uploadImageToLogbook...')
      const result = await uploadImageToLogbook(logbookSlug, pageType, path, file, 'hero')
      
      console.log('📋 [IMAGE UPLOAD] Server response:', result)
      
      if (!result.success) {
        console.log('❌ [IMAGE UPLOAD] Upload failed:', result.error)
        setError(result.error || 'Upload failed')
      } else if (result.url) {
        console.log('🎉 [IMAGE UPLOAD] Upload successful!')
        console.log('🎉 [IMAGE UPLOAD] URL:', result.url.substring(0, 100) + '...')
        console.log('🎉 [IMAGE UPLOAD] Metadata:', result.metadata)
        console.log('🔄 [IMAGE UPLOAD] Reloading page to show new image...')
        window.location.reload()
      } else {
        console.log('⚠️ [IMAGE UPLOAD] Success but no URL returned:', result)
        setError('Upload completed but no image URL returned')
      }
    } catch (err) {
      console.error('💥 [IMAGE UPLOAD] Exception caught:', err)
      setError('Failed to upload image')
    } finally {
      setIsLoading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      console.log('🏁 [IMAGE UPLOAD] Process completed')
    }
  }

  // Render based on content type and edit state
  const renderContent = () => {
    if (type === 'boolean') {
      return (
        <div className={`${styles.booleanContainer} ${showEditable ? styles.editable : ''}`}>
          <input
            type="checkbox"
            checked={safeBoolean(content)}
            onChange={() => {}} // Handled by click
            disabled={!showEditable || isLoading}
            className={styles.booleanInput}
          />
          {children}
        </div>
      )
    }

    if (type === 'image') {
      const imageSrc = safeString(content)
      return (
        <div className={`${styles.imageContainer} ${showEditable ? styles.editable : ''}`}>
          {children ? (
            children
          ) : (
            imageSrc ? (
              <Image
                src={imageSrc}
                alt="Editable content"
                className={styles.image}
                width={300}
                height={200}
                style={{ objectFit: 'cover' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : (
              <div className={`${styles.imagePlaceholder} ${styles.image}`}>
                <Icon name="camera" size="lg" />
                <span>No image</span>
              </div>
            )
          )}
          
          {showEditable && (
            <div className={styles.imageOverlay}>
              <div className={styles.imageEditContent}>
                {isLoading ? (
                  <div className={styles.loadingSpinner}>
                    <Icon name="loader" size="lg" />
                    <span>Uploading...</span>
                  </div>
                ) : (
                  <div className={styles.imageEditPrompt}>
                    <Icon name="camera" size="lg" />
                    <span>Click to change image</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )
    }

    if (isEditing && (type === 'text' || type === 'textarea')) {
      const InputComponent = type === 'textarea' || multiline ? 'textarea' : 'input'
      return (
        <InputComponent
          ref={inputRef as React.LegacyRef<HTMLInputElement & HTMLTextAreaElement>}
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className={`${styles.input} ${className}`}
          placeholder={placeholder || 'Enter text...'}
          disabled={isLoading}
          rows={multiline ? 3 : undefined}
        />
      )
    }

    // Default text display
    const displayValue = safeString(content) || placeholder || 'Click to edit...'
    const isEmpty = !content

    if (children) {
      return children
    }

    return (
      <span className={`${isEmpty ? styles.empty : ''} ${className}`}>
        {displayValue}
      </span>
    )
  }

  const containerClasses = [
    styles.container,
    showEditable && styles.showEditable,
    isLoading && styles.loading,
    error && styles.error,
    className
  ].filter(Boolean).join(' ')

  return (
    <div
      className={containerClasses}
      onClick={handleClick}
      role={showEditable ? 'button' : undefined}
      tabIndex={showEditable ? 0 : undefined}
    >
      {renderContent()}
      
      {showEditable && !isEditing && (
        <div className={styles.editHint}>
          {type === 'image' ? 'Click to change image' : 
           type === 'boolean' ? 'Click to toggle' : 
           'Click to edit'}
        </div>
      )}

      {error && (
        <div className={styles.errorMessage}>
          <Icon name="alert-circle" size="sm" />
          <span>{error}</span>
          <button 
            onClick={(e) => {
              e.stopPropagation()
              setError(null)
            }} 
            className={styles.closeError}
          >
            <Icon name="x" size="sm" />
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={allowedFormats.join(',')}
        onChange={handleFileChange}
        className={styles.hiddenInput}
      />
    </div>
  )
}