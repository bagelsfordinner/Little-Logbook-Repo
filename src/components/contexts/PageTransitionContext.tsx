'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
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
  const pathname = usePathname()

  const startTransition = () => {
    console.log('Starting page transition')
    setIsTransitioning(true)
  }

  const endTransition = () => {
    console.log('Ending page transition')
    setIsTransitioning(false)
  }

  // Track pathname changes for App Router
  useEffect(() => {
    console.log('Pathname changed to:', pathname, 'isInitialLoad:', isInitialLoad)
    
    // Skip transition on initial page load
    if (isInitialLoad) {
      setIsInitialLoad(false)
      return
    }
    
    // Start transition for actual navigation
    setIsTransitioning(true)
    console.log('Started transition due to pathname change')
    
    // End transition after content loads
    const timer = setTimeout(() => {
      setIsTransitioning(false)
      console.log('Ended transition after timeout')
    }, 1000) // Increased timeout to make it more visible
    
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
          console.log('Navigation detected from', currentPath, 'to', targetPath)
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