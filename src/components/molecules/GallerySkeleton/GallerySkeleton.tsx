'use client'

import { Skeleton } from '@/components/atoms/Skeleton/Skeleton'
import styles from './GallerySkeleton.module.css'

export default function GallerySkeleton() {
  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <Skeleton variant="text" width={60} />
          <span className={styles.separator}>/</span>
          <Skeleton variant="text" width={80} />
        </div>
        
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <Skeleton variant="title" width={200} height={32} />
            <Skeleton variant="text" width={150} height={20} />
          </div>
          
          <div className={styles.headerActions}>
            <Skeleton variant="button" width={100} height={40} />
            <Skeleton variant="button" width={120} height={40} />
          </div>
        </div>
      </div>

      {/* Gallery Controls */}
      <div className={styles.controls}>
        <div className={styles.searchSection}>
          <Skeleton variant="button" width={300} height={44} />
        </div>
        
        <div className={styles.viewControls}>
          <Skeleton variant="button" width={80} height={36} />
          <Skeleton variant="button" width={80} height={36} />
        </div>
      </div>

      {/* Gallery Grid */}
      <div className={styles.gallery}>
        <div className={styles.grid}>
          {[...Array(12)].map((_, index) => (
            <div key={index} className={styles.imageCard}>
              <Skeleton variant="image" width="100%" height={240} />
              <div className={styles.imageInfo}>
                <Skeleton variant="text" width="80%" height={16} />
                <Skeleton variant="text" width="60%" height={14} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className={styles.pagination}>
        <Skeleton variant="button" width={80} height={36} />
        <div className={styles.pageNumbers}>
          {[...Array(5)].map((_, index) => (
            <Skeleton key={index} variant="button" width={36} height={36} />
          ))}
        </div>
        <Skeleton variant="button" width={80} height={36} />
      </div>
    </div>
  )
}