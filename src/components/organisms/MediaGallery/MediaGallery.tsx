'use client'

import { useState, useMemo } from 'react'
import { MediaCard, MediaType } from '../../molecules/MediaCard'
import { SearchBar } from '../../molecules/SearchBar'
import { EmptyState } from '../../molecules/EmptyState'
import { Button } from '../../atoms/Button'
import { Select } from '../../atoms/Select'
import { Loader } from '../../atoms/Loader'
import styles from './MediaGallery.module.css'

interface MediaItem {
  id: string
  mediaUrl: string
  caption?: string
  mediaType: MediaType
  isOwner: boolean
  createdAt: string
}

interface MediaGalleryProps {
  media: MediaItem[]
  onDelete?: (id: string) => void
  userRole: 'parent' | 'family' | 'friend'
  onUpload?: () => void
  isLoading?: boolean
  className?: string
}

const mediaTypeOptions = [
  { value: 'all', label: 'All Media' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Videos' }
]

export default function MediaGallery({
  media,
  onDelete,
  userRole,
  onUpload,
  isLoading = false,
  className
}: MediaGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')

  const canEdit = userRole === 'parent'

  // Filter media based on search and type
  const filteredMedia = useMemo(() => {
    let filtered = media

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(item =>
        item.caption?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by media type
    if (selectedType !== 'all') {
      filtered = filtered.filter(item => item.mediaType === selectedType)
    }

    // Sort by creation date (newest first)
    return filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [media, searchQuery, selectedType])

  const handleDelete = (id: string) => {
    onDelete?.(id)
  }

  const handleUpload = () => {
    onUpload?.()
  }

  const handleClearSearch = () => {
    setSearchQuery('')
  }

  const galleryClass = [
    styles.gallery,
    className
  ].filter(Boolean).join(' ')

  if (isLoading) {
    return (
      <div className={galleryClass}>
        <div className={styles.loadingContainer}>
          <Loader size="lg" text="Loading your photos..." />
        </div>
      </div>
    )
  }

  return (
    <div className={galleryClass}>
      {/* Header with filters and upload */}
      <div className={styles.header}>
        <div className={styles.filters}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search photos and videos..."
            onClear={handleClearSearch}
            className={styles.searchBar}
          />
          
          <Select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            options={mediaTypeOptions}
            size="md"
            className={styles.typeFilter}
          />
        </div>

        {onUpload && (
          <Button
            variant="primary"
            onClick={handleUpload}
            className={styles.uploadButton}
          >
            + Upload
          </Button>
        )}
      </div>

      {/* Results info */}
      {(searchQuery || selectedType !== 'all') && (
        <div className={styles.resultsInfo}>
          <span className={styles.resultsCount}>
            {filteredMedia.length} {filteredMedia.length === 1 ? 'item' : 'items'} found
          </span>
          {(searchQuery || selectedType !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setSelectedType('all')
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

      {/* Media Grid */}
      {filteredMedia.length > 0 ? (
        <div className={styles.grid}>
          {filteredMedia.map((item) => (
            <MediaCard
              key={item.id}
              mediaUrl={item.mediaUrl}
              caption={item.caption}
              mediaType={item.mediaType}
              isOwner={item.isOwner}
              onDelete={canEdit && item.isOwner ? () => handleDelete(item.id) : undefined}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={searchQuery ? "🔍" : "📷"}
          title={searchQuery ? "No results found" : "No photos yet"}
          description={
            searchQuery 
              ? `No photos or videos match "${searchQuery}". Try a different search term.`
              : "Start capturing memories by uploading your first photo or video."
          }
          actionLabel={searchQuery ? undefined : "Upload Photo"}
          onAction={searchQuery ? undefined : handleUpload}
        />
      )}

      {/* Floating Action Button for Mobile */}
      {onUpload && (
        <Button
          variant="primary"
          onClick={handleUpload}
          className={styles.fab}
          aria-label="Upload photo"
        >
          +
        </Button>
      )}
    </div>
  )
}

export type { MediaItem }