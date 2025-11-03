'use client'

import { motion } from 'framer-motion'
import styles from './Skeleton.module.css'

export type SkeletonVariant = 'text' | 'title' | 'avatar' | 'image' | 'button' | 'card' | 'line'

interface SkeletonProps {
  variant?: SkeletonVariant
  width?: string | number
  height?: string | number
  className?: string
  animated?: boolean
}

export default function Skeleton({ 
  variant = 'text', 
  width, 
  height, 
  className,
  animated = true 
}: SkeletonProps) {
  const skeletonClass = [
    styles.skeleton,
    styles[variant],
    animated && styles.animated,
    className
  ].filter(Boolean).join(' ')

  const style = {
    ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
    ...(height && { height: typeof height === 'number' ? `${height}px` : height }),
  }

  if (animated) {
    return (
      <motion.div
        className={skeletonClass}
        style={style}
        initial={{ opacity: 0.3 }}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    )
  }

  return <div className={skeletonClass} style={style} />
}

export { Skeleton }