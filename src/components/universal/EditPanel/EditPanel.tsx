'use client'

import { motion } from 'framer-motion'
import { useContent } from '@/lib/contexts/ContentContext'
import { ThemeSwitcher } from '@/components/ThemeSwitcher/ThemeSwitcher'
import { Icon } from '@/components/atoms/Icon'
import styles from './EditPanel.module.css'

interface SectionConfig {
  path: string
  label: string
  description?: string
}

interface EditPanelProps {
  sections: SectionConfig[]
  pageTitle?: string
}

export function EditPanel({ sections }: EditPanelProps) {
  const {
    isEditMode,
    isEditPanelOpen,
    toggleEditPanel,
    setEditMode,
    isSectionVisible,
    toggleSectionVisibility,
    canEditAny
  } = useContent()

  // Don't render if user can't edit
  if (!canEditAny()) {
    return null
  }

  const handleToggleEdit = () => {
    if (isEditMode && isEditPanelOpen) {
      // Exit edit mode and close panel
      setEditMode(false)
    } else if (!isEditMode) {
      // Enter edit mode and open panel
      setEditMode(true)
      toggleEditPanel()
    } else {
      // Just toggle panel if already in edit mode
      toggleEditPanel()
    }
  }

  const handleToggleSection = async (sectionPath: string) => {
    try {
      await toggleSectionVisibility(sectionPath)
    } catch (error) {
      console.error('Failed to toggle section visibility:', error)
    }
  }

  return (
    <motion.div
      className={styles.editContainer}
      animate={{
        right: isEditPanelOpen ? '0px' : '-320px'
      }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      {/* Tab Edit Button */}
      <button
        className={`${styles.editButton} ${isEditPanelOpen ? styles.editButtonOpen : ''}`}
        onClick={handleToggleEdit}
        aria-label={isEditMode && isEditPanelOpen ? 'Done editing' : 'Edit page'}
      >
        <Icon name={isEditPanelOpen ? "chevron-right" : "chevron-left"} size="sm" />
        <span>{isEditMode && isEditPanelOpen ? 'Done' : 'Edit'}</span>
      </button>

      {/* Edit Panel - No overlay, no click-outside-to-close */}
      <div className={styles.panel}>
        {/* Theme Switcher */}
        <div className={styles.themeSection}>
          <h3 className={styles.sectionTitle}>Theme</h3>
          <ThemeSwitcher />
        </div>

        {/* Instructions */}
        <div className={styles.instructionsSection}>
          <p className={styles.instructions}>
            Click on any text or image to edit it directly. Use the toggles below to show or hide sections. Changes are saved automatically.
          </p>
        </div>

        {/* Section Visibility */}
        <div className={styles.sectionsContainer}>
          <h3 className={styles.sectionTitle}>Page Sections</h3>
          <div className={styles.sectionList}>
            {sections.map((section) => {
              const isVisible = isSectionVisible(section.path)
              return (
                <div key={section.path} className={styles.sectionItem}>
                  <div className={styles.sectionInfo}>
                    <span className={styles.sectionLabel}>{section.label}</span>
                    {section.description && (
                      <span className={styles.sectionDescription}>
                        {section.description}
                      </span>
                    )}
                  </div>
                  <button
                    className={`${styles.toggle} ${isVisible ? styles.toggleOn : styles.toggleOff}`}
                    onClick={() => handleToggleSection(section.path)}
                    aria-label={`${isVisible ? 'Hide' : 'Show'} ${section.label}`}
                  >
                    <div className={styles.toggleSlider} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </motion.div>
  )
}