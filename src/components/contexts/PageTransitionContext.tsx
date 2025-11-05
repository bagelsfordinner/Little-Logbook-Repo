'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()

  const startTransition = () => {
    setIsTransitioning(true)
  }

  const endTransition = () => {
    setIsTransitioning(false)
  }

  useEffect(() => {
    const handleRouteChangeStart = () => {
      startTransition()
    }

    const handleRouteChangeComplete = () => {
      // Add a small delay to ensure the page is fully rendered
      setTimeout(() => {
        endTransition()
      }, 150)
    }

    const handleRouteChangeError = () => {
      endTransition()
    }

    // Listen to router events
    const originalPush = router.push
    const originalReplace = router.replace

    router.push = (...args: Parameters<typeof router.push>) => {
      handleRouteChangeStart()
      return originalPush.apply(router, args).then((result) => {
        handleRouteChangeComplete()
        return result
      }).catch((error) => {
        handleRouteChangeError()
        throw error
      })
    }

    router.replace = (...args: Parameters<typeof router.replace>) => {
      handleRouteChangeStart()
      return originalReplace.apply(router, args).then((result) => {
        handleRouteChangeComplete()
        return result
      }).catch((error) => {
        handleRouteChangeError()
        throw error
      })
    }

    // Cleanup
    return () => {
      router.push = originalPush
      router.replace = originalReplace
    }
  }, [router])

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