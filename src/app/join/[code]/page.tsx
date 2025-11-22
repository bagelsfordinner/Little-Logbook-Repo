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
  console.log('🔄 [JOIN PAGE] Component rendering/re-rendering')
  const router = useRouter()
  const params = useParams()
  const code = params.code as string
  
  console.log('🌍 [JOIN PAGE] Initial state:', { 
    params, 
    code, 
    codeType: typeof code,
    codeLength: code?.length 
  })

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
    console.log('🚀 [JOIN PAGE] Starting invite code validation process')
    console.log('📋 [JOIN PAGE] Code from URL params:', { code, codeType: typeof code, codeLength: code?.length })
    
    if (code) {
      console.log('✅ [JOIN PAGE] Code exists, calling validateInviteCode...')
      validateInviteCode(code)
        .then((result) => {
          console.log('📊 [JOIN PAGE] Validation result received:', result)
          console.log('🔍 [JOIN PAGE] Detailed validation check:', {
            valid: result.valid,
            hasLogbookName: !!result.logbookName,
            logbookName: result.logbookName,
            hasRole: !!result.role,
            role: result.role
          })
          
          if (result.valid && result.logbookName && result.role) {
            console.log('🎉 [JOIN PAGE] Validation successful, setting invite data')
            setInviteData({
              logbookName: result.logbookName,
              role: result.role,
            })
          } else {
            console.log('❌ [JOIN PAGE] Validation failed - Missing data:', {
              valid: result.valid,
              logbookName: result.logbookName,
              role: result.role,
              missingLogbookName: !result.logbookName,
              missingRole: !result.role
            })
            setError(result.error || 'Invalid invite code')
          }
        })
        .catch((error) => {
          console.error('💥 [JOIN PAGE] Validation threw error:', error)
          setError('Failed to validate invite code')
        })
        .finally(() => {
          console.log('🏁 [JOIN PAGE] Validation process complete, setting validatingCode to false')
          setValidatingCode(false)
        })
    } else {
      console.log('❌ [JOIN PAGE] No invite code provided in URL')
      setError('No invite code provided')
      setValidatingCode(false)
    }
  }, [code])

  const onSubmit = async (data: SignUpWithInviteFormData) => {
    console.log('🎯 [JOIN PAGE] Form submitted with data:', { ...data, password: '[REDACTED]' })
    console.log('🔑 [JOIN PAGE] Using invite code:', code)
    
    setIsLoading(true)
    setError(null)

    try {
      console.log('📤 [JOIN PAGE] Calling signUpWithInvite...')
      const result = await signUpWithInvite(
        data.email,
        data.password,
        data.displayName,
        code
      )
      
      console.log('📋 [JOIN PAGE] signUpWithInvite result:', result)

      if (result.success) {
        console.log('🎉 [JOIN PAGE] Signup successful, redirecting to dashboard')
        router.push('/dashboard')
      } else {
        console.log('❌ [JOIN PAGE] Signup failed:', result.error)
        setError(result.error || 'Failed to create account')
      }
    } catch (error) {
      console.error('💥 [JOIN PAGE] Signup threw error:', error)
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