'use client'

import { useState, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEditMode } from '@/lib/contexts/EditModeContext'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import { SectionEditor, FieldDefinition } from '@/components/molecules/SectionEditor'
import { PageType } from '@/lib/constants/pageSections'
import { updatePageSection } from '@/app/actions/content'
import styles from './SectionContainer.module.css'

export interface SectionContainerProps {
  sectionKey: string
  pageType: PageType
  logbookSlug: string
  visible: boolean
  canEdit: boolean
  children: ReactNode
  onVisibilityChange?: (visible: boolean) => void
  editFields?: FieldDefinition[]
  className?: string
}

export function SectionContainer({
  sectionKey,
  pageType,
  logbookSlug,
  visible,
  canEdit,
  children,
  editFields,
  className
}: SectionContainerProps) {
  const { isEditMode } = useEditMode()
  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Show edit UI only if user can edit and we're in edit mode
  const showEditUI = canEdit && isEditMode
  const hasEditFields = editFields && editFields.length > 0

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = async (sectionKey: string, updates: Record<string, unknown>) => {
    const result = await updatePageSection(logbookSlug, pageType, sectionKey, updates)
    if (!result.success) {
      throw new Error(result.error || 'Failed to save changes')
    }
    // Optionally trigger a refresh or update local state
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  const containerClasses = [
    styles.container,
    showEditUI && styles.editable,
    showEditUI && isHovered && styles.hovered,
    className
  ].filter(Boolean).join(' ')

  // If section is not visible and we're not in edit mode, don't render anything
  if (!visible && !showEditUI) {
    return null
  }

  return (
    <div
      className={containerClasses}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Section Content */}
      <div className={`${styles.content} ${!visible ? styles.hidden : ''}`}>
        {children}
      </div>

      {/* Edit Controls */}
      <AnimatePresence>
        {showEditUI && isHovered && !isEditing && hasEditFields && (
          <motion.div
            className={styles.editButton}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              variant="primary"
              size="sm"
              onClick={handleEdit}
            >
              <Icon name="edit" size="sm" />
              Edit
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Section Overlay */}
      {showEditUI && !visible && (
        <div className={styles.hiddenOverlay}>
          <div className={styles.hiddenMessage}>
            <Icon name="eye-off" size="md" />
            <span>Section Hidden</span>
          </div>
        </div>
      )}

      {/* Section Editor Modal/Inline */}
      <AnimatePresence>
        {isEditing && editFields && (
          <motion.div
            className={styles.editorOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className={styles.editorContainer}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className={styles.editorHeader}>
                <h3 className={styles.editorTitle}>
                  Edit {sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)} Section
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  className={styles.closeButton}
                >
                  <Icon name="x" size="sm" />
                </Button>
              </div>
              
              <SectionEditor
                sectionKey={sectionKey}
                fields={editFields}
                onSave={handleSave}
                onCancel={handleCancelEdit}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}