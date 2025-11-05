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
    console.log('PageTransition: isTransitioning changed to', isTransitioning)
    console.log('PageTransition: showContent', showContent, 'showLoader', showLoader)
    
    if (isTransitioning) {
      console.log('PageTransition: Starting transition - fading out content')
      // Start transition: fade out content
      setShowContent(false)
      
      // Show loader after content fades out
      setTimeout(() => {
        console.log('PageTransition: Showing loader')
        setShowLoader(true)
      }, 200)
    } else {
      console.log('PageTransition: Ending transition - hiding loader')
      // End transition: hide loader and show content
      setShowLoader(false)
      setTimeout(() => {
        console.log('PageTransition: Showing content')
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