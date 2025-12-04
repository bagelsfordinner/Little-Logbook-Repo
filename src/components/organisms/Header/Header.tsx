'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '../../atoms/Button'
import { Avatar } from '../../atoms/Avatar'
import { Badge } from '../../atoms/Badge'
import styles from './Header.module.css'

type UserRole = 'parent' | 'family' | 'friend'

interface HeaderProps {
  logbookName: string
  logbookSlug: string
  logbookId?: string // Optional for backwards compatibility
  userName: string
  userAvatar?: string
  userRole: UserRole
  currentPath?: string
  onSignOut?: () => void
  onDashboard?: () => void
}

const getNavLinks = (logbookSlug: string) => [
  { label: 'Home', href: `/logbook/${logbookSlug}`, requiresAuth: false },
  { label: 'Gallery', href: `/logbook/${logbookSlug}/gallery`, requiresAuth: false },
  { label: 'Help', href: `/logbook/${logbookSlug}/help`, requiresAuth: false },
  { label: 'FAQ', href: `/logbook/${logbookSlug}/faq`, requiresAuth: false },
  { label: 'Admin', href: `/logbook/${logbookSlug}/admin`, requiresAuth: true, parentOnly: true },
]

export default function Header({
  logbookName,
  logbookSlug,
  logbookId, // Accept but don't use for now
  userName,
  userAvatar,
  userRole,
  currentPath = '',
  onSignOut = () => {},
  onDashboard = () => {}
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  
  // Debug user profile
  console.log('🔍 Header Debug:', {
    userName,
    userAvatar,
    userRole,
    logbookName,
    logbookSlug
  })
  
  const userMenuRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false)
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const navLinks = getNavLinks(logbookSlug)
  const filteredNavLinks = navLinks.filter(link => {
    if (link.parentOnly && userRole !== 'parent') return false
    return true
  })


  const headerClass = [
    styles.header,
    isScrolled && styles.scrolled
  ].filter(Boolean).join(' ')

  return (
    <header className={headerClass}>
      <div className={styles.container}>
        {/* Logo/Logbook Name */}
        <div className={styles.logo}>
          <h1 className={styles.logbookName}>{logbookName}</h1>
          <span className={styles.logbookSlug}>/{logbookSlug}</span>
        </div>

        {/* Desktop Navigation */}
        <nav className={styles.desktopNav}>
          {filteredNavLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`${styles.navLink} ${currentPath === link.href ? styles.active : ''}`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className={styles.rightActions}>
          {/* User Menu */}
          <div className={styles.userMenu} ref={userMenuRef}>
            <button
              className={styles.userMenuTrigger}
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              aria-expanded={isUserMenuOpen}
              aria-haspopup="true"
            >
              <Avatar
                src={userAvatar}
                alt={userName || 'User'}
                fallback={userName?.charAt(0) || 'U'}
                size="md"
              />
              <span className={styles.userName}>{userName || 'Unknown User'}</span>
              <svg
                className={`${styles.chevron} ${isUserMenuOpen ? styles.chevronUp : ''}`}
                width="12"
                height="8"
                viewBox="0 0 12 8"
                fill="none"
              >
                <path
                  d="M1 1L6 6L11 1"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {isUserMenuOpen && (
              <div className={styles.userMenuDropdown}>
                <div className={styles.userInfo}>
                  <span className={styles.userNameDropdown}>{userName}</span>
                  <Badge variant={userRole}>{userRole === 'parent' ? 'Admin' : userRole}</Badge>
                </div>
                <div className={styles.menuDivider} />
                <button className={styles.menuItem} onClick={onDashboard}>
                  My Dashboard
                </button>
                <button className={styles.menuItem} onClick={onSignOut}>
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={styles.mobileMenuButton}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle menu"
          >
            <div className={`${styles.hamburger} ${isMobileMenuOpen ? styles.hamburgerOpen : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className={styles.mobileMenuOverlay}>
          <div className={styles.mobileMenuContent} ref={mobileMenuRef}>
            <div className={styles.mobileMenuHeader}>
              <h2>Menu</h2>
              <button
                className={styles.closeButton}
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>

            <nav className={styles.mobileNav}>
              {filteredNavLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`${styles.mobileNavLink} ${currentPath === link.href ? styles.active : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className={styles.mobileMenuActions}>
              <div className={styles.mobileUserSection}>
                <div className={styles.mobileUserInfo}>
                  <Avatar
                    src={userAvatar}
                    alt={userName}
                    fallback={userName.charAt(0)}
                    size="lg"
                  />
                  <div>
                    <div className={styles.mobileUserName}>{userName}</div>
                    <Badge variant={userRole}>{userRole === 'parent' ? 'Admin' : userRole}</Badge>
                  </div>
                </div>

                <div className={styles.mobileUserActions}>
                  <Button variant="secondary" fullWidth onClick={onDashboard}>
                    My Dashboard
                  </Button>
                  <Button variant="danger" fullWidth onClick={onSignOut}>
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

// Named export for backwards compatibility
export { Header as Header }