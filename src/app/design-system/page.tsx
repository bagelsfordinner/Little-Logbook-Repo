'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Label } from '@/components/atoms/Label'
import { Badge } from '@/components/atoms/Badge'
import { Avatar } from '@/components/atoms/Avatar'
import { Loader } from '@/components/atoms/Loader'
import { TextArea } from '@/components/atoms/TextArea'
import { Select } from '@/components/atoms/Select'
import { FormField } from '@/components/molecules/FormField'
import { MediaCard } from '@/components/molecules/MediaCard'
import { CommentForm } from '@/components/molecules/CommentForm'
import { CounterWidget } from '@/components/molecules/CounterWidget'
import { SearchBar } from '@/components/molecules/SearchBar'
import { EmptyState } from '@/components/molecules/EmptyState'
import { InfoCard } from '@/components/molecules/InfoCard'
import { Header } from '@/components/organisms/Header'
import { MediaGallery } from '@/components/organisms/MediaGallery'
import { ConfirmDialog } from '@/components/organisms/ConfirmDialog'
import { Icon } from '@/components/atoms/Icon'
import { mockUsers, mockLogbooks, mockMediaItems } from '@/lib/utils/mockData'
import styles from './page.module.css'

export default function DesignSystemPage() {
  const [counter, setCounter] = useState(5)
  const [searchValue, setSearchValue] = useState('')
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [textAreaValue, setTextAreaValue] = useState('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmDialogVariant, setConfirmDialogVariant] = useState<'danger' | 'warning'>('danger')
  const [galleryMedia, setGalleryMedia] = useState(mockMediaItems)
  const [isGalleryLoading] = useState(false)

  const mockUser = mockUsers[0]
  const mockLogbook = mockLogbooks[0]

  const handleComment = async (comment: string) => {
    console.log('Comment submitted:', comment)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  const handleConfirmAction = () => {
    console.log('Action confirmed!')
    setShowConfirmDialog(false)
  }

  const handleMediaDelete = (id: string) => {
    setGalleryMedia(prev => prev.filter(item => item.id !== id))
  }

  const handleMediaUpload = () => {
    console.log('Upload media clicked')
  }

  const selectOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' }
  ]

  return (
    <>
      <Header 
        logbookId="mock-logbook-id"
        logbookName={mockLogbook.name}
        logbookSlug={mockLogbook.slug}
        userName={mockUser.name}
        userAvatar={mockUser.avatar}
        userRole={mockUser.role}
      />
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Little Logbook Design System</h1>
          <p className={styles.subtitle}>TEMPORARY - FOR DEVELOPMENT</p>
          <Link href="/" className={styles.backLink}>← Back to Home</Link>
        </header>

        {/* Table of Contents */}
        <nav className={styles.tableOfContents}>
          <h3 className={styles.tocTitle}>Quick Navigation</h3>
          <div className={styles.tocGrid}>
            <a href="#themes" className={styles.tocLink}>Themes</a>
            <a href="#colors" className={styles.tocLink}>Colors</a>
            <a href="#typography" className={styles.tocLink}>Typography</a>
            <a href="#buttons" className={styles.tocLink}>Buttons</a>
            <a href="#forms" className={styles.tocLink}>Form Elements</a>
            <a href="#badges" className={styles.tocLink}>Badges & Avatars</a>
            <a href="#loaders" className={styles.tocLink}>Loaders</a>
            <a href="#molecules" className={styles.tocLink}>Molecules</a>
            <a href="#search" className={styles.tocLink}>Search & Empty States</a>
            <a href="#organisms" className={styles.tocLink}>Organisms</a>
            <a href="#spacing" className={styles.tocLink}>Spacing & Layout</a>
          </div>
        </nav>

      {/* Theme Switcher */}
      <section id="themes" className={styles.section}>
        <h2 className={styles.sectionTitle}>Themes</h2>
        <p className={styles.sectionDescription}>
          Switch between different color themes using the dropdown below.
        </p>
        
        <h3 className={styles.subsectionTitle}>Theme Switcher Component</h3>
        <div style={{ maxWidth: '200px', marginBottom: 'var(--spacing-md)' }}>
          <ThemeSwitcher />
        </div>

        <div style={{ 
          padding: 'var(--spacing-md)', 
          backgroundColor: 'var(--bg-secondary)', 
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--spacing-md)',
          color: 'var(--text-primary)'
        }}>
          🎨 Theme Test: This box should change colors when you switch themes. 
          Current bg: var(--bg-secondary), text: var(--text-primary)
        </div>
      </section>

      {/* Colors */}
      <section id="colors" className={styles.section}>
        <h2 className={styles.sectionTitle}>Colors</h2>
        <div className={styles.colorGrid}>
          <div className={styles.colorCard}>
            <div className={styles.colorSwatch} style={{ backgroundColor: 'var(--accent-primary)' }} />
            <span>Primary Accent</span>
          </div>
          <div className={styles.colorCard}>
            <div className={styles.colorSwatch} style={{ backgroundColor: 'var(--accent-secondary)' }} />
            <span>Secondary Accent</span>
          </div>
          <div className={styles.colorCard}>
            <div className={styles.colorSwatch} style={{ backgroundColor: 'var(--accent-tertiary)' }} />
            <span>Tertiary Accent</span>
          </div>
          <div className={styles.colorCard}>
            <div className={styles.colorSwatch} style={{ backgroundColor: 'var(--success)' }} />
            <span>Success</span>
          </div>
          <div className={styles.colorCard}>
            <div className={styles.colorSwatch} style={{ backgroundColor: 'var(--error)' }} />
            <span>Error</span>
          </div>
          <div className={styles.colorCard}>
            <div className={styles.colorSwatch} style={{ backgroundColor: 'var(--warning)' }} />
            <span>Warning</span>
          </div>
        </div>
      </section>

      {/* Typography */}
      <section id="typography" className={styles.section}>
        <h2 className={styles.sectionTitle}>Typography</h2>
        <div className={styles.typographyGrid}>
          <h1>Heading 1</h1>
          <h2>Heading 2</h2>
          <h3>Heading 3</h3>
          <h4>Heading 4</h4>
          <h5>Heading 5</h5>
          <h6>Heading 6</h6>
          <p>Body text - Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
          <small>Small text - Additional information</small>
        </div>
      </section>

      {/* Buttons */}
      <section id="buttons" className={styles.section}>
        <h2 className={styles.sectionTitle}>Buttons</h2>
        
        <h3 className={styles.subsectionTitle}>Variants</h3>
        <div className={styles.buttonGrid}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
        </div>

        <h3 className={styles.subsectionTitle}>Sizes</h3>
        <div className={styles.buttonGrid}>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>

        <h3 className={styles.subsectionTitle}>States</h3>
        <div className={styles.buttonGrid}>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button fullWidth>Full Width</Button>
        </div>
      </section>

      {/* Form Elements */}
      <section id="forms" className={styles.section}>
        <h2 className={styles.sectionTitle}>Form Elements</h2>
        
        <div className={styles.formGrid}>
          <div className={styles.formColumn}>
            <h3 className={styles.subsectionTitle}>Inputs</h3>
            <Input placeholder="Normal input" />
            <Input placeholder="With error" error="This field is required" />
            <Input placeholder="Disabled" disabled />
          </div>

          <div className={styles.formColumn}>
            <h3 className={styles.subsectionTitle}>Labels & Form Fields</h3>
            <Label required>Required Label</Label>
            <FormField 
              label="Email" 
              type="email" 
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
            <FormField 
              label="Password" 
              type="password" 
              placeholder="Enter password"
              error="Password must be at least 8 characters"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            />
          </div>
        </div>

        <h3 className={styles.subsectionTitle}>Text Area</h3>
        <TextArea 
          placeholder="Write your thoughts..."
          value={textAreaValue}
          onChange={(e) => setTextAreaValue(e.target.value)}
          maxLength={200}
          showCharCount
        />

        <h3 className={styles.subsectionTitle}>Password Input with Toggle</h3>
        <div style={{ maxWidth: '300px' }}>
          <Input 
            type="password" 
            placeholder="Enter your password"
            defaultValue="secretpassword123"
          />
        </div>
      </section>

      {/* Badges & Avatars */}
      <section id="badges" className={styles.section}>
        <h2 className={styles.sectionTitle}>Badges & Avatars</h2>
        
        <h3 className={styles.subsectionTitle}>Badges</h3>
        <div className={styles.badgeGrid}>
          <Badge variant="parent">Admin</Badge>
          <Badge variant="family">Family</Badge>
          <Badge variant="friend">Friend</Badge>
          <Badge variant="default">Default</Badge>
        </div>

        <h3 className={styles.subsectionTitle}>Avatars</h3>
        <div className={styles.avatarGrid}>
          <Avatar alt="John Doe" fallback="JD" size="sm" />
          <Avatar alt="Jane Smith" fallback="JS" size="md" />
          <Avatar alt="Bob Wilson" fallback="BW" size="lg" />
          <Avatar alt="Alice Brown" fallback="AB" size="xl" />
        </div>
      </section>

      {/* Icons */}
      <section id="icons" className={styles.section}>
        <h2 className={styles.sectionTitle}>Icons</h2>
        <p className={styles.sectionDescription}>40+ Lucide icons with size variants</p>
        
        <h3 className={styles.subsectionTitle}>Common Icons</h3>
        <div className={styles.iconGrid}>
          <div className={styles.iconDemo}>
            <Icon name="heart" size="md" />
            <span>heart</span>
          </div>
          <div className={styles.iconDemo}>
            <Icon name="trash2" size="md" />
            <span>trash2</span>
          </div>
          <div className={styles.iconDemo}>
            <Icon name="eye" size="md" />
            <span>eye</span>
          </div>
          <div className={styles.iconDemo}>
            <Icon name="upload" size="md" />
            <span>upload</span>
          </div>
          <div className={styles.iconDemo}>
            <Icon name="search" size="md" />
            <span>search</span>
          </div>
          <div className={styles.iconDemo}>
            <Icon name="settings" size="md" />
            <span>settings</span>
          </div>
          <div className={styles.iconDemo}>
            <Icon name="user" size="md" />
            <span>user</span>
          </div>
          <div className={styles.iconDemo}>
            <Icon name="camera" size="md" />
            <span>camera</span>
          </div>
          <div className={styles.iconDemo}>
            <Icon name="star" size="md" />
            <span>star</span>
          </div>
          <div className={styles.iconDemo}>
            <Icon name="check-square" size="md" />
            <span>check-square</span>
          </div>
        </div>

        <h3 className={styles.subsectionTitle}>Icon Sizes</h3>
        <div className={styles.iconSizeGrid}>
          <div className={styles.iconDemo}>
            <Icon name="heart" size="sm" />
            <span>Small (16px)</span>
          </div>
          <div className={styles.iconDemo}>
            <Icon name="heart" size="md" />
            <span>Medium (20px)</span>
          </div>
          <div className={styles.iconDemo}>
            <Icon name="heart" size="lg" />
            <span>Large (24px)</span>
          </div>
        </div>
      </section>

      {/* Loaders */}
      <section id="loaders" className={styles.section}>
        <h2 className={styles.sectionTitle}>Loaders</h2>
        <p className={styles.sectionDescription}>Smooth circular loaders with Framer Motion</p>
        <div className={styles.loaderGrid}>
          <Loader size="sm" text="Small" />
          <Loader size="md" text="Medium" />
          <Loader size="lg" text="Large" />
        </div>
      </section>

      {/* Molecules */}
      <section id="molecules" className={styles.section}>
        <h2 className={styles.sectionTitle}>Molecule Components</h2>
        
        <h3 className={styles.subsectionTitle}>Media Cards</h3>
        <div className={styles.mediaGrid}>
          <MediaCard 
            mediaUrl="https://picsum.photos/300/300?random=1"
            caption="Beautiful sunset at the beach"
            mediaType="image"
            isOwner={true}
            onDelete={() => console.log('Delete clicked')}
          />
          <MediaCard 
            mediaUrl="https://picsum.photos/300/300?random=2"
            caption="Family vacation video"
            mediaType="video"
            isOwner={false}
          />
          <MediaCard 
            mediaUrl="https://picsum.photos/300/300?random=3"
            mediaType="image"
            isOwner={true}
            onDelete={() => console.log('Delete clicked')}
          />
        </div>

        <h3 className={styles.subsectionTitle}>Comment Form</h3>
        <CommentForm onSubmit={handleComment} />

        <h3 className={styles.subsectionTitle}>Counter Widgets</h3>
        <div className={styles.counterGrid}>
          <CounterWidget 
            label="Photos Uploaded"
            currentCount={counter}
            targetCount={10}
            canEdit={true}
            onIncrement={() => setCounter(prev => prev + 1)}
            onDecrement={() => setCounter(prev => Math.max(0, prev - 1))}
          />
          <CounterWidget 
            label="Total Views"
            currentCount={156}
            canEdit={false}
            onIncrement={() => {}}
            onDecrement={() => {}}
          />
        </div>

        <h3 className={styles.subsectionTitle}>Info Cards</h3>
        <div className={styles.infoCardGrid}>
          <InfoCard 
            icon="users"
            title="Total Members"
            description="Family members in your logbook"
            variant="accent"
            onClick={() => console.log('Members clicked')}
          />
          <InfoCard 
            icon="camera"
            title="Photos Uploaded"
            description="Beautiful memories captured"
            variant="default"
          />
          <InfoCard 
            icon="heart"
            title="Likes Received"
            description="Love from your family"
            variant="muted"
            onClick={() => console.log('Likes clicked')}
          />
        </div>
      </section>

      {/* Search & Empty States */}
      <section id="search" className={styles.section}>
        <h2 className={styles.sectionTitle}>Search & Empty States</h2>
        
        <h3 className={styles.subsectionTitle}>Search Bar</h3>
        <SearchBar 
          value={searchValue}
          onChange={setSearchValue}
          placeholder="Search media..."
          onClear={() => setSearchValue('')}
        />

        <h3 className={styles.subsectionTitle}>Select Dropdown</h3>
        <div style={{ maxWidth: '200px' }}>
          <Select
            value=""
            onChange={() => {}}
            options={selectOptions}
            placeholder="Choose an option"
          />
        </div>

        <h3 className={styles.subsectionTitle}>Empty State</h3>
        <EmptyState 
          title="No media found"
          description="Try adjusting your search or upload some photos"
          actionLabel="Upload Media"
          onAction={handleMediaUpload}
        />
      </section>

      {/* Organism Components */}
      <section id="organisms" className={styles.section}>
        <h2 className={styles.sectionTitle}>Organism Components</h2>
        
        <h3 className={styles.subsectionTitle}>Header (Fixed in Place)</h3>
        <p className={styles.sectionDescription}>
          The header is currently fixed at the top of the page. It includes navigation, 
          user menu, theme switcher, and responsive mobile hamburger menu.
        </p>

        <h3 className={styles.subsectionTitle}>Media Gallery</h3>
        <MediaGallery 
          media={galleryMedia}
          isLoading={isGalleryLoading}
          onDelete={handleMediaDelete}
          onUpload={handleMediaUpload}
          userRole="parent"
        />

        <h3 className={styles.subsectionTitle}>Confirm Dialog</h3>
        <div className={styles.buttonGrid}>
          <Button 
            variant="danger"
            onClick={() => {
              setConfirmDialogVariant('danger')
              setShowConfirmDialog(true)
            }}
          >
            Show Danger Dialog
          </Button>
          <Button 
            variant="secondary"
            onClick={() => {
              setConfirmDialogVariant('warning')
              setShowConfirmDialog(true)
            }}
          >
            Show Warning Dialog
          </Button>
        </div>
      </section>

      {/* Spacing & Layout */}
      <section id="spacing" className={styles.section}>
        <h2 className={styles.sectionTitle}>Spacing & Layout</h2>
        <div className={styles.spacingGrid}>
          <div className={styles.spacingItem}>
            <div className={styles.spacingBox} style={{ width: 'var(--spacing-xs)' }} />
            <span>XS (4px)</span>
          </div>
          <div className={styles.spacingItem}>
            <div className={styles.spacingBox} style={{ width: 'var(--spacing-sm)' }} />
            <span>SM (8px)</span>
          </div>
          <div className={styles.spacingItem}>
            <div className={styles.spacingBox} style={{ width: 'var(--spacing-md)' }} />
            <span>MD (16px)</span>
          </div>
          <div className={styles.spacingItem}>
            <div className={styles.spacingBox} style={{ width: 'var(--spacing-lg)' }} />
            <span>LG (24px)</span>
          </div>
          <div className={styles.spacingItem}>
            <div className={styles.spacingBox} style={{ width: 'var(--spacing-xl)' }} />
            <span>XL (32px)</span>
          </div>
        </div>
      </section>

      {/* Confirm Dialog */}
      <ConfirmDialog 
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmAction}
        title={confirmDialogVariant === 'danger' ? 'Delete Item' : 'Warning'}
        message={confirmDialogVariant === 'danger' 
          ? 'Are you sure you want to delete this item? This action cannot be undone.'
          : 'This action may have consequences. Are you sure you want to continue?'
        }
        confirmText={confirmDialogVariant === 'danger' ? 'Delete' : 'Continue'}
        variant={confirmDialogVariant}
      />
      </div>
    </>
  )
}