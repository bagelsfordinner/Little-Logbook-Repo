'use client'

import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import Link from 'next/link'
import styles from './page.module.css'

export default function Home() {
  return (
    <main className={styles.container}>
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>Little Logbook</h1>
          <p className={styles.subtitle}>
            Create beautiful family logbooks to document your adventures together. 
            Share memories, photos, and stories with the people you love.
          </p>
          
          <div className={styles.authPaths}>
            <div className={styles.authPath}>
              <div className={styles.pathIcon}>
                <Icon name="plus-circle" size="lg" />
              </div>
              <h3 className={styles.pathTitle}>Create New Logbook</h3>
              <p className={styles.pathDescription}>
                Start your family&apos;s journey with a beautiful new logbook
              </p>
              <Button 
                variant="primary" 
                size="lg" 
                onClick={() => window.location.href = '/signup'}
              >
                Get Started
              </Button>
            </div>

            <div className={styles.authPath}>
              <div className={styles.pathIcon}>
                <Icon name="users" size="lg" />
              </div>
              <h3 className={styles.pathTitle}>Join Existing Logbook</h3>
              <p className={styles.pathDescription}>
                Have an invite? Join a family&apos;s logbook to share memories
              </p>
              <Button 
                variant="secondary" 
                size="lg" 
                onClick={() => window.location.href = '/join'}
              >
                Join with Invite
              </Button>
            </div>

            <div className={styles.authPath}>
              <div className={styles.pathIcon}>
                <Icon name="user" size="lg" />
              </div>
              <h3 className={styles.pathTitle}>Already Have Account</h3>
              <p className={styles.pathDescription}>
                Sign in to access your existing logbooks
              </p>
              <Button 
                variant="ghost" 
                size="lg" 
                onClick={() => window.location.href = '/login'}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.featuresGrid}>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <Icon name="camera" size="lg" />
          </div>
          <h3 className={styles.featureTitle}>Capture Memories</h3>
          <p className={styles.featureDescription}>
            Upload photos and videos to preserve your family&apos;s special moments forever.
          </p>
        </div>
        
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <Icon name="users" size="lg" />
          </div>
          <h3 className={styles.featureTitle}>Share with Family</h3>
          <p className={styles.featureDescription}>
            Invite family members to contribute and view your shared logbook together.
          </p>
        </div>
        
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <Icon name="heart" size="lg" />
          </div>
          <h3 className={styles.featureTitle}>Build Together</h3>
          <p className={styles.featureDescription}>
            Create a beautiful family story that grows with every adventure and milestone.
          </p>
        </div>
      </div>

      <div className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <h2 className={styles.ctaTitle}>Questions about Little Logbook?</h2>
          <p className={styles.ctaDescription}>
            Join thousands of families already documenting their adventures together.
          </p>
          <div className={styles.ctaButtons}>
            <div className={styles.helpLinks}>
              <Link href="/demo" className={styles.link}>
                <Icon name="external-link" size="sm" />
                View Demo
              </Link>
              <Link href="/faq" className={styles.link}>
                <Icon name="help-circle" size="sm" />
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}