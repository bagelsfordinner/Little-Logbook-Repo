'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from '../../atoms/Icon'
import { ProgressiveImage } from '../../atoms/ProgressiveImage/ProgressiveImage'
import { getResponsiveSizes, generateBlurPlaceholder, shouldPrioritizeImage } from '../../../lib/utils/imageOptimization'
import styles from './MediaCard.module.css'

export type MediaType = 'image' | 'video'

interface MediaCardProps {
  mediaUrl: string
  caption?: string
  mediaType: MediaType
  onDelete?: () => void
  isOwner: boolean
  className?: string
  onImageClick?: () => void
  onSelect?: () => void
  isSelected?: boolean
  index?: number
}

export default function MediaCard({
  mediaUrl,
  caption,
  mediaType,
  onDelete,
  isOwner,
  className,
  onImageClick,
  onSelect,
  isSelected: externalIsSelected,
  index
}: MediaCardProps) {
  const [showActions, setShowActions] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [internalIsSelected, setInternalIsSelected] = useState(false)
  
  // Use external selection state if provided, otherwise use internal state
  const isSelected = externalIsSelected !== undefined ? externalIsSelected : internalIsSelected

  const handleViewMedia = () => {
    if (onImageClick) {
      onImageClick()
    } else {
      console.log('View media:', mediaUrl)
      // TODO: Open modal for full-size view
    }
  }


  const handleLike = () => {
    setIsLiked(!isLiked)
    console.log('Like toggled:', !isLiked)
  }

  const handleSelect = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation() // Prevent triggering image click
    }
    
    if (onSelect) {
      onSelect()
    } else {
      setInternalIsSelected(!isSelected)
      console.log('Selection toggled:', !isSelected)
    }
  }

  const cardClass = [
    styles.card,
    className
  ].filter(Boolean).join(' ')

  const showDeleteButton = isOwner && onDelete

  // Show tabs based on specific conditions
  const shouldShowDeleteTab = showDeleteButton && showActions // Only on hover
  const shouldShowSelectTab = showActions || isSelected // Show on hover or when selected
  const shouldShowLikeTab = showActions || isLiked // Show on hover or when liked
  const shouldShowAnyTab = shouldShowDeleteTab || shouldShowSelectTab || shouldShowLikeTab

  return (
    <div 
      className={cardClass}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={styles.mediaContainer}>
        {/* Action Tabs Top Right */}
        <AnimatePresence>
          {shouldShowAnyTab && (
            <motion.div
              className={styles.actionTabs}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {shouldShowDeleteTab && (
                <button
                  className={`${styles.actionTab} ${styles.deleteTab}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete?.()
                  }}
                  aria-label="Delete media"
                >
                  <Icon name="trash2" size="sm" />
                </button>
              )}
              {shouldShowSelectTab && (
                <button
                  className={`${styles.actionTab} ${styles.selectTab} ${isSelected ? styles.selected : ''}`}
                  onClick={handleSelect}
                  aria-label={isSelected ? "Deselect media" : "Select media"}
                >
                  <Icon name={isSelected ? "check-square" : "square"} size="sm" />
                </button>
              )}
              {shouldShowLikeTab && (
                <button
                  className={`${styles.actionTab} ${styles.likeTab} ${isLiked ? styles.liked : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleLike()
                  }}
                  aria-label={isLiked ? "Unlike media" : "Like media"}
                >
                  <Icon name="heart" size="sm" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div onClick={handleViewMedia} className={styles.mediaWrapper}>
          <ProgressiveImage
            src={mediaUrl}
            alt={caption || 'Media content'}
            width={400}
            height={300}
            objectFit="cover"
            className={styles.media}
            sizes={getResponsiveSizes('gallery')}
            priority={shouldPrioritizeImage('gallery', index)}
            placeholder="blur"
            blurDataURL={generateBlurPlaceholder(mediaUrl)}
          />
        </div>

        {/* Video indicator */}
        {mediaType === 'video' && (
          <div className={styles.videoIndicator}>
            <Icon name="video" size="sm" color="white" />
          </div>
        )}
      </div>

      {caption && (
        <div className={styles.caption}>
          <p className={styles.captionText}>{caption}</p>
        </div>
      )}
    </div>
  )
}