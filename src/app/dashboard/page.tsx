import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getUserLogbooks, getCurrentUser } from '@/app/actions/dashboard'
import { signOut } from '@/app/actions/auth'
import { navigateToLogbook } from '@/app/actions/logbook'
import { Icon } from '@/components/atoms/Icon'
import type { UserLogbook } from '@/app/actions/dashboard'
import styles from './page.module.css'

// Loading component for suspense
function DashboardLoading() {
  return (
    <div className={styles.container}>
      <div className={styles.decorativeElements}>
        <div className={styles.decorativeCircle1}></div>
        <div className={styles.decorativeCircle2}></div>
        <div className={styles.decorativeCircle3}></div>
      </div>
      <div className={styles.loadingContent}>
        <div className={styles.brandMark}>
          <Icon name="book-open" size="lg" />
        </div>
        <div className={styles.loadingText}>Loading your logbooks...</div>
        <div className={styles.spinner}></div>
      </div>
    </div>
  )
}

// Role badge component
function RoleBadge({ role }: { role: 'parent' | 'family' | 'friend' }) {
  const roleConfig = {
    parent: { label: 'Admin', className: styles.badgeAdmin },
    family: { label: 'Family', className: styles.badgeFamily },
    friend: { label: 'Friend', className: styles.badgeFriend },
  }

  const config = roleConfig[role]
  
  return (
    <span className={`${styles.badge} ${config.className}`}>
      {config.label}
    </span>
  )
}

// Logbook card component
function LogbookCard({ logbook }: { logbook: UserLogbook }) {
  async function navigateAction(formData: FormData) {
    'use server'
    const logbookId = formData.get('logbookId') as string
    const slug = formData.get('slug') as string
    await navigateToLogbook(logbookId, slug)
  }

  const formatLastVisited = (dateString: string | null) => {
    if (!dateString) return null
    
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    
    return date.toLocaleDateString()
  }

  return (
    <form action={navigateAction} className={styles.cardForm}>
      <input type="hidden" name="logbookId" value={logbook.id} />
      <input type="hidden" name="slug" value={logbook.slug} />
      <button type="submit" className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>{logbook.name}</h3>
          <RoleBadge role={logbook.role} />
        </div>
        
        <div className={styles.cardContent}>
          <div className={styles.cardSlug}>/{logbook.slug}</div>
          {logbook.last_visited_at && (
            <div className={styles.cardLastVisited}>
              Last visited: {formatLastVisited(logbook.last_visited_at)}
            </div>
          )}
        </div>
        
        <div className={styles.cardFooter}>
          <span className={styles.cardAction}>
            <Icon name="external-link" size="sm" />
            Open Logbook
          </span>
        </div>
      </button>
    </form>
  )
}

// Empty state component
function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIconContainer}>
        <Icon name="book-open" size="lg" />
      </div>
      <h3 className={styles.emptyTitle}>No logbooks yet</h3>
      <p className={styles.emptyDescription}>
        Create your first family logbook to start documenting your adventures together.
      </p>
      <a href="/create-logbook" className={styles.primaryButton}>
        <Icon name="plus-circle" size="sm" />
        Create Your First Logbook
      </a>
    </div>
  )
}

// Main dashboard content
async function DashboardContent() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  const { logbooks, error } = await getUserLogbooks()

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.decorativeElements}>
          <div className={styles.decorativeCircle1}></div>
          <div className={styles.decorativeCircle2}></div>
        </div>
        <div className={styles.error}>
          <div className={styles.errorIconContainer}>
            <Icon name="alert-circle" size="lg" />
          </div>
          <h2>Error loading dashboard</h2>
          <p>{error}</p>
          <a href="/dashboard" className={styles.secondaryButton}>
            <Icon name="refresh-cw" size="sm" />
            Try Again
          </a>
        </div>
      </div>
    )
  }

  const hasLogbooks = logbooks && logbooks.length > 0

  return (
    <div className={styles.container}>
      <div className={styles.decorativeElements}>
        <div className={styles.decorativeCircle1}></div>
        <div className={styles.decorativeCircle2}></div>
        <div className={styles.decorativeCircle3}></div>
      </div>
      
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerInfo}>
            <div className={styles.brandMark}>
              <Icon name="book-open" size="lg" />
            </div>
            <h1 className={styles.title}>Welcome back, {user.display_name}</h1>
            <p className={styles.subtitle}>
              {hasLogbooks 
                ? `You have access to ${logbooks.length} logbook${logbooks.length > 1 ? 's' : ''}`
                : 'Ready to start your first logbook?'
              }
            </p>
          </div>
          
          <div className={styles.headerActions}>
            <a href="/create-logbook" className={styles.primaryButton}>
              <Icon name="plus-circle" size="sm" />
              Create New Logbook
            </a>
            <form action={async () => {
              'use server'
              await signOut()
            }} className={styles.signOutForm}>
              <button type="submit" className={styles.secondaryButton}>
                <Icon name="user" size="sm" />
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {hasLogbooks ? (
          <div className={styles.grid}>
            {logbooks.map((logbook) => (
              <LogbookCard key={logbook.id} logbook={logbook} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  )
}

// Main page component
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  )
}