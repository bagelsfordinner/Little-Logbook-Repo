/**
 * Dynamic import utilities for code splitting and performance optimization
 */

import dynamic from 'next/dynamic'
import { ComponentType } from 'react'
import { Loader } from '../../components/atoms/Loader/Loader'
import { Skeleton } from '../../components/atoms/Skeleton/Skeleton'

/**
 * Loading component for modals and dialogs
 */
function ModalLoadingFallback() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        padding: 'var(--spacing-2xl)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        minWidth: '300px',
        textAlign: 'center'
      }}>
        <Loader variant="logbook" size="md" text="Loading..." />
      </div>
    </div>
  )
}

/**
 * Loading component for page sections
 */
function SectionLoadingFallback() {
  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <Skeleton variant="title" width="40%" />
      <div style={{ height: 'var(--spacing-md)' }} />
      <Skeleton variant="text" width="80%" />
      <div style={{ height: 'var(--spacing-sm)' }} />
      <Skeleton variant="text" width="60%" />
    </div>
  )
}

/**
 * Loading component for editors and forms
 */
function EditorLoadingFallback() {
  return (
    <div style={{ padding: 'var(--spacing-lg)' }}>
      <Skeleton variant="title" width="30%" />
      <div style={{ height: 'var(--spacing-lg)' }} />
      <Skeleton variant="card" width="100%" />
      <div style={{ height: 'var(--spacing-md)' }} />
      <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
        <Skeleton variant="button" width="100px" />
        <Skeleton variant="button" width="80px" />
      </div>
    </div>
  )
}

/**
 * Create a dynamically imported component with optimized loading
 */
export function createDynamicComponent<T = Record<string, unknown>>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options: {
    fallback?: ComponentType
    ssr?: boolean
    loadingType?: 'modal' | 'section' | 'editor' | 'minimal'
  } = {}
) {
  const { fallback, ssr = false, loadingType = 'minimal' } = options
  
  let LoadingComponent = fallback
  
  if (!LoadingComponent) {
    switch (loadingType) {
      case 'modal':
        LoadingComponent = ModalLoadingFallback
        break
      case 'section':
        LoadingComponent = SectionLoadingFallback
        break
      case 'editor':
        LoadingComponent = EditorLoadingFallback
        break
      default:
        LoadingComponent = function DefaultLoadingComponent() {
          return <Loader variant="pulse" size="md" />
        }
    }
  }

  return dynamic(importFn, {
    loading: LoadingComponent,
    ssr
  })
}

/**
 * Preload a dynamic component
 */
export function preloadComponent(importFn: () => Promise<{ default: React.ComponentType<unknown> }>) {
  if (typeof window !== 'undefined') {
    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      (window as { requestIdleCallback?: (callback: () => void) => void }).requestIdleCallback?.(() => {
        importFn().catch(() => {
          // Ignore preload errors
        })
      })
    } else {
      setTimeout(() => {
        importFn().catch(() => {
          // Ignore preload errors
        })
      }, 100)
    }
  }
}

/**
 * Create a component that loads on user interaction
 */
export function createInteractionComponent<T = Record<string, unknown>>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  triggerComponent: ComponentType<{ onClick: () => void }>,
  options: {
    loadingType?: 'modal' | 'section' | 'editor' | 'minimal'
    preload?: boolean
  } = {}
) {
  const { loadingType = 'modal', preload = true } = options
  
  const DynamicComponent = createDynamicComponent(importFn, { loadingType, ssr: false })
  
  return function InteractionWrapper(props: T) {
    const [isOpen, setIsOpen] = useState(false)
    
    // Preload on hover or focus
    const handlePreload = () => {
      if (preload) {
        preloadComponent(importFn)
      }
    }
    
    return (
      <>
        <triggerComponent 
          onClick={() => setIsOpen(true)}
          onMouseEnter={handlePreload}
          onFocus={handlePreload}
        />
        {isOpen && (
          <DynamicComponent 
            {...props} 
            onClose={() => setIsOpen(false)}
          />
        )}
      </>
    )
  }
}

// Pre-configured dynamic imports for common heavy components

/**
 * Heavy modal components
 */
export const DynamicImageUploadModal = createDynamicComponent(
  () => import('../../components/universal/ImageUploadModal/ImageUploadModal'),
  { loadingType: 'modal' }
)

export const DynamicPageSettingsModal = createDynamicComponent(
  () => import('../../components/organisms/PageSettingsModal/PageSettingsModal'),
  { loadingType: 'modal' }
)

export const DynamicHeroEditModal = createDynamicComponent(
  () => import('../../components/organisms/HeroEditModal/HeroEditModal'),
  { loadingType: 'modal' }
)

export const DynamicConfirmDialog = createDynamicComponent(
  () => import('../../components/organisms/ConfirmDialog/ConfirmDialog'),
  { loadingType: 'modal' }
)

export const DynamicDeleteConfirmModal = createDynamicComponent(
  () => import('../../app/logbook/[slug]/gallery/components/DeleteConfirmModal'),
  { loadingType: 'modal' }
)

/**
 * Heavy editor components
 */
export const DynamicSectionEditor = createDynamicComponent(
  () => import('../../components/molecules/SectionEditor/SectionEditor'),
  { loadingType: 'editor' }
)

/**
 * Admin and specialized components
 */
export const DynamicAdminContent = createDynamicComponent(
  () => import('../../app/logbook/[slug]/admin/AdminContentUniversal'),
  { loadingType: 'section', ssr: false }
)

// Import useState for the interaction wrapper
import { useState } from 'react'