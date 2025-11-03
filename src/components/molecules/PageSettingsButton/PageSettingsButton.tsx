'use client'

import { useState } from 'react'
import { PageType } from '@/lib/constants/pageSections'
import { useEditMode } from '@/lib/contexts/EditModeContext'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import { PageSettingsModal } from '@/components/organisms/PageSettingsModal'
import styles from './PageSettingsButton.module.css'

type UserRole = 'parent' | 'family' | 'friend' | null

export interface PageSettingsButtonProps {
  pageType: PageType
  logbookSlug: string
  variant?: 'floating' | 'inline'
  userRole: UserRole
}

export function PageSettingsButton({
  pageType,
  logbookSlug,
  variant = 'floating',
  userRole
}: PageSettingsButtonProps) {
  const { isEditMode, isParent } = useEditMode()
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Only show to parents
  if (!isParent(userRole)) {
    return null
  }

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const isFloating = variant === 'floating'

  // Don't render floating button if edit mode is off
  if (isFloating && !isEditMode) {
    return null
  }

  return (
    <>
      <Button
        variant={isFloating ? 'primary' : 'secondary'}
        size={isFloating ? 'md' : 'sm'}
        onClick={handleOpenModal}
        className={`${styles.button} ${isFloating ? styles.floating : styles.inline}`}
        aria-label="Open page settings"
      >
        <Icon name="settings" size="sm" />
        {!isFloating && 'Page Settings'}
      </Button>

      <PageSettingsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        pageType={pageType}
        logbookSlug={logbookSlug}
      />
    </>
  )
}