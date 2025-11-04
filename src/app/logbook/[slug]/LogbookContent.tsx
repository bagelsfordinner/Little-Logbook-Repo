'use client'

import { EditModeProvider } from '@/lib/contexts/EditModeContext'
import { EditModeToggle } from '@/components/molecules/EditModeToggle'
import { InfoCard } from '@/components/molecules/InfoCard'
import { PageSettingsButton } from '@/components/molecules/PageSettingsButton'
import { Icon } from '@/components/atoms/Icon'
import { Loader } from '@/components/atoms/Loader'
import PageTransition from '@/components/PageTransition'
import { Header } from '@/components/organisms/Header'
import { HeroSection } from './HeroSection'
import { PageTypeSections } from '@/lib/constants/pageSections'
import { LogbookStats } from '@/app/actions/logbook'
import { usePageContent } from '@/lib/hooks/usePageContent'
import styles from './page.module.css'

interface LogbookContentProps {
  logbook: {
    id: string
    slug: string
    name: string
    baby_name?: string
    birth_date?: string
    due_date?: string
    hero_image_url?: string
    hero_title?: string
    hero_subtitle?: string
    page_sections?: Record<string, unknown>
  }
  userRole: string
  sections: PageTypeSections<'home'> | null
  stats: LogbookStats | null
}

// Navigation Cards Section
function NavigationCards({ 
  logbook, 
  userRole, 
  allowedCards
}: { 
  logbook: { slug: string, name: string }, 
  userRole: string,
  allowedCards: string[]
}) {
  const allNavigationItems = [
    {
      id: 'gallery',
      icon: 'camera' as const,
      title: 'Gallery',
      description: 'Browse photos and videos from our journey',
      href: `/logbook/${logbook.slug}/gallery`,
    },
    {
      id: 'help',
      icon: 'heart' as const,
      title: 'How to Help',
      description: 'Registry links, needed items, and ways to support us',
      href: `/logbook/${logbook.slug}/help`,
    },
    {
      id: 'vault',
      icon: 'lock' as const,
      title: 'Memory Vault',
      description: 'Letters, photos, and memories for the future',
      href: `/logbook/${logbook.slug}/vault`,
    },
    {
      id: 'faq',
      icon: 'help-circle' as const,
      title: 'FAQ',
      description: 'Hospital info, visitation, and parenting decisions',
      href: `/logbook/${logbook.slug}/faq`,
    },
    {
      id: 'timeline',
      icon: 'calendar' as const,
      title: 'Timeline',
      description: 'Major milestones and memorable moments',
      href: `/logbook/${logbook.slug}/timeline`,
    },
    {
      id: 'admin',
      icon: 'settings' as const,
      title: 'Admin',
      description: 'Manage members, invites, and settings',
      href: `/logbook/${logbook.slug}/admin`,
    }
  ]

  // Filter cards based on allowedCards and user role
  const visibleItems = allNavigationItems.filter(item => {
    // Admin card only for parents
    if (item.id === 'admin' && userRole !== 'parent') {
      return false
    }
    // Check if card is in allowed cards list
    return allowedCards.includes(item.id)
  })

  return (
    <section className={styles.navigationSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Explore Our Journey</h2>
        <p className={styles.sectionSubtitle}>
          Discover memories, milestones, and ways to be part of our growing family story
        </p>
      </div>
      <div className={styles.navigationGrid}>
        {visibleItems.map((item) => (
          <InfoCard
            key={item.id}
            icon={item.icon}
            title={item.title}
            description={item.description}
            variant="default"
            onClick={() => window.location.href = item.href}
          />
        ))}
      </div>
    </section>
  )
}

// Stats Section
function StatsSection({ stats }: { stats: LogbookStats }) {
  if (!stats) return null

  return (
    <section className={styles.statsSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Quick Stats</h2>
      </div>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <Icon name="camera" size="lg" />
          <span className={styles.statValue}>{stats.photoCount}</span>
          <span className={styles.statLabel}>Photos</span>
        </div>
        <div className={styles.statCard}>
          <Icon name="mail" size="lg" />
          <span className={styles.statValue}>{stats.commentCount}</span>
          <span className={styles.statLabel}>Comments</span>
        </div>
        <div className={styles.statCard}>
          <Icon name="users" size="lg" />
          <span className={styles.statValue}>{stats.memberCount}</span>
          <span className={styles.statLabel}>Members</span>
        </div>
      </div>
    </section>
  )
}

export function LogbookContent({ logbook, userRole, sections: initialSections, stats }: LogbookContentProps) {
  // Use usePageContent hook for real-time updates
  const { sections: liveSections, loading, error, invalidate } = usePageContent('home', logbook.slug)
  
  // Use live sections if available, otherwise fall back to initial sections
  const sections = liveSections || initialSections

  const handleRefresh = () => {
    invalidate()
  }

  const handleSignOut = () => {
    // Implement sign out logic
    window.location.href = '/login'
  }

  const handleDashboard = () => {
    window.location.href = '/dashboard'
  }

  // Get page settings from logbook data - stored under admin page type
  const pageSettings = (logbook.page_sections?.admin as Record<string, unknown>)?.pageSettings as Record<string, { visible?: boolean }> || {}

  // Show loading state if sections are not available
  if (!sections && loading) {
    return (
      <div className={styles.loading}>
        <Loader size="lg" />
        <p>Loading page content...</p>
      </div>
    )
  }

  // Show error state if sections failed to load
  if (error && !sections) {
    return (
      <div className={styles.loading}>
        <Icon name="alert-circle" size="lg" />
        <p>Failed to load page content</p>
        <button onClick={() => invalidate()}>Try Again</button>
      </div>
    )
  }

  // Show loading if we still don't have sections
  if (!sections) {
    return (
      <div className={styles.loading}>
        <Loader size="lg" />
        <p>Loading page content...</p>
      </div>
    )
  }

  return (
    <EditModeProvider>
      <PageTransition>
        <div className={styles.page}>
          <Header
            logbookName={logbook.name}
            logbookSlug={logbook.slug}
            logbookId={logbook.id}
            userName="Current User" // This should come from auth
            userRole={(userRole as 'parent' | 'family' | 'friend') || 'friend'}
            currentPath="" // This should be determined from router
            pageSettings={pageSettings}
            onSignOut={handleSignOut}
            onDashboard={handleDashboard}
          />
          
          <EditModeToggle userRole={userRole as 'parent' | 'family' | 'friend'} />
          
          {/* Hero Section */}
          {sections.hero.visible && (
            <HeroSection 
              logbook={logbook} 
              userRole={userRole || 'friend'} 
              onRefresh={handleRefresh}
              sections={sections}
            />
          )}
          
          <div className={styles.content}>
            <div className={styles.contentBackdrop} />
            
            {/* Navigation Cards */}
            {sections.navigation.visible && (
              <NavigationCards 
                logbook={logbook} 
                userRole={userRole || 'friend'} 
                allowedCards={[...sections.navigation.cards]}
              />
            )}

            {/* Stats Section */}
            {sections.stats.visible && stats && (
              <StatsSection stats={stats} />
            )}
          </div>

          {/* Page Settings Button - only show when in edit mode and user is parent */}
          {userRole === 'parent' && (
            <PageSettingsButton
              pageType="home"
              logbookSlug={logbook.slug}
              userRole={userRole as 'parent' | 'family' | 'friend'}
              variant="floating"
            />
          )}
        </div>
      </PageTransition>
    </EditModeProvider>
  )
}