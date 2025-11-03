'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageType, SectionData } from '@/lib/constants/pageSections'
import { usePageContent } from '@/lib/hooks/usePageContent'
import { SectionManager } from '@/components/organisms/SectionManager'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import { Loader } from '@/components/atoms/Loader'
import styles from './PageSettingsModal.module.css'

export interface PageSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  pageType: PageType
  logbookSlug: string
}

const PAGE_DISPLAY_NAMES: Record<PageType, string> = {
  home: 'Home Page',
  help: 'Help Page',
  gallery: 'Gallery',
  vault: 'Memory Vault',
  faq: 'FAQ'
}

export function PageSettingsModal({
  isOpen,
  onClose,
  pageType,
  logbookSlug
}: PageSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'sections' | 'layout'>('sections')
  const { sections, loading, error, invalidate } = usePageContent(pageType, logbookSlug)

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  const handleUpdate = () => {
    invalidate()
  }

  const pageDisplayName = PAGE_DISPLAY_NAMES[pageType]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
        >
          <motion.div
            className={styles.modal}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerContent}>
                <h2 className={styles.title}>
                  <Icon name="settings" size="md" />
                  Page Settings - {pageDisplayName}
                </h2>
                <p className={styles.subtitle}>
                  Configure sections and content for this page
                </p>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className={styles.closeButton}
                aria-label="Close modal"
              >
                <Icon name="x" size="md" />
              </Button>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'sections' ? styles.active : ''}`}
                onClick={() => setActiveTab('sections')}
              >
                <Icon name="list" size="sm" />
                Sections
              </button>
              
              <button
                className={`${styles.tab} ${activeTab === 'layout' ? styles.active : ''}`}
                onClick={() => setActiveTab('layout')}
                disabled
              >
                <Icon name="grid" size="sm" />
                Layout
                <span className={styles.comingSoon}>(Coming Soon)</span>
              </button>
            </div>

            {/* Content */}
            <div className={styles.content}>
              {activeTab === 'sections' && (
                <>
                  {loading && (
                    <div className={styles.loading}>
                      <Loader size="md" />
                      <p>Loading page sections...</p>
                    </div>
                  )}

                  {error && (
                    <div className={styles.error}>
                      <Icon name="alert-circle" size="md" />
                      <div>
                        <h3>Error loading sections</h3>
                        <p>{error}</p>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => invalidate()}
                        >
                          Try Again
                        </Button>
                      </div>
                    </div>
                  )}

                  {sections && !loading && !error && (
                    <SectionManager
                      pageType={pageType}
                      logbookSlug={logbookSlug}
                      sections={sections as Record<string, SectionData>}
                      onUpdate={handleUpdate}
                    />
                  )}
                </>
              )}

              {activeTab === 'layout' && (
                <div className={styles.placeholder}>
                  <Icon name="grid" size="lg" />
                  <h3>Layout Settings</h3>
                  <p>
                    Layout customization options will be available in a future update.
                    You&apos;ll be able to adjust page layouts, themes, and styling here.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={styles.footer}>
              <p className={styles.footerText}>
                Changes are saved automatically
              </p>
              <Button
                variant="primary"
                onClick={onClose}
              >
                Done
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}