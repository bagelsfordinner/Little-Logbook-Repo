'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react'
import { usePathname } from 'next/navigation'

interface PageTransitionContextType {
  isTransitioning: boolean
  startTransition: () => void
  endTransition: () => void
}

const PageTransitionContext = createContext<PageTransitionContextType | undefined>(undefined)

export function usePageTransition() {
  const context = useContext(PageTransitionContext)
  if (context === undefined) {
    throw new Error('usePageTransition must be used within a PageTransitionProvider')
  }
  return context
}

interface PageTransitionProviderProps {
  children: ReactNode
}

export function PageTransitionProvider({ children }: PageTransitionProviderProps) {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const transitionStartTime = useRef<number>(0)
  const pathname = usePathname()

  const startTransition = () => {
    transitionStartTime.current = Date.now()
    setIsTransitioning(true)
  }

  const endTransition = () => {
    const endTime = Date.now()
    const elapsed = endTime - transitionStartTime.current
    const minDuration = 800 // Force 800ms minimum to prevent flickering
    
    if (elapsed < minDuration) {
      setTimeout(() => setIsTransitioning(false), minDuration - elapsed)
    } else {
      setIsTransitioning(false)
    }
  }

  // Track pathname changes for App Router
  useEffect(() => {
    // Skip transition on initial page load
    if (isInitialLoad) {
      setIsInitialLoad(false)
      return
    }
    
    // Start transition for actual navigation
    startTransition()
    
    // End transition after content loads (with minimum duration enforcement)
    const timer = setTimeout(endTransition, 300) // Short timeout, endTransition handles minimum duration
    
    return () => clearTimeout(timer)
  }, [pathname, isInitialLoad])

  // Global navigation event listener for programmatic navigation
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      
      // Check if it's a navigation link within logbook
      if (link && link.href.includes('/logbook/')) {
        const currentPath = window.location.pathname
        const targetPath = new URL(link.href).pathname
        
        // Only trigger transition if it's a different page
        if (currentPath !== targetPath) {
          startTransition()
        }
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  return (
    <PageTransitionContext.Provider value={{ 
      isTransitioning, 
      startTransition, 
      endTransition 
    }}>
      {children}
    </PageTransitionContext.Provider>
  )
}