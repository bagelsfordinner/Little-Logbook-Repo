'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { TextArea } from '@/components/atoms/TextArea'
import { Icon } from '@/components/atoms/Icon'
import { Loader } from '@/components/atoms/Loader'
import Image from 'next/image'
import styles from './SectionEditor.module.css'

export interface FieldDefinition {
  key: string
  label: string
  type: 'text' | 'textarea' | 'image' | 'number' | 'boolean'
  value: string | number | boolean | File | null
  placeholder?: string
  required?: boolean
}

export interface SectionEditorProps {
  sectionKey: string
  fields: FieldDefinition[]
  onSave: (sectionKey: string, updates: Record<string, unknown>) => Promise<void>
  onCancel?: () => void
}

export function SectionEditor({
  sectionKey,
  fields,
  onSave,
  onCancel
}: SectionEditorProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Initialize form data with current field values
  useEffect(() => {
    const initialData: Record<string, unknown> = {}
    fields.forEach(field => {
      initialData[field.key] = field.value
    })
    setFormData(initialData)
  }, [fields])

  const handleFieldChange = (key: string, value: string | number | boolean | File | null) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }))
    setError(null)
    setSuccess(false)
  }

  const handleFileChange = (key: string, file: File | null) => {
    // In a real app, you'd upload the file here and get back a URL
    // For now, we'll just store the file object
    handleFieldChange(key, file)
  }

  const getChangedFields = () => {
    const changes: Record<string, unknown> = {}
    fields.forEach(field => {
      if (formData[field.key] !== field.value) {
        changes[field.key] = formData[field.key]
      }
    })
    return changes
  }

  const handleSave = async () => {
    if (isLoading) return

    const changes = getChangedFields()
    if (Object.keys(changes).length === 0) {
      setError('No changes to save')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await onSave(sectionKey, changes)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onCancel?.()
      }, 1500)
    } catch (err) {
      console.error('Error saving section:', err)
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset form data to original values
    const originalData: Record<string, unknown> = {}
    fields.forEach(field => {
      originalData[field.key] = field.value
    })
    setFormData(originalData)
    setError(null)
    setSuccess(false)
    onCancel?.()
  }

  const renderField = (field: FieldDefinition) => {
    const value = formData[field.key] ?? ''
    const stringValue = typeof value === 'string' ? value : String(value)

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={stringValue}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        )

      case 'textarea':
        return (
          <TextArea
            value={stringValue}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={3}
          />
        )

      case 'number':
        return (
          <Input
            type="number"
            value={stringValue}
            onChange={(e) => handleFieldChange(field.key, Number(e.target.value))}
            placeholder={field.placeholder}
            required={field.required}
          />
        )

      case 'image':
        return (
          <div className={styles.imageField}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(field.key, e.target.files?.[0] || null)}
              className={styles.fileInput}
              id={`file-${field.key}`}
            />
            <label htmlFor={`file-${field.key}`} className={styles.fileLabel}>
              <Icon name="upload" size="sm" />
              Choose Image
            </label>
            {value && (
              <div className={styles.imagePreview}>
                {typeof value === 'string' ? (
                  <Image src={value} alt="Preview" className={styles.previewImage} width={200} height={150} style={{ objectFit: 'cover' }} />
                ) : (
                  <span className={styles.fileName}>
                    {value instanceof File ? value.name : 'Image selected'}
                  </span>
                )}
              </div>
            )}
          </div>
        )

      case 'boolean':
        return (
          <label className={styles.booleanField}>
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleFieldChange(field.key, e.target.checked)}
            />
            <span className={styles.checkboxLabel}>{field.label}</span>
          </label>
        )

      default:
        return null
    }
  }

  const hasChanges = Object.keys(getChangedFields()).length > 0

  return (
    <div className={styles.container}>
      <div className={styles.form}>
        {fields.map(field => (
          <div key={field.key} className={styles.field}>
            <label className={styles.label} htmlFor={field.key}>
              {field.label}
              {field.required && <span className={styles.required}>*</span>}
            </label>
            {renderField(field)}
          </div>
        ))}
      </div>

      {error && (
        <div className={styles.error}>
          <Icon name="alert-circle" size="sm" />
          {error}
        </div>
      )}

      {success && (
        <div className={styles.success}>
          <Icon name="check-circle" size="sm" />
          Changes saved successfully!
        </div>
      )}

      <div className={styles.actions}>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!hasChanges || isLoading}
          className={styles.saveButton}
        >
          {isLoading && <Loader size="sm" />}
          Save Changes
        </Button>
        
        {onCancel && (
          <Button
            variant="secondary"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}