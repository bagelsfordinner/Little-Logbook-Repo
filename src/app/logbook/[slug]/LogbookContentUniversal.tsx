'use client'

import { ContentProvider } from '@/lib/contexts/ContentContext'
import { EditableSection, EditPanel } from '@/components/universal'
import { EditableText } from '@/components/universal/EditableText'
import { InfoCard } from '@/components/molecules/InfoCard'
import { Icon } from '@/components/atoms/Icon'
import PageTransition from '@/components/PageTransition'
import { Header } from '@/components/organisms/Header'
import { HeroSectionUniversal } from './HeroSectionUniversal'
import { LogbookStats } from '@/app/actions/logbook'
import { motion } from 'framer-motion'
import styles from './page.module.css'

interface LogbookContentUniversalProps {
  logbook: {
    id: string
    slug: string
    name: string
    baby_name?: string
    birth_date?: string
    due_date?: string
    page_sections?: Record<string, unknown>
  }
  userRole: string
  initialContent?: Record<string, unknown>
  stats: LogbookStats | null
}

// Navigation Cards Section
function NavigationCards({ 
  logbook, 
  userRole
}: { 
  logbook: { slug: string, name: string }, 
  userRole: string
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

  // Filter cards based on user role
  const visibleItems = allNavigationItems.filter(item => {
    // Admin card only for parents
    if (item.id === 'admin' && userRole !== 'parent') {
      return false
    }
    return true // Show all other cards
  })

  return (
    <section className={styles.navigationSection}>
      <div className={styles.sectionHeader}>
        <EditableText
          path="navigation.title"
          fallback="Explore Our Journey"
          className={styles.sectionTitle}
          element="h2"
          placeholder="Enter section title..."
        />
        <EditableText
          path="navigation.subtitle"
          fallback="Discover memories, milestones, and ways to be part of our growing family story"
          className={styles.sectionSubtitle}
          element="p"
          placeholder="Enter section description..."
          multiline
        />
      </div>
      <motion.div 
        className={styles.navigationGrid}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, staggerChildren: 0.1 }}
      >
        {visibleItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ 
              y: -5,
              transition: { type: 'spring', stiffness: 300, damping: 20 }
            }}
          >
            <InfoCard
              icon={item.icon}
              title={item.title}
              description={item.description}
              variant="default"
              onClick={() => window.location.href = item.href}
            />
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

// Stats Section
function StatsSection({ stats }: { stats: LogbookStats }) {
  if (!stats) return null

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { type: 'spring' as const, damping: 20, stiffness: 300 }
    },
    hover: {
      y: -5,
      scale: 1.05,
      transition: { type: 'spring' as const, damping: 20, stiffness: 300 }
    }
  }

  return (
    <section className={styles.statsSection}>
      <div className={styles.sectionHeader}>
        <EditableText
          path="stats.title"
          fallback="Quick Stats"
          className={styles.sectionTitle}
          element="h2"
          placeholder="Enter stats section title..."
        />
      </div>
      <motion.div 
        className={styles.statsGrid}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className={styles.statCard}
          variants={cardVariants}
          whileHover="hover"
        >
          <Icon name="camera" size="lg" />
          <span className={styles.statValue}>{stats.photoCount}</span>
          <EditableText
            path="stats.photos.label"
            fallback="Photos"
            className={styles.statLabel}
            element="span"
            placeholder="Label..."
          />
        </motion.div>
        <motion.div 
          className={styles.statCard}
          variants={cardVariants}
          whileHover="hover"
        >
          <Icon name="users" size="lg" />
          <span className={styles.statValue}>{stats.memberCount}</span>
          <EditableText
            path="stats.members.label"
            fallback="Members"
            className={styles.statLabel}
            element="span"
            placeholder="Label..."
          />
        </motion.div>
      </motion.div>
    </section>
  )
}

export function LogbookContentUniversal({ 
  logbook, 
  userRole, 
  initialContent = {},
  stats 
}: LogbookContentUniversalProps) {

  // Define sections for the edit panel
  const sections = [
    {
      path: 'hero',
      label: 'Hero Section',
      description: 'Main banner with image and text'
    },
    {
      path: 'navigation',
      label: 'Navigation Cards',
      description: 'Links to other pages'
    },
    {
      path: 'stats',
      label: 'Quick Stats',
      description: 'Photo and member counts'
    }
  ]

  return (
    <ContentProvider
      logbookSlug={logbook.slug}
      pageType="home"
      userRole={userRole as 'parent' | 'family' | 'friend'}
      initialContent={initialContent}
    >
      <PageTransition>
        <motion.div 
          className={styles.page}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Header
            logbookName={logbook.name}
            logbookSlug={logbook.slug}
            logbookId={logbook.id}
            userName="Current User" // This should come from auth
            userRole={(userRole as 'parent' | 'family' | 'friend') || 'friend'}
            currentPath="" // This should be determined from router
          />
          
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <EditableSection path="hero" showToggle={true}>
              <HeroSectionUniversal logbook={logbook} />
            </EditableSection>
          </motion.div>
          
          <div className={styles.content}>
            <div className={styles.contentBackdrop} />
            
            {/* Navigation Cards */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <EditableSection path="navigation" showToggle={true}>
                <NavigationCards 
                  logbook={logbook} 
                  userRole={userRole || 'friend'} 
                />
              </EditableSection>
            </motion.div>

            {/* Stats Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <EditableSection path="stats" showToggle={true}>
                {stats && <StatsSection stats={stats} />}
              </EditableSection>
            </motion.div>
          </div>

          {/* Edit Panel */}
          <EditPanel sections={sections} pageTitle="Home" />
        </motion.div>
      </PageTransition>
    </ContentProvider>
  )
}