'use client'

import { useState } from 'react'
import { Button } from '../../atoms/Button'
import { TextArea } from '../../atoms/TextArea'
import { useOptimisticAction } from '../../../lib/hooks/useOptimisticAction'
import styles from './CommentForm.module.css'

interface CommentFormProps {
  onSubmit: (comment: string) => Promise<void>
  placeholder?: string
  disabled?: boolean
  maxLength?: number
  className?: string
  onOptimisticComment?: (comment: string) => void
}

export default function CommentForm({
  onSubmit,
  placeholder = "Add a comment...",
  disabled = false,
  maxLength = 500,
  className,
  onOptimisticComment
}: CommentFormProps) {
  const [comment, setComment] = useState('')

  const { execute, isLoading, isSuccess, isError } = useOptimisticAction(
    onSubmit,
    {
      onOptimisticUpdate: (comment: string) => {
        onOptimisticComment?.(comment)
        setComment('') // Clear immediately for optimistic UI
      },
      onRollback: () => {
        // Restore the comment if submission fails
        // Note: You'd typically handle this at the parent level
      },
      successDelay: 1000
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!comment.trim() || isLoading) return

    try {
      await execute(comment.trim(), comment.trim())
    } catch (error) {
      // Error already handled by useOptimisticAction
      console.error('Failed to submit comment:', error)
    }
  }

  const canSubmit = comment.trim().length > 0 && !isLoading && !disabled

  const getButtonState = () => {
    if (isLoading) return 'loading'
    if (isSuccess) return 'success'
    if (isError) return 'error'
    return 'default'
  }

  const formClass = [
    styles.form,
    className
  ].filter(Boolean).join(' ')

  return (
    <form className={formClass} onSubmit={handleSubmit}>
      <div className={styles.inputSection}>
        <TextArea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          maxLength={maxLength}
          showCharCount={true}
          rows={3}
          size="sm"
          fullWidth
        />
      </div>
      
      <div className={styles.actions}>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          state={getButtonState()}
          disabled={!canSubmit}
          successText="Posted!"
          errorText="Try again"
        >
          Post Comment
        </Button>
        
        {comment.trim().length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setComment('')}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}