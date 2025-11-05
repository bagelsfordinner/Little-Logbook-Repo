'use client'

import { Icon } from '@/components/atoms/Icon'
import styles from './PageLoader.module.css'

interface PageLoaderProps {
  isVisible: boolean
}

export default function PageLoader({ isVisible }: PageLoaderProps) {
  console.log('PageLoader: isVisible =', isVisible)
  
  if (!isVisible) {
    console.log('PageLoader: Not visible, returning null')
    return null
  }

  console.log('PageLoader: Rendering loader overlay')
  return (
    <div className={styles.overlay}>
      <div className={styles.loaderContainer}>
        <div className={styles.bookIcon}>
          <Icon name="book-open" size="lg" />
        </div>
        <div className={styles.loadingText}>Loading...</div>
        <div className={styles.spinner}></div>
      </div>
    </div>
  )
}