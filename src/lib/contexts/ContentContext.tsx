'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'

// Content types that can be edited
export type ContentType = 'text' | 'textarea' | 'image' | 'boolean' | 'array' | 'number'

// Content item definition
export interface ContentItem {
  value: unknown
  type: ContentType
  metadata?: {
    placeholder?: string
    required?: boolean
    maxLength?: number
    allowedValues?: unknown[]
  }
}

// Content map using dot notation paths
export type ContentMap = Map<string, ContentItem>

// User role type
export type UserRole = 'parent' | 'family' | 'friend'

// Context interface
interface ContentContextType {
  // Content state
  content: ContentMap
  isEditMode: boolean
  isEditPanelOpen: boolean
  userRole: UserRole
  logbookSlug: string
  pageType: string
  
  // Content management
  getContent: (path: string, fallback?: unknown) => unknown
  updateContent: (path: string, value: unknown) => Promise<void>
  setContent: (path: string, item: ContentItem) => void
  
  // Edit mode management
  toggleEditMode: () => void
  toggleEditPanel: () => void
  setEditMode: (enabled: boolean) => void
  
  // Permissions
  canEdit: (path?: string) => boolean
  canEditAny: () => boolean
  
  // Section management
  isSectionVisible: (path: string) => boolean
  toggleSectionVisibility: (path: string) => Promise<void>
  
  // Content refresh
  refreshContent: () => Promise<void>
}

const ContentContext = createContext<ContentContextType | undefined>(undefined)

interface ContentProviderProps {
  children: ReactNode
  logbookSlug: string
  pageType: string
  userRole: UserRole
  initialContent?: Record<string, unknown>
}

export function ContentProvider({ 
  children, 
  logbookSlug, 
  pageType, 
  userRole,
  initialContent = {}
}: ContentProviderProps) {
  const [content, setContentState] = useState<ContentMap>(new Map())
  const [isEditMode, setIsEditMode] = useState(false)
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false)
  const [, setIsLoading] = useState(false)

  // Initialize content from initial data
  useEffect(() => {
    const contentMap = new Map<string, ContentItem>()
    
    // Convert nested object to flat dot notation
    const flattenContent = (obj: Record<string, unknown>, prefix = '') => {
      for (const key in obj) {
        const path = prefix ? `${prefix}.${key}` : key
        const value = obj[key]
        
        if (value && typeof value === 'object' && !Array.isArray(value) && value.constructor === Object) {
          flattenContent(value, path)
        } else {
          // Determine content type
          let type: ContentType = 'text'
          if (typeof value === 'boolean') type = 'boolean'
          else if (typeof value === 'number') type = 'number'
          else if (Array.isArray(value)) type = 'array'
          else if (typeof value === 'string' && value.startsWith('http')) type = 'image'
          
          contentMap.set(path, { value, type })
        }
      }
    }
    
    flattenContent(initialContent)
    setContentState(contentMap)
  }, [initialContent])

  // Get content with fallback
  const getContent = useCallback((path: string, fallback: unknown = '') => {
    const item = content.get(path)
    return item ? item.value : fallback
  }, [content])

  // Set content item
  const setContent = useCallback((path: string, item: ContentItem) => {
    setContentState(prev => {
      const newMap = new Map(prev)
      newMap.set(path, item)
      return newMap
    })
  }, [])

  // Update content and persist to backend
  const updateContent = useCallback(async (path: string, value: unknown) => {
    setIsLoading(true)
    
    try {
      // Import the action dynamically to avoid SSR issues
      const { updateLogbookContent } = await import('@/app/actions/universal-content')
      
      // Optimistically update local state
      const existingItem = content.get(path)
      const updatedItem: ContentItem = {
        ...existingItem,
        value,
        type: existingItem?.type || 'text'
      }
      
      setContent(path, updatedItem)
      
      // Persist to backend
      const result = await updateLogbookContent(logbookSlug, pageType, path, value)
      
      if (!result.success) {
        // Revert optimistic update on error
        if (existingItem) {
          setContent(path, existingItem)
        } else {
          setContentState(prev => {
            const newMap = new Map(prev)
            newMap.delete(path)
            return newMap
          })
        }
        throw new Error(result.error || 'Failed to update content')
      }
      
    } catch (error) {
      console.error('Failed to update content:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [content, setContent, logbookSlug, pageType])

  // Toggle edit mode
  const toggleEditMode = useCallback(() => {
    setIsEditMode(prev => !prev)
    // Close edit panel when exiting edit mode
    if (isEditMode) {
      setIsEditPanelOpen(false)
    }
  }, [isEditMode])

  // Toggle edit panel
  const toggleEditPanel = useCallback(() => {
    // If not in edit mode, enter edit mode and open panel
    if (!isEditMode) {
      setIsEditMode(true)
      setIsEditPanelOpen(true)
    } else {
      // If in edit mode, toggle panel
      setIsEditPanelOpen(prev => !prev)
    }
  }, [isEditMode])

  // Set edit mode explicitly
  const setEditMode = useCallback((enabled: boolean) => {
    setIsEditMode(enabled)
    if (!enabled) {
      setIsEditPanelOpen(false)
    }
  }, [])

  // Check if user can edit
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const canEdit = useCallback((_path?: string) => {
    return userRole === 'parent'
  }, [userRole])

  // Check if user can edit anything
  const canEditAny = useCallback(() => {
    return userRole === 'parent'
  }, [userRole])

  // Check if section is visible
  const isSectionVisible = useCallback((path: string) => {
    const visibilityPath = `${path}.visible`
    return getContent(visibilityPath, true) // Default to visible
  }, [getContent])

  // Toggle section visibility
  const toggleSectionVisibility = useCallback(async (path: string) => {
    const visibilityPath = `${path}.visible`
    const currentVisibility = isSectionVisible(path)
    await updateContent(visibilityPath, !currentVisibility)
  }, [isSectionVisible, updateContent])

  // Refresh content from backend
  const refreshContent = useCallback(async () => {
    setIsLoading(true)
    try {
      // TODO: Fetch fresh content from backend
      // const freshContent = await getLogbookContent(logbookSlug, pageType)
      // Convert and update content map
    } catch (error) {
      console.error('Failed to refresh content:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const value: ContentContextType = {
    content,
    isEditMode,
    isEditPanelOpen,
    userRole,
    logbookSlug,
    pageType,
    getContent,
    updateContent,
    setContent,
    toggleEditMode,
    toggleEditPanel,
    setEditMode,
    canEdit,
    canEditAny,
    isSectionVisible,
    toggleSectionVisibility,
    refreshContent
  }

  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  )
}

// Hook to use content context
export function useContent(): ContentContextType {
  const context = useContext(ContentContext)
  if (context === undefined) {
    throw new Error('useContent must be used within a ContentProvider')
  }
  return context
}

// Hook to get specific content item
export function useContentItem(path: string, fallback?: unknown) {
  const { getContent } = useContent()
  return getContent(path, fallback)
}

// Hook to update specific content item  
export function useContentUpdate(path: string) {
  const { updateContent } = useContent()
  return useCallback((value: unknown) => updateContent(path, value), [updateContent, path])
}