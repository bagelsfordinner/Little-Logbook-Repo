'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageType, PageTypeSections } from '@/lib/constants/pageSections'
import { getLogbookPageSections } from '@/app/actions/content'

/**
 * Result type for the usePageContent hook
 */
export interface UsePageContentResult<T extends PageType> {
  /** The merged page sections (defaults + overrides) */
  sections: PageTypeSections<T> | null
  /** Loading state */
  loading: boolean
  /** Error message if any */
  error: string | null
  /** Function to manually refetch the data */
  refetch: () => void
  /** Function to invalidate and refetch the data */
  invalidate: () => void
}

/**
 * Custom hook for fetching and managing page content sections.
 * Uses React Query for caching and automatic refetching.
 * 
 * @param pageType - The page type to fetch sections for
 * @param logbookSlug - The logbook slug identifier
 * @returns Page sections data with loading/error states and refetch functions
 * 
 * @example
 * function HomePage({ logbookSlug }: { logbookSlug: string }) {
 *   const { sections, loading, error, refetch } = usePageContent('home', logbookSlug)
 *   
 *   if (loading) return <div>Loading...</div>
 *   if (error) return <div>Error: {error}</div>
 *   if (!sections) return <div>No content found</div>
 *   
 *   return (
 *     <div>
 *       {sections.hero.visible && (
 *         <HeroSection data={sections.hero} />
 *       )}
 *     </div>
 *   )
 * }
 */
export function usePageContent<T extends PageType>(
  pageType: T,
  logbookSlug: string
): UsePageContentResult<T> {
  const queryClient = useQueryClient()
  
  const {
    data,
    isLoading,
    error,
    refetch: queryRefetch
  } = useQuery({
    queryKey: ['pageContent', logbookSlug, pageType],
    queryFn: async () => {
      const result = await getLogbookPageSections(logbookSlug, pageType)
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      return result.sections
    },
    enabled: Boolean(logbookSlug && pageType),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on authentication/authorization errors
      if (error.message.includes('Authentication') || error.message.includes('access denied')) {
        return false
      }
      return failureCount < 3
    }
  })

  const refetch = () => {
    queryRefetch()
  }

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: ['pageContent', logbookSlug, pageType]
    })
  }

  return {
    sections: data || null,
    loading: isLoading,
    error: error?.message || null,
    refetch,
    invalidate
  }
}

/**
 * Hook for invalidating page content cache across multiple pages.
 * Useful when making updates that affect multiple pages.
 * 
 * @param logbookSlug - The logbook slug identifier
 * @returns Function to invalidate all page content for the logbook
 * 
 * @example
 * function EditPanel({ logbookSlug }: { logbookSlug: string }) {
 *   const invalidateAllPages = useInvalidatePageContent(logbookSlug)
 *   
 *   const handleGlobalUpdate = async () => {
 *     await updateSomething()
 *     invalidateAllPages() // Refresh all pages
 *   }
 * }
 */
export function useInvalidatePageContent(logbookSlug: string) {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.invalidateQueries({
      queryKey: ['pageContent', logbookSlug]
    })
  }
}

/**
 * Hook for prefetching page content.
 * Useful for preloading content before navigation.
 * 
 * @param pageType - The page type to prefetch
 * @param logbookSlug - The logbook slug identifier
 * @returns Function to trigger prefetch
 * 
 * @example
 * function NavigationCard({ href, logbookSlug }: Props) {
 *   const prefetchPage = usePrefetchPageContent('gallery', logbookSlug)
 *   
 *   return (
 *     <Link 
 *       href={href}
 *       onMouseEnter={() => prefetchPage()}
 *     >
 *       Gallery
 *     </Link>
 *   )
 * }
 */
export function usePrefetchPageContent<T extends PageType>(
  pageType: T,
  logbookSlug: string
) {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.prefetchQuery({
      queryKey: ['pageContent', logbookSlug, pageType],
      queryFn: async () => {
        const result = await getLogbookPageSections(logbookSlug, pageType)
        
        if (result.error) {
          throw new Error(result.error)
        }
        
        return result.sections
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  }
}