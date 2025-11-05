'use client'

import { Icon } from '@/components/atoms/Icon'
import { Button } from '@/components/atoms/Button'
import styles from './page.module.css'

export default function AdminPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <Icon name="shield" size="lg" />
            <h1 className={styles.title}>Admin Dashboard</h1>
          </div>
          <p className={styles.subtitle}>
            Manage system settings, users, and application configuration
          </p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Icon name="users" size="md" />
              <h2 className={styles.cardTitle}>User Management</h2>
            </div>
            <p className={styles.cardDescription}>
              View and manage user accounts, permissions, and access levels
            </p>
            <Button variant="secondary" size="sm">
              <Icon name="arrow-right" size="xs" />
              Manage Users
            </Button>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Icon name="book" size="md" />
              <h2 className={styles.cardTitle}>Logbook Oversight</h2>
            </div>
            <p className={styles.cardDescription}>
              Monitor logbook creation, content moderation, and system health
            </p>
            <Button variant="secondary" size="sm">
              <Icon name="arrow-right" size="xs" />
              View Logbooks
            </Button>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Icon name="settings" size="md" />
              <h2 className={styles.cardTitle}>System Settings</h2>
            </div>
            <p className={styles.cardDescription}>
              Configure application settings, features, and system parameters
            </p>
            <Button variant="secondary" size="sm">
              <Icon name="arrow-right" size="xs" />
              Open Settings
            </Button>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Icon name="bar-chart" size="md" />
              <h2 className={styles.cardTitle}>Analytics</h2>
            </div>
            <p className={styles.cardDescription}>
              View usage statistics, performance metrics, and growth data
            </p>
            <Button variant="secondary" size="sm">
              <Icon name="arrow-right" size="xs" />
              View Analytics
            </Button>
          </div>
        </div>

        <div className={styles.systemStatus}>
          <h3 className={styles.sectionTitle}>System Status</h3>
          <div className={styles.statusGrid}>
            <div className={styles.statusItem}>
              <div className={styles.statusIndicator} data-status="healthy"></div>
              <span className={styles.statusLabel}>Database</span>
              <span className={styles.statusValue}>Healthy</span>
            </div>
            <div className={styles.statusItem}>
              <div className={styles.statusIndicator} data-status="healthy"></div>
              <span className={styles.statusLabel}>Storage</span>
              <span className={styles.statusValue}>Operational</span>
            </div>
            <div className={styles.statusItem}>
              <div className={styles.statusIndicator} data-status="healthy"></div>
              <span className={styles.statusLabel}>Auth</span>
              <span className={styles.statusValue}>Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}