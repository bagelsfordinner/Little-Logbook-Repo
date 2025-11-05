'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signUp, checkSlugAvailability } from '@/app/actions/auth'
import { slugify, generateRandomSuffix } from '@/lib/utils/slugify'
import { useDebounce } from '@/hooks/useDebounce'
import { Icon } from '@/components/atoms/Icon'
import styles from './page.module.css'

const signUpSchema = z.object({
  displayName: z.string().min(1, 'Display name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  logbookName: z.string().min(1, 'Logbook name is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignUpFormData = z.infer<typeof signUpSchema>

export default function SignUpPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedSlug, setGeneratedSlug] = useState<string>('')
  const [slugStatus, setSlugStatus] = useState<'checking' | 'available' | 'generating' | 'ready'>('ready')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  })

  const logbookName = watch('logbookName')
  const debouncedLogbookName = useDebounce(logbookName, 500)

  // Auto-generate slug when logbook name changes
  useEffect(() => {
    if (debouncedLogbookName && debouncedLogbookName.trim()) {
      generateUniqueSlug(debouncedLogbookName.trim())
    } else {
      setGeneratedSlug('')
      setSlugStatus('ready')
    }
  }, [debouncedLogbookName])

  const generateUniqueSlug = async (name: string) => {
    setSlugStatus('checking')
    
    try {
      // Try the basic slug first
      const baseSlug = slugify(name)
      const { available } = await checkSlugAvailability(baseSlug)
      
      if (available) {
        setGeneratedSlug(baseSlug)
        setSlugStatus('available')
        return
      }
      
      // If not available, generate one with random suffix
      setSlugStatus('generating')
      let attempts = 0
      let uniqueSlug = ''
      
      while (attempts < 5) {
        const suffix = generateRandomSuffix()
        uniqueSlug = `${baseSlug}-${suffix}`
        
        const { available: suffixAvailable } = await checkSlugAvailability(uniqueSlug)
        if (suffixAvailable) {
          setGeneratedSlug(uniqueSlug)
          setSlugStatus('available')
          return
        }
        
        attempts++
      }
      
      // Fallback: use timestamp
      const timestamp = Date.now().toString().slice(-4)
      setGeneratedSlug(`${baseSlug}-${timestamp}`)
      setSlugStatus('available')
      
    } catch (error) {
      console.error('Error generating slug:', error)
      // Use fallback slug
      const fallbackSlug = `${slugify(name)}-${Date.now().toString().slice(-4)}`
      setGeneratedSlug(fallbackSlug)
      setSlugStatus('available')
    }
  }

  const onSubmit = async (data: SignUpFormData) => {
    if (!generatedSlug) {
      setError('Please wait for the logbook URL to be generated')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('🚀 Starting signup from client...', { 
        email: data.email, 
        displayName: data.displayName, 
        logbookName: data.logbookName,
        generatedSlug 
      })

      const result = await signUp(
        data.email,
        data.password,
        data.displayName,
        data.logbookName,
        generatedSlug
      )

      if (result.success) {
        console.log('✅ Signup successful, redirecting to dashboard')
        router.push('/dashboard')
      } else {
        console.error('❌ Signup failed:', result.error)
        setError(result.error || 'Failed to create account')
      }
    } catch (err) {
      console.error('❌ Signup exception:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const dismissError = () => {
    setError(null)
  }

  return (
    <div className={styles.container}>
      <div className={styles.decorativeElements}>
        <div className={styles.decorativeCircle1}></div>
        <div className={styles.decorativeCircle2}></div>
        <div className={styles.decorativeCircle3}></div>
      </div>
      <div className={styles.formCard}>
        <div className={styles.header}>
          <div className={styles.brandMark}>
            <Icon name="book-open" size="lg" />
          </div>
          <h1 className={styles.title}>Create Your Family Logbook</h1>
          <p className={styles.subtitle}>
            Start documenting your family&apos;s adventures together
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {error && (
            <div className={styles.error}>
              <span>{error}</span>
              <button 
                type="button" 
                onClick={dismissError}
                className={styles.errorDismiss}
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="displayName" className={styles.label}>
              Your Name
            </label>
            <input
              {...register('displayName')}
              type="text"
              id="displayName"
              className={styles.input}
              placeholder="John Smith"
              disabled={isLoading}
            />
            {errors.displayName && (
              <span className={styles.fieldError}>{errors.displayName.message}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              Email Address
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
              className={styles.input}
              placeholder="john@example.com"
              disabled={isLoading}
            />
            {errors.email && (
              <span className={styles.fieldError}>{errors.email.message}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <div className={styles.passwordInputContainer}>
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                id="password"
                className={styles.input}
                placeholder="At least 8 characters"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.passwordToggle}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <Icon name={showPassword ? 'eye-off' : 'eye'} size="sm" />
              </button>
            </div>
            {errors.password && (
              <span className={styles.fieldError}>{errors.password.message}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Confirm Password
            </label>
            <div className={styles.passwordInputContainer}>
              <input
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                className={styles.input}
                placeholder="Re-enter your password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={styles.passwordToggle}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                <Icon name={showConfirmPassword ? 'eye-off' : 'eye'} size="sm" />
              </button>
            </div>
            {errors.confirmPassword && (
              <span className={styles.fieldError}>{errors.confirmPassword.message}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="logbookName" className={styles.label}>
              Logbook Name
            </label>
            <input
              {...register('logbookName')}
              type="text"
              id="logbookName"
              className={styles.input}
              placeholder="Smith Family"
              disabled={isLoading}
            />
            {errors.logbookName && (
              <span className={styles.fieldError}>{errors.logbookName.message}</span>
            )}
          </div>

          {logbookName && (
            <div className={styles.slugPreview}>
              <label className={styles.label}>Your Logbook URL</label>
              <div className={styles.slugDisplay}>
                <span className={styles.slugPrefix}>littlelogbook.com/</span>
                <span className={styles.slugValue}>
                  {slugStatus === 'checking' && 'checking...'}
                  {slugStatus === 'generating' && 'generating...'}
                  {slugStatus === 'available' && generatedSlug}
                  {slugStatus === 'ready' && ''}
                </span>
              </div>
              {slugStatus === 'checking' && (
                <span className={styles.slugStatus}>Checking availability...</span>
              )}
              {slugStatus === 'generating' && (
                <span className={styles.slugStatus}>Generating unique URL...</span>
              )}
              {slugStatus === 'available' && (
                <span className={styles.slugAvailable}>✓ URL ready</span>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !generatedSlug || slugStatus !== 'available'}
            className={styles.submitButton}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner}></span>
                Creating your account...
              </>
            ) : (
              'Create Account & Logbook'
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <p>
            Already have an account?{' '}
            <a href="/login" className={styles.link}>
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}