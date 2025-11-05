'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { signIn } from '@/app/actions/auth'
import { Icon } from '@/components/atoms/Icon'
import styles from './page.module.css'

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type SignInFormData = z.infer<typeof signInSchema>

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  })

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn(data.email, data.password)

      if (result.success) {
        router.push('/dashboard')
      } else {
        setError(result.error || 'Failed to sign in')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
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
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>
            Sign in to your Little Logbook account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

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
              autoComplete="email"
            />
            {errors.email && (
              <span className={styles.fieldError}>{errors.email.message}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              {...register('password')}
              type="password"
              id="password"
              className={styles.input}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
            {errors.password && (
              <span className={styles.fieldError}>{errors.password.message}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={styles.submitButton}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className={styles.footer}>
          <p>
            Don&apos;t have an account?{' '}
            <a href="/signup" className={styles.link}>
              Create one
            </a>
          </p>
          <p>
            Have an invite code?{' '}
            <Link href="/join" className={styles.link}>
              Join a logbook
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}