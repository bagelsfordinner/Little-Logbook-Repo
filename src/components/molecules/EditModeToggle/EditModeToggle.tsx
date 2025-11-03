'use client'

import { useEditMode } from '@/lib/contexts/EditModeContext'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import styles from './EditModeToggle.module.css'

type UserRole = 'parent' | 'family' | 'friend' | null

interface EditModeToggleProps {
  userRole: UserRole
}

export function EditModeToggle({ userRole }: EditModeToggleProps) {
  const { isEditMode, toggleEditMode, isParent } = useEditMode()

  // Only show to parents
  if (!isParent(userRole)) {
    return null
  }

  return (
    <div className={styles.container}>
      {isEditMode && (
        <div className={styles.editBanner}>
          <Icon name="edit" size="sm" />
          <span>Edit Mode Active - Click sections to edit</span>
        </div>
      )}
      
      <Button
        variant={isEditMode ? 'secondary' : 'primary'}
        size="sm"
        onClick={toggleEditMode}
        className={`${styles.button} ${isEditMode ? styles.active : ''}`}
      >
        <Icon 
          name={isEditMode ? 'check' : 'edit'} 
          size="sm" 
        />
        {isEditMode ? 'Done' : 'Edit'}
      </Button>
    </div>
  )
}