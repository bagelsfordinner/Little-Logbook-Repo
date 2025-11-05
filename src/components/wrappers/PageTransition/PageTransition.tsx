'use client'

import { ReactNode, useEffect, useState } from 'react'
import { usePageTransition } from '@/components/contexts/PageTransitionContext'
import { PageLoader } from '@/components/atoms/PageLoader'
import styles from './PageTransition.module.css'

interface PageTransitionProps {
  children: ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  const { isTransitioning } = usePageTransition()
  const [showContent, setShowContent] = useState(true)
  const [showLoader, setShowLoader] = useState(false)

  useEffect(() => {
    if (isTransitioning) {
      // Start transition: fade out content
      setShowContent(false)
      
      // Show loader after content fades out
      setTimeout(() => {
        setShowLoader(true)
      }, 200)
    } else {
      // End transition: hide loader and show content
      setShowLoader(false)
      setTimeout(() => {
        setShowContent(true)
      }, 100)
    }
  }, [isTransitioning])

  return (
    <>
      <div 
        className={`${styles.contentWrapper} ${!showContent ? styles.fadeOut : styles.fadeIn}`}
      >
        {children}
      </div>
      <PageLoader isVisible={showLoader} />
    </>
  )
}