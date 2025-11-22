'use client'

import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import Link from 'next/link'
import styles from './page.module.css'

export default function Home() {
  return (
    <main className={styles.container}>
      <div className={styles.heroSection}>
        <div className={styles.decorativeElements}>
          <div className={styles.decorativeCircle1}></div>
          <div className={styles.decorativeCircle2}></div>
          <div className={styles.decorativeCircle3}></div>
        </div>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <div className={styles.brandMark}>
              <Icon name="book-open" size="lg" />
            </div>
            <h1 className={styles.title}>Little Logbook</h1>
            <p className={styles.subtitle}>
              Create beautiful family logbooks to document your adventures together. 
              Share memories, photos, and stories with the people you love.
            </p>
            <div className={styles.heroActions}>
              <Button 
                variant="primary" 
                size="lg" 
                onClick={() => window.location.href = '/signup'}
              >
                Start Your Family Story
              </Button>
              <Button 
                variant="secondary" 
                size="lg" 
                onClick={() => window.location.href = '/login'}
              >
                Sign In
              </Button>
            </div>
          </div>
          
          <div className={styles.heroImage}>
            <div className={styles.mockupContainer}>
              <div className={styles.mockup}>
                <div className={styles.mockupHeader}>
                  <div className={styles.mockupDots}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
                <div className={styles.mockupContent}>
                  <div className={styles.mockupCard}>
                    <div className={styles.mockupIcon}>
                      <Icon name="heart" size="sm" />
                    </div>
                    <div className={styles.mockupText}>
                      <div className={styles.mockupTitle}>Family Adventures</div>
                      <div className={styles.mockupSubtitle}>124 memories</div>
                    </div>
                  </div>
                  <div className={styles.mockupCard}>
                    <div className={styles.mockupIcon}>
                      <Icon name="camera" size="sm" />
                    </div>
                    <div className={styles.mockupText}>
                      <div className={styles.mockupTitle}>Summer Vacation</div>
                      <div className={styles.mockupSubtitle}>87 photos</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Everything your family needs</h2>
          <p className={styles.sectionSubtitle}>
            Simple tools to capture, organize, and share your most precious moments
          </p>
        </div>
        
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIconContainer}>
              <Icon name="camera" size="lg" />
            </div>
            <h3 className={styles.featureTitle}>Capture Memories</h3>
            <p className={styles.featureDescription}>
              Upload photos and videos to preserve your family's special moments forever.
            </p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIconContainer}>
              <Icon name="users" size="lg" />
            </div>
            <h3 className={styles.featureTitle}>Share with Family</h3>
            <p className={styles.featureDescription}>
              Invite family members to contribute and view your shared logbook together.
            </p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIconContainer}>
              <Icon name="heart" size="lg" />
            </div>
            <h3 className={styles.featureTitle}>Build Together</h3>
            <p className={styles.featureDescription}>
              Create a beautiful family story that grows with every adventure and milestone.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.pathsSection}>
        <div className={styles.pathsGrid}>
          <div className={styles.pathCard}>
            <div className={styles.pathIcon}>
              <Icon name="plus-circle" size="lg" />
            </div>
            <h3 className={styles.pathTitle}>Create New Logbook</h3>
            <p className={styles.pathDescription}>
              Start your family's journey with a beautiful new logbook
            </p>
            <Button 
              variant="primary" 
              size="md" 
              onClick={() => window.location.href = '/signup'}
            >
              Get Started
            </Button>
          </div>

          <div className={styles.pathCard}>
            <div className={styles.pathIcon}>
              <Icon name="mail" size="lg" />
            </div>
            <h3 className={styles.pathTitle}>Join Existing Logbook</h3>
            <p className={styles.pathDescription}>
              Have an invite? Join a family's logbook to share memories
            </p>
            <Button 
              variant="secondary" 
              size="md" 
              onClick={() => window.location.href = '/join'}
            >
              Join with Invite
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Ready to start documenting?</h2>
          <p className={styles.ctaDescription}>
            Join thousands of families already preserving their precious memories together.
          </p>
          <div className={styles.ctaActions}>
            <Button 
              variant="primary" 
              size="lg" 
              onClick={() => window.location.href = '/signup'}
            >
              Create Your Logbook
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}