'use client'

import { ReactNode } from 'react'
import { useContent } from '@/lib/contexts/ContentContext'
import styles from './EditableSection.module.css'

interface EditableSectionProps {
  path: string
  children: ReactNode
  className?: string
  showToggle?: boolean
  fallbackVisible?: boolean
}

export function EditableSection({
  path,
  children,
  className = '',
  showToggle = true,
  fallbackVisible = true
}: EditableSectionProps) {
  const { 
    isSectionVisible, 
    isEditMode, 
    canEdit 
  } = useContent()

  const isVisible = isSectionVisible(path)
  const actualVisibility = isVisible !== undefined ? isVisible : fallbackVisible
  const showEditUI = isEditMode && canEdit(path) && showToggle

  // Don't render anything if section is hidden and user can't edit
  if (!actualVisibility && !showEditUI) {
    return null
  }

  const containerClasses = [
    styles.container,
    showEditUI && styles.editable,
    !actualVisibility && styles.hidden,
    className
  ].filter(Boolean).join(' ')

  return (
    <section 
      className={containerClasses}
      data-section-path={path}
      style={{
        opacity: !actualVisibility && showEditUI ? 0.5 : 1,
        border: !actualVisibility && showEditUI ? '2px dashed var(--border-primary)' : 'none',
        borderRadius: !actualVisibility && showEditUI ? '8px' : '0'
      }}
    >
      {/* Section Content - Always show in edit mode */}
      <div className={styles.content}>
        {children}
      </div>
    </section>
  )
}