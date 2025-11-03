import { useState, useCallback } from 'react'

interface UseOptimisticActionOptions<T> {
  onOptimisticUpdate?: (data: T) => void
  onRollback?: () => void
  successDelay?: number
}

interface UseOptimisticActionReturn<T> {
  execute: (data: T, optimisticData?: T) => Promise<void>
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  error: Error | null
}

export function useOptimisticAction<T>(
  action: (data: T) => Promise<void>,
  options: UseOptimisticActionOptions<T> = {}
): UseOptimisticActionReturn<T> {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const {
    onOptimisticUpdate,
    onRollback,
    successDelay = 1000
  } = options

  const execute = useCallback(async (data: T, optimisticData?: T) => {
    setIsLoading(true)
    setIsSuccess(false)
    setIsError(false)
    setError(null)

    // Apply optimistic update immediately
    if (onOptimisticUpdate && optimisticData !== undefined) {
      onOptimisticUpdate(optimisticData)
    }

    try {
      await action(data)
      
      setIsLoading(false)
      setIsSuccess(true)
      
      // Reset success state after delay
      setTimeout(() => {
        setIsSuccess(false)
      }, successDelay)
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred')
      
      setIsLoading(false)
      setIsError(true)
      setError(error)
      
      // Rollback optimistic update
      if (onRollback) {
        onRollback()
      }
      
      // Reset error state after delay
      setTimeout(() => {
        setIsError(false)
        setError(null)
      }, successDelay)
      
      throw error
    }
  }, [action, onOptimisticUpdate, onRollback, successDelay])

  return {
    execute,
    isLoading,
    isSuccess,
    isError,
    error
  }
}