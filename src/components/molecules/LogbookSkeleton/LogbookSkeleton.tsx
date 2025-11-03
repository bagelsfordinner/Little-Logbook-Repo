'use client'

import { Skeleton } from '@/components/atoms/Skeleton/Skeleton'
import styles from './LogbookSkeleton.module.css'

export default function LogbookSkeleton() {
  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <Skeleton variant="text" width={60} />
          <span className={styles.separator}>/</span>
          <Skeleton variant="text" width={80} />
        </div>
        
        <div className={styles.nav}>
          {[...Array(4)].map((_, index) => (
            <Skeleton key={index} variant="button" width={80} height={36} />
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <div className={styles.hero}>
        <div className={styles.heroBackground}>
          <Skeleton variant="image" width="100%" height={300} />
        </div>
        
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <Skeleton variant="title" width={300} height={48} />
            <Skeleton variant="text" width={400} height={20} />
            <Skeleton variant="text" width={250} height={16} />
          </div>
          
          <div className={styles.heroActions}>
            <Skeleton variant="button" width={120} height={44} />
            <Skeleton variant="button" width={100} height={44} />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        {[...Array(4)].map((_, index) => (
          <div key={index} className={styles.statCard}>
            <Skeleton variant="text" width={60} height={40} />
            <Skeleton variant="text" width={80} height={16} />
          </div>
        ))}
      </div>

      {/* Content Sections */}
      <div className={styles.content}>
        {[...Array(3)].map((_, sectionIndex) => (
          <div key={sectionIndex} className={styles.section}>
            <div className={styles.sectionHeader}>
              <Skeleton variant="title" width={200} height={32} />
              <Skeleton variant="button" width={80} height={32} />
            </div>
            
            <div className={styles.sectionContent}>
              {/* Text content */}
              <div className={styles.textBlock}>
                <Skeleton variant="text" width="100%" height={16} />
                <Skeleton variant="text" width="90%" height={16} />
                <Skeleton variant="text" width="75%" height={16} />
              </div>
              
              {/* Image grid */}
              <div className={styles.imageGrid}>
                {[...Array(3)].map((_, imageIndex) => (
                  <Skeleton key={imageIndex} variant="image" width="100%" height={160} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className={styles.recentActivity}>
        <div className={styles.activityHeader}>
          <Skeleton variant="title" width={180} height={28} />
        </div>
        
        <div className={styles.activityList}>
          {[...Array(5)].map((_, index) => (
            <div key={index} className={styles.activityItem}>
              <Skeleton variant="avatar" width={40} height={40} />
              <div className={styles.activityContent}>
                <Skeleton variant="text" width={200} height={16} />
                <Skeleton variant="text" width={120} height={14} />
              </div>
              <Skeleton variant="text" width={60} height={14} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}