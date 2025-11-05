'use client'

import { differenceInDays } from 'date-fns'
import { Editable } from '@/components/universal/Editable'
import { EditableText } from '@/components/universal/EditableText'
import styles from './page.module.css'

interface HeroSectionUniversalProps {
  logbook: {
    slug: string
    baby_name?: string
    birth_date?: string
    due_date?: string
    name: string
  }
}

export function HeroSectionUniversal({ logbook }: HeroSectionUniversalProps) {
  const babyName = logbook.baby_name || `Baby ${logbook.name.split(' ')[0]}`

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

  return (
    <div className={styles.heroSection}>
      {/* Hero Image */}
      <div className={styles.heroImageContainer}>
        <Editable
          path="hero.image"
          type="image"
          fallback=""
          className={styles.heroImage}
        />
      </div>
      
      {/* Hero Text */}
      <div className={styles.heroTextContainer}>
        <div className={styles.heroContent}>
          {/* Baby Name (editable) */}
          <EditableText
            path="hero.babyName"
            fallback={babyName}
            className={styles.babyName}
            placeholder="Enter baby's name..."
            element="h1"
          />
          
          {/* Editable Title */}
          <EditableText
            path="hero.title"
            fallback="Welcome to Our Journey"
            className={styles.heroTitle}
            placeholder="Enter a title for your journey..."
            element="h2"
          />
          
          {/* Editable Subtitle */}
          <EditableText
            path="hero.subtitle"
            fallback="Following our adventure"
            className={styles.heroSubtitle}
            placeholder="Add a subtitle..."
            element="p"
          />
          
          {/* Due Date/Age Display */}
          {timeDisplay && (
            <div className={styles.timeDisplay}>{timeDisplay}</div>
          )}
        </div>
      </div>
    </div>
  )
}