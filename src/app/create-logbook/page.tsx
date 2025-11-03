'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createLogbook } from '@/app/actions/logbook'
import { checkSlugAvailability } from '@/app/actions/auth'
import { slugify } from '@/lib/utils/slugify'
import { useDebounce } from '@/hooks/useDebounce'
import styles from './page.module.css'

const createLogbookSchema = z.object({
  name: z.string().min(1, 'Logbook name is required'),
  slug: z.string().min(1, 'Logbook slug is required'),
})

type CreateLogbookFormData = z.infer<typeof createLogbookSchema>

export default function CreateLogbookPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateLogbookFormData>({
    resolver: zodResolver(createLogbookSchema),
  })

  const logbookName = watch('name')
  const logbookSlug = watch('slug')
  const debouncedSlug = useDebounce(logbookSlug, 500)

  // Auto-generate slug from logbook name
  useEffect(() => {
    if (logbookName && !logbookSlug) {
      const generatedSlug = slugify(logbookName)
      setValue('slug', generatedSlug)
    }
  }, [logbookName, logbookSlug, setValue])

  // Check slug availability
  useEffect(() => {
    if (debouncedSlug && debouncedSlug.length > 0) {
      setCheckingSlug(true)
      checkSlugAvailability(debouncedSlug)
        .then(({ available }) => {
          setSlugAvailable(available)
        })
        .catch(() => {
          setSlugAvailable(false)
        })
        .finally(() => {
          setCheckingSlug(false)
        })
    } else {
      setSlugAvailable(null)
    }
  }, [debouncedSlug])

  const onSubmit = async (data: CreateLogbookFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await createLogbook(data.name, data.slug)

      if (result.success && result.logbookSlug) {
        router.push(`/logbook/${result.logbookSlug}`)
      } else {
        setError(result.error || 'Failed to create logbook')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/dashboard')
  }

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <div className={styles.header}>
          <h1 className={styles.title}>Create New Logbook</h1>
          <p className={styles.subtitle}>
            Start a new family logbook to document your adventures
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="name" className={styles.label}>
              Logbook Name
            </label>
            <input
              {...register('name')}
              type="text"
              id="name"
              className={styles.input}
              placeholder="Smith Family Adventures"
              autoFocus
            />
            {errors.name && (
              <span className={styles.fieldError}>{errors.name.message}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="slug" className={styles.label}>
              Logbook URL
            </label>
            <div className={styles.slugContainer}>
              <span className={styles.slugPrefix}>littlelogbook.com/</span>
              <input
                {...register('slug')}
                type="text"
                id="slug"
                className={styles.slugInput}
                placeholder="smith-family-adventures"
              />
            </div>
            {checkingSlug && (
              <span className={styles.slugStatus}>Checking availability...</span>
            )}
            {!checkingSlug && slugAvailable === true && (
              <span className={styles.slugAvailable}>✓ Available</span>
            )}
            {!checkingSlug && slugAvailable === false && (
              <span className={styles.slugUnavailable}>✗ Not available</span>
            )}
            {errors.slug && (
              <span className={styles.fieldError}>{errors.slug.message}</span>
            )}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleCancel}
              className={styles.cancelButton}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || slugAvailable === false}
              className={styles.submitButton}
            >
              {isLoading ? 'Creating...' : 'Create Logbook'}
            </button>
          </div>
        </form>

        <div className={styles.info}>
          <h3 className={styles.infoTitle}>What happens next?</h3>
          <ul className={styles.infoList}>
            <li>You&apos;ll be the admin of this logbook</li>
            <li>You can invite family and friends to join</li>
            <li>Start adding entries, photos, and memories</li>
            <li>Everyone can contribute to the shared story</li>
          </ul>
        </div>
      </div>
    </div>
  )
}