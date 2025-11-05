'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signUpWithInvite, validateInviteCode } from '@/app/actions/auth'
import { Icon } from '@/components/atoms/Icon'
import styles from './page.module.css'

const signUpWithInviteSchema = z.object({
  displayName: z.string().min(1, 'Display name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignUpWithInviteFormData = z.infer<typeof signUpWithInviteSchema>

export default function JoinWithCodePage() {
  const router = useRouter()
  const params = useParams()
  const code = params.code as string

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validatingCode, setValidatingCode] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [inviteData, setInviteData] = useState<{
    logbookName: string
    role: string
  } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpWithInviteFormData>({
    resolver: zodResolver(signUpWithInviteSchema),
  })

  // Validate invite code on page load
  useEffect(() => {
    if (code) {
      validateInviteCode(code)
        .then((result) => {
          if (result.valid && result.logbookName && result.role) {
            setInviteData({
              logbookName: result.logbookName,
              role: result.role,
            })
          } else {
            setError(result.error || 'Invalid invite code')
          }
        })
        .catch(() => {
          setError('Failed to validate invite code')
        })
        .finally(() => {
          setValidatingCode(false)
        })
    } else {
      setError('No invite code provided')
      setValidatingCode(false)
    }
  }, [code])

  const onSubmit = async (data: SignUpWithInviteFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signUpWithInvite(
        data.email,
        data.password,
        data.displayName,
        code
      )

      if (result.success) {
        router.push('/dashboard')
      } else {
        setError(result.error || 'Failed to create account')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (validatingCode) {
    return (
      <div className={styles.container}>
        <div className={styles.decorativeElements}>
          <div className={styles.decorativeCircle1}></div>
          <div className={styles.decorativeCircle2}></div>
        </div>
        <div className={styles.loadingCard}>
          <div className={styles.brandMark}>
            <Icon name="book-open" size="lg" />
          </div>
          <div className={styles.spinner}></div>
          <p>Validating invite code...</p>
        </div>
      </div>
    )
  }

  if (error && !inviteData) {
    return (
      <div className={styles.container}>
        <div className={styles.decorativeElements}>
          <div className={styles.decorativeCircle1}></div>
          <div className={styles.decorativeCircle2}></div>
        </div>
        <div className={styles.errorCard}>
          <div className={styles.brandMark}>
            <Icon name="book-open" size="lg" />
          </div>
          <h1 className={styles.errorTitle}>Invalid Invite Code</h1>
          <p className={styles.errorMessage}>{error}</p>
          <div className={styles.errorActions}>
            <a href="/signup" className={styles.primaryButton}>
              Create Your Own Logbook
            </a>
            <a href="/login" className={styles.secondaryButton}>
              Sign In Instead
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.decorativeElements}>
        <div className={styles.decorativeCircle1}></div>
        <div className={styles.decorativeCircle2}></div>
      </div>
      <div className={styles.formCard}>
        <div className={styles.header}>
          <div className={styles.brandMark}>
            <Icon name="book-open" size="lg" />
          </div>
          <h1 className={styles.title}>Join {inviteData?.logbookName}</h1>
          <p className={styles.subtitle}>
            You&apos;ve been invited to join as a <strong>{inviteData?.role}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {error && (
            <div className={styles.error}>
              {error}
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

          <button
            type="submit"
            disabled={isLoading}
            className={styles.submitButton}
          >
            {isLoading ? 'Creating Account...' : 'Join Logbook'}
          </button>
        </form>

        <div className={styles.footer}>
          <p>
            Already have an account?{' '}
            <a href="/login" className={styles.link}>
              Sign in instead
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}