'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'

export interface OptimisticState {
  isSubmitting: boolean
  isSuccess: boolean
  isError: boolean
  error: string | null
  optimisticData: unknown
}

export interface UseOptimisticFormOptions<TData = unknown> {
  onSubmit: (data: TData) => Promise<{ success: boolean; error?: string; data?: unknown }>
  onSuccess?: (data?: unknown) => void
  onError?: (error: string) => void
  optimisticUpdate?: (data: TData) => unknown
  successDelay?: number
  errorDelay?: number
}

export function useOptimisticForm<TData = unknown>({
  onSubmit,
  onSuccess,
  onError,
  optimisticUpdate,
  successDelay = 1000,
  errorDelay = 3000
}: UseOptimisticFormOptions<TData>) {
  const [state, setState] = useState<OptimisticState>({
    isSubmitting: false,
    isSuccess: false,
    isError: false,
    error: null,
    optimisticData: null
  })

  const handleSubmit = useCallback(async (data: TData) => {
    // Start optimistic update
    setState(prev => ({
      ...prev,
      isSubmitting: true,
      isError: false,
      isSuccess: false,
      error: null,
      optimisticData: optimisticUpdate ? optimisticUpdate(data) : null
    }))

    try {
      const result = await onSubmit(data)

      if (result.success) {
        // Show success state
        setState(prev => ({
          ...prev,
          isSubmitting: false,
          isSuccess: true,
          optimisticData: result.data || prev.optimisticData
        }))

        // Call success callback
        onSuccess?.(result.data)

        // Clear success state after delay
        setTimeout(() => {
          setState(prev => ({
            ...prev,
            isSuccess: false,
            optimisticData: null
          }))
        }, successDelay)

      } else {
        // Handle error
        setState(prev => ({
          ...prev,
          isSubmitting: false,
          isError: true,
          error: result.error || 'An error occurred',
          optimisticData: null
        }))

        onError?.(result.error || 'An error occurred')

        // Clear error state after delay
        setTimeout(() => {
          setState(prev => ({
            ...prev,
            isError: false,
            error: null
          }))
        }, errorDelay)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        isError: true,
        error: errorMessage,
        optimisticData: null
      }))

      onError?.(errorMessage)

      // Clear error state after delay
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          isError: false,
          error: null
        }))
      }, errorDelay)
    }
  }, [onSubmit, onSuccess, onError, optimisticUpdate, successDelay, errorDelay])

  const reset = useCallback(() => {
    setState({
      isSubmitting: false,
      isSuccess: false,
      isError: false,
      error: null,
      optimisticData: null
    })
  }, [])

  return {
    state,
    handleSubmit,
    reset
  }
}

// Utility component for optimistic feedback
export function OptimisticFeedback({ 
  state, 
  successMessage = 'Success!',
  className = '',
  children 
}: { 
  state: OptimisticState
  successMessage?: string
  className?: string
  children?: React.ReactNode
}) {
  return (
    <motion.div 
      className={className}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {state.isSubmitting && (
        <div className="flex items-center gap-2 text-blue-600">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
          />
          <span>Processing...</span>
        </div>
      )}

      {state.isSuccess && (
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-2 text-green-600"
        >
          <motion.svg
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5 }}
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <motion.path d="M20 6L9 17l-5-5" />
          </motion.svg>
          <span>{successMessage}</span>
        </motion.div>
      )}

      {state.isError && state.error && (
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-2 text-red-600"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span>{state.error}</span>
        </motion.div>
      )}

      {children}
    </motion.div>
  )
}