'use client'

import { ReactNode } from 'react'
import { usePageTransition } from '@/components/contexts/PageTransitionContext'
import PageLoader from '@/components/atoms/PageLoader/PageLoader'

interface PageTransitionProps {
  children: ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  const { isTransitioning } = usePageTransition()

  return (
    <>
      {children}
      <PageLoader isVisible={isTransitioning} />
    </>
  )
}