'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/atoms/Button'
import { Badge } from '@/components/atoms/Badge'
import { Input } from '@/components/atoms/Input'
import { Icon } from '@/components/atoms/Icon'
import { Header } from '@/components/organisms/Header'
import { ContentProvider } from '@/lib/contexts/ContentContext'
import { createInviteCode, getInviteCodes, deleteInviteCode, type InviteCode } from '@/app/actions/inviteCode'
import styles from '../page.module.css'

interface AdminContentUniversalProps {
  logbook: {
    id: string
    slug: string
    name: string
  }
  userRole: 'parent' | 'family' | 'friend'
  currentUser?: {
    id: string
    email?: string
    display_name: string
  } | null
}

export default function AdminContentUniversal({
  logbook,
  userRole,
  currentUser
}: AdminContentUniversalProps) {
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([])
  const [isCreatingInvite, setIsCreatingInvite] = useState(false)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)

  const loadInviteCodes = useCallback(async () => {
    const result = await getInviteCodes(logbook.id)
    if (result.success && result.inviteCodes) {
      setInviteCodes(result.inviteCodes)
    }
  }, [logbook.id])

  // Load invite codes when component mounts
  useEffect(() => {
    if (userRole === 'parent') {
      loadInviteCodes()
    }
  }, [userRole, loadInviteCodes])

  const handleCreateInvite = async (role: 'family' | 'friend') => {
    setIsCreatingInvite(true)
    try {
      const result = await createInviteCode(logbook.id, role, 5, 30) // 5 uses, expires in 30 days
      if (result.success) {
        await loadInviteCodes() // Refresh the list
      } else {
        alert(result.error || 'Failed to create invite code')
      }
    } catch {
      alert('Failed to create invite code')
    } finally {
      setIsCreatingInvite(false)
    }
  }

  const handleDeleteInvite = async (inviteId: string) => {
    if (!confirm('Are you sure you want to delete this invite code?')) return

    const result = await deleteInviteCode(inviteId)
    if (result.success) {
      await loadInviteCodes() // Refresh the list
    } else {
      alert(result.error || 'Failed to delete invite code')
    }
  }

  const copyToClipboard = async (text: string, type: 'code' | 'url') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(type === 'code' ? 'Code copied!' : 'URL copied!')
      setTimeout(() => setCopySuccess(null), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopySuccess(type === 'code' ? 'Code copied!' : 'URL copied!')
      setTimeout(() => setCopySuccess(null), 2000)
    }
  }

  const generateInviteUrl = (code: string) => {
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    return `${baseUrl}/join/${code}`
  }

  // Only parents can access admin content
  if (userRole !== 'parent') {
    return (
      <ContentProvider
        logbookSlug={logbook.slug}
        pageType="admin"
        userRole={userRole}
      >
        <div className={styles.container}>
          <Header
            logbookName={logbook.name}
            logbookSlug={logbook.slug}
            logbookId={logbook.id}
            userName={currentUser?.display_name || 'User'}
            userRole={userRole}
            currentPath="admin"
          />
          <div className={styles.content}>
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <h2>Access Denied</h2>
              <p>Only logbook parents can access admin settings.</p>
            </div>
          </div>
        </div>
      </ContentProvider>
    )
  }

  return (
    <ContentProvider
      logbookSlug={logbook.slug}
      pageType="admin"
      userRole={userRole}
    >
      <div className={styles.container}>
        <Header
          logbookName={logbook.name}
          logbookSlug={logbook.slug}
          logbookId={logbook.id}
          userName="Current User"
          userRole={userRole}
          currentPath="admin"
        />
        <div className={styles.content}>
          <div style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '2rem' }}>
              <h1>Admin Dashboard</h1>
              <p style={{ color: 'var(--text-secondary)' }}>
                Manage your logbook members and invite codes.
              </p>
            </div>

            {/* Invite Codes Section */}
            <div style={{ 
              padding: '2rem', 
              backgroundColor: 'var(--bg-secondary)', 
              borderRadius: '12px',
              border: '1px solid var(--border)',
              marginBottom: '2rem'
            }}>
          <h3>Invite Family & Friends</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
            Create invite codes to share your logbook with family and friends.
          </p>

          {/* Create Invite Buttons */}
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
            <Button 
              variant="primary" 
              onClick={() => handleCreateInvite('family')}
              disabled={isCreatingInvite}
            >
              {isCreatingInvite ? 'Creating...' : 'Create Family Invite'}
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => handleCreateInvite('friend')}
              disabled={isCreatingInvite}
            >
              {isCreatingInvite ? 'Creating...' : 'Create Friend Invite'}
            </Button>
          </div>

          {/* Copy Success Message */}
          {copySuccess && (
            <div style={{ 
              padding: 'var(--spacing-sm)', 
              backgroundColor: 'var(--success)', 
              color: 'white', 
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--spacing-md)',
              textAlign: 'center'
            }}>
              {copySuccess}
            </div>
          )}

          {/* Invite Codes List */}
          {inviteCodes.length > 0 ? (
            <div>
              <h4 style={{ marginBottom: 'var(--spacing-md)' }}>Active Invite Codes</h4>
              {inviteCodes.map((invite) => (
                <div key={invite.id} style={{
                  padding: 'var(--spacing-lg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 'var(--spacing-md)',
                  backgroundColor: 'var(--bg-primary)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-md)' }}>
                    <div>
                      <Badge variant={invite.role === 'family' ? 'family' : 'friend'}>
                        {invite.role === 'family' ? 'Family' : 'Friend'}
                      </Badge>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 'var(--spacing-xs) 0' }}>
                        Created {new Date(invite.created_at).toLocaleDateString()}
                      </p>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Uses: {invite.uses_count}/{invite.max_uses}
                        {invite.expires_at && ` • Expires: ${new Date(invite.expires_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteInvite(invite.id)}
                      style={{ color: 'var(--error)' }}
                    >
                      <Icon name="trash" size="xs" />
                      Delete
                    </Button>
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
                    <Input 
                      value={invite.code} 
                      readOnly 
                      style={{ flex: 1, fontFamily: 'monospace' }}
                    />
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => copyToClipboard(invite.code, 'code')}
                    >
                      Copy Code
                    </Button>
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                    <Input 
                      value={generateInviteUrl(invite.code)} 
                      readOnly 
                      style={{ flex: 1, fontSize: '0.9rem' }}
                    />
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => copyToClipboard(generateInviteUrl(invite.code), 'url')}
                    >
                      Copy URL
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
              <p style={{ color: 'var(--text-secondary)' }}>
                No invite codes created yet. Create one above to invite family and friends!
              </p>
            </div>
          )}
            </div>

            {/* User Management Section */}
            <div style={{ 
              padding: '2rem', 
              backgroundColor: 'var(--bg-secondary)', 
              borderRadius: '12px',
              border: '1px solid var(--border)'
            }}>
              <h3>Current Members</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Manage existing logbook members and their roles.
              </p>
              
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p style={{ color: 'var(--text-secondary)' }}>
                  User management functionality coming soon...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ContentProvider>
  )
}