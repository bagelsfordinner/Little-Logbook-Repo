export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Logbook {
  id: string
  slug: string
  name: string
  baby_name: string | null
  due_date: string | null
  birth_date: string | null
  theme: 'forest-light' | 'forest-dark' | 'soft-pastels'
  created_by: string
  created_at: string
  updated_at: string
  page_sections?: Json
}

export interface LogbookMember {
  id: string
  logbook_id: string
  user_id: string
  role: 'parent' | 'family' | 'friend'
  permissions: Json
  last_visited_at: string | null
  created_at: string
}

export interface InviteCode {
  id: string
  code: string
  logbook_id: string
  role: 'family' | 'friend'
  max_uses: number
  uses_count: number
  expires_at: string
  created_by: string
  created_at: string
}

export interface Media {
  id: string
  logbook_id: string
  url: string
  thumbnail_url: string | null
  caption: string | null
  media_type: 'image' | 'video'
  timeline_event_id: string | null
  age_tag: string | null
  uploaded_by: string
  created_at: string
}

export interface TimelineEvent {
  id: string
  logbook_id: string
  title: string
  event_date: string
  description: string | null
  sort_order: number
  created_by: string
  created_at: string
}

export interface HelpItem {
  id: string
  logbook_id: string
  title: string
  type: 'task' | 'counter' | 'registry_link'
  category: string | null
  target_count: number | null
  current_count: number
  completed: boolean
  external_url: string | null
  created_by: string
  created_at: string
}

export interface VaultEntry {
  id: string
  logbook_id: string
  title: string | null
  content: string
  media_urls: string[] | null
  recipient: 'parents' | 'baby' | 'family'
  entry_type: 'letter' | 'photo' | 'recommendation'
  category: string | null
  author_id: string
  created_at: string
}

export interface Comment {
  id: string
  logbook_id: string
  content: string
  media_id: string
  author_id: string
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'> & {
          id: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Profile, 'id' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      logbooks: {
        Row: Logbook
        Insert: Omit<Logbook, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Logbook, 'id' | 'created_at'>> & {
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "logbooks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      logbook_members: {
        Row: LogbookMember
        Insert: Omit<LogbookMember, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<LogbookMember, 'id' | 'created_at'>>
        Relationships: [
          {
            foreignKeyName: "logbook_members_logbook_id_fkey"
            columns: ["logbook_id"]
            isOneToOne: false
            referencedRelation: "logbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logbook_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      invite_codes: {
        Row: InviteCode
        Insert: Omit<InviteCode, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<InviteCode, 'id' | 'created_at'>>
        Relationships: [
          {
            foreignKeyName: "invite_codes_logbook_id_fkey"
            columns: ["logbook_id"]
            isOneToOne: false
            referencedRelation: "logbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      media: {
        Row: Media
        Insert: Omit<Media, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<Media, 'id' | 'created_at'>>
        Relationships: [
          {
            foreignKeyName: "media_logbook_id_fkey"
            columns: ["logbook_id"]
            isOneToOne: false
            referencedRelation: "logbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_timeline_event_id_fkey"
            columns: ["timeline_event_id"]
            isOneToOne: false
            referencedRelation: "timeline_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      timeline_events: {
        Row: TimelineEvent
        Insert: Omit<TimelineEvent, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<TimelineEvent, 'id' | 'created_at'>>
        Relationships: [
          {
            foreignKeyName: "timeline_events_logbook_id_fkey"
            columns: ["logbook_id"]
            isOneToOne: false
            referencedRelation: "logbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      help_items: {
        Row: HelpItem
        Insert: Omit<HelpItem, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<HelpItem, 'id' | 'created_at'>>
        Relationships: [
          {
            foreignKeyName: "help_items_logbook_id_fkey"
            columns: ["logbook_id"]
            isOneToOne: false
            referencedRelation: "logbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      vault_entries: {
        Row: VaultEntry
        Insert: Omit<VaultEntry, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<VaultEntry, 'id' | 'created_at'>>
        Relationships: [
          {
            foreignKeyName: "vault_entries_logbook_id_fkey"
            columns: ["logbook_id"]
            isOneToOne: false
            referencedRelation: "logbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_entries_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      comments: {
        Row: Comment
        Insert: Omit<Comment, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<Comment, 'id' | 'created_at'>>
        Relationships: [
          {
            foreignKeyName: "comments_logbook_id_fkey"
            columns: ["logbook_id"]
            isOneToOne: false
            referencedRelation: "logbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_logbook_member: {
        Args: {
          user_id: string
          logbook_id: string
        }
        Returns: boolean
      }
      get_user_role: {
        Args: {
          user_id: string
          logbook_id: string
        }
        Returns: string
      }
      is_parent: {
        Args: {
          user_id: string
          logbook_id: string
        }
        Returns: boolean
      }
      can_write_to_logbook: {
        Args: {
          user_id: string
          logbook_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}