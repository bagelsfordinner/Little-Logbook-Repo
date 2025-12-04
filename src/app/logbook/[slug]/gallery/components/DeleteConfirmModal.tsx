'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from '@/components/atoms/Icon'
import styles from './DeleteConfirmModal.module.css'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  imageCount: number
  ownedCount?: number
  notOwnedCount?: number
  isLoading?: boolean
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  imageCount,
  ownedCount,
  notOwnedCount,
  isLoading = false
}: DeleteConfirmModalProps) {
  const hasPermissionIssues = notOwnedCount && notOwnedCount > 0
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalIcon}>
                <Icon name="alert-triangle" size="lg" />
              </div>
              <h2 className={styles.modalTitle}>
                Delete {imageCount} Image{imageCount !== 1 ? 's' : ''}
              </h2>
            </div>
            
            <div className={styles.modalBody}>
              {hasPermissionIssues ? (
                <div className={styles.permissionWarning}>
                  <p className={styles.warningText}>
                    You can only delete images you uploaded. 
                  </p>
                  <div className={styles.permissionBreakdown}>
                    <div className={styles.permissionItem}>
                      <span className={styles.permissionCount}>{ownedCount}</span>
                      <span className={styles.permissionLabel}>images you can delete</span>
                    </div>
                    <div className={styles.permissionItem}>
                      <span className={`${styles.permissionCount} ${styles.blocked}`}>{notOwnedCount}</span>
                      <span className={styles.permissionLabel}>images you cannot delete</span>
                    </div>
                  </div>
                  <p className={styles.confirmText}>
                    Only your {ownedCount} image{ownedCount !== 1 ? 's' : ''} will be deleted.
                  </p>
                </div>
              ) : (
                <p className={styles.confirmText}>
                  Are you sure you want to delete {imageCount === 1 ? 'this image' : `these ${imageCount} images`}? 
                  This action cannot be undone.
                </p>
              )}
            </div>
            
            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                className={styles.deleteButton}
                onClick={onConfirm}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Icon name="loader" size="sm" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Icon name="trash2" size="sm" />
                    Delete {hasPermissionIssues ? ownedCount : imageCount}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default DeleteConfirmModal;