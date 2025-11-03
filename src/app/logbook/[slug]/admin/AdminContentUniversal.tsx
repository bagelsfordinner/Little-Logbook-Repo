'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/atoms/Button'
import { Badge } from '@/components/atoms/Badge'
import { Input } from '@/components/atoms/Input'
import { createInviteCode, getInviteCodes, deleteInviteCode, type InviteCode } from '@/app/actions/inviteCode'

interface AdminContentUniversalProps {
  logbookId: string
  userRole: 'parent' | 'family' | 'friend'
}

export default function AdminContentUniversal({
  logbookId,
  userRole
}: AdminContentUniversalProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'settings' | 'analytics'>('members')
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([])
  const [isCreatingInvite, setIsCreatingInvite] = useState(false)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)

  const loadInviteCodes = useCallback(async () => {
    const result = await getInviteCodes(logbookId)
    if (result.success && result.inviteCodes) {
      setInviteCodes(result.inviteCodes)
    }
  }, [logbookId])

  // Load invite codes when component mounts
  useEffect(() => {
    if (userRole === 'parent') {
      loadInviteCodes()
    }
  }, [userRole, loadInviteCodes])

  const handleCreateInvite = async (role: 'family' | 'friend') => {
    setIsCreatingInvite(true)
    try {
      const result = await createInviteCode(logbookId, role, 5, 30) // 5 uses, expires in 30 days
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
      <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>Only logbook parents can access admin settings.</p>
      </div>
    )
  }

  const tabs = [
    { id: 'members' as const, label: 'Members', count: 0 },
    { id: 'settings' as const, label: 'Settings', count: 0 },
    { id: 'analytics' as const, label: 'Analytics', count: 0 }
  ]

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1>Admin Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Manage your logbook settings, members, and view analytics.
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: 'var(--spacing-md)', 
        marginBottom: 'var(--spacing-xl)',
        borderBottom: '1px solid var(--border)'
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: 'var(--spacing-md) var(--spacing-lg)',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.id ? '600' : '400',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <Badge variant="default">
                {tab.count}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'members' && (
        <div style={{ 
          padding: 'var(--spacing-xl)', 
          backgroundColor: 'var(--bg-secondary)', 
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)'
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
                      variant="ghost" 
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
                      variant="primary" 
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
      )}

      {activeTab === 'settings' && (
        <div style={{ 
          padding: 'var(--spacing-xl)', 
          backgroundColor: 'var(--bg-secondary)', 
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)'
        }}>
          <h3>Logbook Settings</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
            Configure your logbook preferences and privacy settings.
          </p>
          
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
            <p style={{ color: 'var(--text-secondary)' }}>
              Settings management functionality coming soon...
            </p>
            <Button variant="secondary" disabled style={{ marginTop: 'var(--spacing-md)' }}>
              Edit Settings
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div style={{ 
          padding: 'var(--spacing-xl)', 
          backgroundColor: 'var(--bg-secondary)', 
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)'
        }}>
          <h3>Analytics</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
            View insights about your logbook usage and engagement.
          </p>
          
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
            <p style={{ color: 'var(--text-secondary)' }}>
              Analytics dashboard coming soon...
            </p>
            <Button variant="ghost" disabled style={{ marginTop: 'var(--spacing-md)' }}>
              View Reports
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}