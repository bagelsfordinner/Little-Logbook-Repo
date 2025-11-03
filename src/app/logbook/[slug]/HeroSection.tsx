'use client'

import { differenceInDays } from 'date-fns'
import { EditableText } from '@/components/atoms/EditableText'
import { EditableImage } from '@/components/atoms/EditableImage'
import { updatePageSection } from '@/app/actions/content'
import { uploadAndUpdateSectionImage } from '@/app/actions/upload'
import { PageTypeSections } from '@/lib/constants/pageSections'
import styles from './page.module.css'

interface HeroSectionProps {
  logbook: {
    slug: string
    baby_name?: string
    birth_date?: string
    due_date?: string
    hero_image_url?: string
    hero_title?: string
    hero_subtitle?: string
    name: string
  }
  userRole: string
  onRefresh: () => void
  sections?: PageTypeSections<'home'>
}

export function HeroSection({ logbook, userRole, onRefresh, sections }: HeroSectionProps) {
  // Use sections data if available, otherwise fall back to logbook data
  const heroImageUrl = sections?.hero.imageUrl || logbook.hero_image_url || ''
  const heroTitle = sections?.hero.title || logbook.hero_title || 'Welcome to Our Journey'
  const heroSubtitle = sections?.hero.subtitle || logbook.hero_subtitle || 'Following our adventure'
  const babyName = logbook.baby_name || `Baby ${logbook.name.split(' ')[0]}`
  const showDueDate = sections?.hero.showDueDate ?? true

  const canEdit = userRole === 'parent'

  // Calculate due date or age
  let timeDisplay = ''
  if (logbook.birth_date) {
    const birthDate = new Date(logbook.birth_date)
    const daysSinceBirth = differenceInDays(new Date(), birthDate)
    
    if (daysSinceBirth < 30) {
      timeDisplay = `${daysSinceBirth} days old`
    } else {
      const months = Math.floor(daysSinceBirth / 30)
      timeDisplay = `${months} month${months > 1 ? 's' : ''} old`
    }
  } else if (logbook.due_date) {
    const dueDate = new Date(logbook.due_date)
    const daysUntilDue = differenceInDays(dueDate, new Date())
    
    if (daysUntilDue > 0) {
      timeDisplay = `Due in ${daysUntilDue} days`
    } else if (daysUntilDue === 0) {
      timeDisplay = 'Due today!'
    } else {
      timeDisplay = `${Math.abs(daysUntilDue)} days overdue`
    }
  }

  const handleTitleChange = async (newTitle: string) => {
    const result = await updatePageSection(logbook.slug, 'home', 'hero', {
      title: newTitle
    })
    if (result.success) {
      onRefresh()
    } else {
      throw new Error(result.error || 'Failed to update title')
    }
  }

  const handleSubtitleChange = async (newSubtitle: string) => {
    const result = await updatePageSection(logbook.slug, 'home', 'hero', {
      subtitle: newSubtitle
    })
    if (result.success) {
      onRefresh()
    } else {
      throw new Error(result.error || 'Failed to update subtitle')
    }
  }

  const handleImageChange = async (file: File) => {
    const result = await uploadAndUpdateSectionImage(
      logbook.slug,
      'home',
      'hero',
      'imageUrl',
      file
    )
    if (result.success) {
      onRefresh()
    } else {
      throw new Error(result.error || 'Failed to update image')
    }
  }

  return (
    <div className={styles.heroSection}>
      <div className={styles.heroImageContainer}>
        <EditableImage
          src={heroImageUrl}
          alt="Hero image"
          onChange={handleImageChange}
          canEdit={canEdit}
          aspectRatio="landscape"
          className={styles.heroImage}
        />
      </div>
      
      <div className={styles.heroTextContainer}>
        <div className={styles.heroContent}>
          <h1 className={styles.babyName}>{babyName}</h1>
          
          <EditableText
            value={heroTitle}
            onChange={handleTitleChange}
            variant="title"
            canEdit={canEdit}
            placeholder="Enter a title for your journey..."
            className={styles.heroTitle}
          />
          
          <EditableText
            value={heroSubtitle}
            onChange={handleSubtitleChange}
            variant="subtitle"
            canEdit={canEdit}
            placeholder="Add a subtitle..."
            className={styles.heroSubtitle}
          />
          
          {showDueDate && timeDisplay && (
            <div className={styles.timeDisplay}>{timeDisplay}</div>
          )}
        </div>
      </div>
    </div>
  )
}