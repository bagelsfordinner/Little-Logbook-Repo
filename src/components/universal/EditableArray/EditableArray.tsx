'use client'

import { useState } from 'react'
import { useContent } from '@/lib/contexts/ContentContext'
import { Icon } from '@/components/atoms/Icon'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './EditableArray.module.css'

interface EditableArrayProps<T = unknown> {
  path: string
  itemTemplate: T
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  emptyMessage?: string
  maxItems?: number
  minItems?: number
}

export function EditableArray<T = unknown>({
  path,
  itemTemplate,
  renderItem,
  className = '',
  emptyMessage = "No items yet. Click to add some!",
  maxItems = 20,
  minItems = 0
}: EditableArrayProps<T>) {
  const { getContent, updateContent, isEditMode, canEdit } = useContent()
  const [isLoading, setIsLoading] = useState(false)
  
  const items = getContent(path, []) as T[]
  const showEditable = isEditMode && canEdit(path)

  const addItem = async () => {
    if (items.length >= maxItems) return
    
    setIsLoading(true)
    try {
      const newItems = [...items, { ...itemTemplate, id: Date.now().toString() }]
      await updateContent(path, newItems as string[])
    } catch (error) {
      console.error('Failed to add item:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const removeItem = async (index: number) => {
    if (items.length <= minItems) return
    
    setIsLoading(true)
    try {
      const newItems = items.filter((_, i) => i !== index)
      await updateContent(path, newItems as string[])
    } catch (error) {
      console.error('Failed to remove item:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const moveItem = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return
    
    setIsLoading(true)
    try {
      const newItems = [...items]
      const [movedItem] = newItems.splice(fromIndex, 1)
      newItems.splice(toIndex, 0, movedItem)
      await updateContent(path, newItems as string[])
    } catch (error) {
      console.error('Failed to move item:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const duplicateItem = async (index: number) => {
    if (items.length >= maxItems) return
    
    setIsLoading(true)
    try {
      const itemToDuplicate = { ...items[index], id: Date.now().toString() }
      const newItems = [...items]
      newItems.splice(index + 1, 0, itemToDuplicate)
      await updateContent(path, newItems as string[])
    } catch (error) {
      console.error('Failed to duplicate item:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.emptyState}>
          <Icon name="plus-circle" size="lg" />
          <p>{emptyMessage}</p>
          {showEditable && (
            <motion.button
              className={styles.addButton}
              onClick={addItem}
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon name="plus" size="sm" />
              Add First Item
            </motion.button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`${styles.container} ${className}`}>
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <motion.div
            key={`${path}-${index}-${(item as Record<string, unknown>).id || index}`}
            className={styles.arrayItem}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            layout
          >
            {/* Item content */}
            <div className={styles.itemContent}>
              {renderItem(item, index)}
            </div>

            {/* Edit controls */}
            {showEditable && (
              <motion.div
                className={styles.itemControls}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {/* Move up */}
                {index > 0 && (
                  <button
                    className={styles.controlButton}
                    onClick={() => moveItem(index, index - 1)}
                    disabled={isLoading}
                    title="Move up"
                  >
                    <Icon name="chevron-up" size="xs" />
                  </button>
                )}

                {/* Move down */}
                {index < items.length - 1 && (
                  <button
                    className={styles.controlButton}
                    onClick={() => moveItem(index, index + 1)}
                    disabled={isLoading}
                    title="Move down"
                  >
                    <Icon name="chevron-down" size="xs" />
                  </button>
                )}

                {/* Duplicate */}
                {items.length < maxItems && (
                  <button
                    className={styles.controlButton}
                    onClick={() => duplicateItem(index)}
                    disabled={isLoading}
                    title="Duplicate"
                  >
                    <Icon name="copy" size="xs" />
                  </button>
                )}

                {/* Remove */}
                {items.length > minItems && (
                  <button
                    className={`${styles.controlButton} ${styles.removeButton}`}
                    onClick={() => removeItem(index)}
                    disabled={isLoading}
                    title="Remove"
                  >
                    <Icon name="trash" size="xs" />
                  </button>
                )}
              </motion.div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add new item button */}
      {showEditable && items.length < maxItems && (
        <motion.div
          className={styles.addItemContainer}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            className={styles.addButton}
            onClick={addItem}
            disabled={isLoading}
          >
            <Icon name="plus" size="sm" />
            Add Item
          </button>
        </motion.div>
      )}

      {/* Item count */}
      {showEditable && (
        <div className={styles.itemCount}>
          {items.length} of {maxItems} items
        </div>
      )}
    </div>
  )
}