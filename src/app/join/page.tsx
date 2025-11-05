'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/atoms/Icon'
import styles from './page.module.css'

export default function JoinPage() {
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inviteCode.trim()) {
      return
    }

    setIsLoading(true)
    
    // Clean up the invite code (remove any whitespace, convert to uppercase)
    const cleanCode = inviteCode.trim().toUpperCase()
    
    // Redirect to the invite code validation page
    router.push(`/join/${cleanCode}`)
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
          <h1 className={styles.title}>Join a Family Logbook</h1>
          <p className={styles.subtitle}>
            Enter your invite code to join an existing family logbook
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="inviteCode" className={styles.label}>
              Invite Code
            </label>
            <input
              type="text"
              id="inviteCode"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className={styles.input}
              placeholder="Enter your invite code"
              disabled={isLoading}
              autoComplete="off"
              autoFocus
            />
            <p className={styles.inputHint}>
              This should be provided by the family who invited you
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !inviteCode.trim()}
            className={styles.submitButton}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner}></span>
                Validating...
              </>
            ) : (
              'Continue with Invite Code'
            )}
          </button>
        </form>

        <div className={styles.divider}>
          <span className={styles.dividerText}>or</span>
        </div>

        <div className={styles.alternativeActions}>
          <button
            onClick={() => router.push('/signup')}
            className={styles.secondaryButton}
          >
            Create Your Own Logbook
          </button>
          <button
            onClick={() => router.push('/login')}
            className={styles.linkButton}
          >
            Already have an account? Sign In
          </button>
        </div>
      </div>
    </div>
  )
}