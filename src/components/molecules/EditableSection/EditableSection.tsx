'use client'

import { useState, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEditMode } from '@/lib/contexts/EditModeContext'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import styles from './EditableSection.module.css'

type UserRole = 'parent' | 'family' | 'friend' | null

interface EditableSectionProps {
  children: ReactNode
  onEdit: () => void
  onDelete?: () => void
  showDelete?: boolean
  userRole: UserRole
  className?: string
}

export function EditableSection({ 
  children, 
  onEdit, 
  onDelete, 
  showDelete = false, 
  userRole,
  className 
}: EditableSectionProps) {
  const { isEditMode, isParent } = useEditMode()
  const [isHovered, setIsHovered] = useState(false)

  // Only show edit capabilities to parents
  const canEdit = isParent(userRole) && isEditMode

  const containerClass = [
    styles.container,
    canEdit && styles.editable,
    canEdit && isHovered && styles.hovered,
    className
  ].filter(Boolean).join(' ')

  return (
    <div
      className={containerClass}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      
      <AnimatePresence>
        {canEdit && isHovered && (
          <motion.div
            className={styles.actionButtons}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              variant="primary"
              size="sm"
              onClick={onEdit}
              className={styles.actionButton}
            >
              <Icon name="edit" size="sm" />
            </Button>
            
            {showDelete && onDelete && (
              <Button
                variant="danger"
                size="sm"
                onClick={onDelete}
                className={styles.actionButton}
              >
                <Icon name="trash2" size="sm" />
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}