-- Little Logbook Initial Schema Migration
-- Multi-tenant database with Row Level Security

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- 1. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Logbooks table
CREATE TABLE IF NOT EXISTS logbooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    baby_name TEXT,
    due_date DATE,
    birth_date DATE,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Logbook members junction table (for multi-tenant access)
CREATE TABLE IF NOT EXISTS logbook_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    logbook_id UUID NOT NULL REFERENCES logbooks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('parent', 'family', 'friend')),
    permissions JSONB DEFAULT '{}',
    last_visited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(logbook_id, user_id)
);

-- 4. Invite codes table
CREATE TABLE IF NOT EXISTS invite_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    logbook_id UUID NOT NULL REFERENCES logbooks(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('family', 'friend')),
    max_uses INTEGER DEFAULT 1,
    uses_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Timeline events table
CREATE TABLE IF NOT EXISTS timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    logbook_id UUID NOT NULL REFERENCES logbooks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    event_date DATE NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Media table
CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    logbook_id UUID NOT NULL REFERENCES logbooks(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    timeline_event_id UUID REFERENCES timeline_events(id) ON DELETE SET NULL,
    age_tag TEXT,
    uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Help items table
CREATE TABLE IF NOT EXISTS help_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    logbook_id UUID NOT NULL REFERENCES logbooks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('task', 'counter', 'registry_link')),
    category TEXT,
    target_count INTEGER,
    current_count INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    external_url TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Vault entries table
CREATE TABLE IF NOT EXISTS vault_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    logbook_id UUID NOT NULL REFERENCES logbooks(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL,
    media_urls TEXT[],
    recipient TEXT NOT NULL CHECK (recipient IN ('parents', 'baby', 'family')),
    entry_type TEXT NOT NULL CHECK (entry_type IN ('letter', 'photo', 'recommendation')),
    category TEXT,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    logbook_id UUID NOT NULL REFERENCES logbooks(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_logbook_members_logbook_id ON logbook_members(logbook_id);
CREATE INDEX IF NOT EXISTS idx_logbook_members_user_id ON logbook_members(user_id);
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_logbook_id ON invite_codes(logbook_id);
CREATE INDEX IF NOT EXISTS idx_media_logbook_id ON media(logbook_id);
CREATE INDEX IF NOT EXISTS idx_media_timeline_event_id ON media(timeline_event_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_logbook_id ON timeline_events(logbook_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_event_date ON timeline_events(event_date);
CREATE INDEX IF NOT EXISTS idx_help_items_logbook_id ON help_items(logbook_id);
CREATE INDEX IF NOT EXISTS idx_vault_entries_logbook_id ON vault_entries(logbook_id);
CREATE INDEX IF NOT EXISTS idx_comments_logbook_id ON comments(logbook_id);
CREATE INDEX IF NOT EXISTS idx_comments_media_id ON comments(media_id);

-- =====================================================
-- HELPER FUNCTIONS FOR RLS
-- =====================================================

-- Check if user is a member of a logbook
CREATE OR REPLACE FUNCTION is_logbook_member(user_id UUID, logbook_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM logbook_members 
        WHERE logbook_members.user_id = is_logbook_member.user_id 
        AND logbook_members.logbook_id = is_logbook_member.logbook_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's role in a logbook
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID, logbook_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role FROM logbook_members 
        WHERE logbook_members.user_id = get_user_role.user_id 
        AND logbook_members.logbook_id = get_user_role.logbook_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is a parent of a logbook
CREATE OR REPLACE FUNCTION is_parent(user_id UUID, logbook_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role(user_id, logbook_id) = 'parent';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can write to logbook (parents and family can write, friends are read-only)
CREATE OR REPLACE FUNCTION can_write_to_logbook(user_id UUID, logbook_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    user_role := get_user_role(user_id, logbook_id);
    RETURN user_role IN ('parent', 'family');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updating timestamps
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_logbooks_updated_at BEFORE UPDATE ON logbooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE logbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE logbook_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Users can read all profiles (for displaying member info)
CREATE POLICY "Users can read all profiles" ON profiles
    FOR SELECT USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- LOGBOOKS POLICIES
-- =====================================================

-- Users can read logbooks they're members of
CREATE POLICY "Users can read logbooks they're members of" ON logbooks
    FOR SELECT USING (
        is_logbook_member(auth.uid(), id)
    );

-- Users can create logbooks (they become the parent automatically)
CREATE POLICY "Users can create logbooks" ON logbooks
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Only parents can update logbooks
CREATE POLICY "Parents can update logbooks" ON logbooks
    FOR UPDATE USING (
        is_parent(auth.uid(), id)
    );

-- Only parents can delete logbooks
CREATE POLICY "Parents can delete logbooks" ON logbooks
    FOR DELETE USING (
        is_parent(auth.uid(), id)
    );

-- =====================================================
-- LOGBOOK_MEMBERS POLICIES
-- =====================================================

-- Users can read members of logbooks they belong to
CREATE POLICY "Users can read logbook members" ON logbook_members
    FOR SELECT USING (
        is_logbook_member(auth.uid(), logbook_id)
    );

-- Parents can add members to their logbooks
CREATE POLICY "Parents can add members" ON logbook_members
    FOR INSERT WITH CHECK (
        is_parent(auth.uid(), logbook_id)
    );

-- Parents can update member roles/permissions
CREATE POLICY "Parents can update members" ON logbook_members
    FOR UPDATE USING (
        is_parent(auth.uid(), logbook_id)
    );

-- Parents can remove members, users can remove themselves
CREATE POLICY "Parents can remove members, users can remove self" ON logbook_members
    FOR DELETE USING (
        is_parent(auth.uid(), logbook_id) OR auth.uid() = user_id
    );

-- =====================================================
-- INVITE_CODES POLICIES
-- =====================================================

-- Only parents can read invite codes for their logbooks
CREATE POLICY "Parents can read invite codes" ON invite_codes
    FOR SELECT USING (
        is_parent(auth.uid(), logbook_id)
    );

-- Only parents can create invite codes
CREATE POLICY "Parents can create invite codes" ON invite_codes
    FOR INSERT WITH CHECK (
        is_parent(auth.uid(), logbook_id) AND auth.uid() = created_by
    );

-- Only parents can update invite codes
CREATE POLICY "Parents can update invite codes" ON invite_codes
    FOR UPDATE USING (
        is_parent(auth.uid(), logbook_id)
    );

-- Only parents can delete invite codes
CREATE POLICY "Parents can delete invite codes" ON invite_codes
    FOR DELETE USING (
        is_parent(auth.uid(), logbook_id)
    );

-- =====================================================
-- MEDIA POLICIES
-- =====================================================

-- Users can read media from logbooks they're members of
CREATE POLICY "Users can read media from their logbooks" ON media
    FOR SELECT USING (
        is_logbook_member(auth.uid(), logbook_id)
    );

-- Parents and family can upload media
CREATE POLICY "Parents and family can upload media" ON media
    FOR INSERT WITH CHECK (
        can_write_to_logbook(auth.uid(), logbook_id) AND auth.uid() = uploaded_by
    );

-- Parents can update any media, others can only update their own
CREATE POLICY "Users can update media" ON media
    FOR UPDATE USING (
        is_parent(auth.uid(), logbook_id) OR 
        (can_write_to_logbook(auth.uid(), logbook_id) AND auth.uid() = uploaded_by)
    );

-- Parents can delete any media, others can only delete their own
CREATE POLICY "Users can delete media" ON media
    FOR DELETE USING (
        is_parent(auth.uid(), logbook_id) OR 
        (can_write_to_logbook(auth.uid(), logbook_id) AND auth.uid() = uploaded_by)
    );

-- =====================================================
-- TIMELINE_EVENTS POLICIES
-- =====================================================

-- Users can read timeline events from logbooks they're members of
CREATE POLICY "Users can read timeline events" ON timeline_events
    FOR SELECT USING (
        is_logbook_member(auth.uid(), logbook_id)
    );

-- Parents and family can create timeline events
CREATE POLICY "Parents and family can create timeline events" ON timeline_events
    FOR INSERT WITH CHECK (
        can_write_to_logbook(auth.uid(), logbook_id) AND auth.uid() = created_by
    );

-- Parents can update any timeline event, others can only update their own
CREATE POLICY "Users can update timeline events" ON timeline_events
    FOR UPDATE USING (
        is_parent(auth.uid(), logbook_id) OR 
        (can_write_to_logbook(auth.uid(), logbook_id) AND auth.uid() = created_by)
    );

-- Parents can delete any timeline event, others can only delete their own
CREATE POLICY "Users can delete timeline events" ON timeline_events
    FOR DELETE USING (
        is_parent(auth.uid(), logbook_id) OR 
        (can_write_to_logbook(auth.uid(), logbook_id) AND auth.uid() = created_by)
    );

-- =====================================================
-- HELP_ITEMS POLICIES
-- =====================================================

-- Users can read help items from logbooks they're members of
CREATE POLICY "Users can read help items" ON help_items
    FOR SELECT USING (
        is_logbook_member(auth.uid(), logbook_id)
    );

-- Parents and family can create help items
CREATE POLICY "Parents and family can create help items" ON help_items
    FOR INSERT WITH CHECK (
        can_write_to_logbook(auth.uid(), logbook_id) AND auth.uid() = created_by
    );

-- Parents can update any help item, others can only update their own
CREATE POLICY "Users can update help items" ON help_items
    FOR UPDATE USING (
        is_parent(auth.uid(), logbook_id) OR 
        (can_write_to_logbook(auth.uid(), logbook_id) AND auth.uid() = created_by)
    );

-- Parents can delete any help item, others can only delete their own
CREATE POLICY "Users can delete help items" ON help_items
    FOR DELETE USING (
        is_parent(auth.uid(), logbook_id) OR 
        (can_write_to_logbook(auth.uid(), logbook_id) AND auth.uid() = created_by)
    );

-- =====================================================
-- VAULT_ENTRIES POLICIES
-- =====================================================

-- Users can read vault entries from logbooks they're members of
CREATE POLICY "Users can read vault entries" ON vault_entries
    FOR SELECT USING (
        is_logbook_member(auth.uid(), logbook_id)
    );

-- Parents and family can create vault entries
CREATE POLICY "Parents and family can create vault entries" ON vault_entries
    FOR INSERT WITH CHECK (
        can_write_to_logbook(auth.uid(), logbook_id) AND auth.uid() = author_id
    );

-- Parents can update any vault entry, others can only update their own
CREATE POLICY "Users can update vault entries" ON vault_entries
    FOR UPDATE USING (
        is_parent(auth.uid(), logbook_id) OR 
        (can_write_to_logbook(auth.uid(), logbook_id) AND auth.uid() = author_id)
    );

-- Parents can delete any vault entry, others can only delete their own
CREATE POLICY "Users can delete vault entries" ON vault_entries
    FOR DELETE USING (
        is_parent(auth.uid(), logbook_id) OR 
        (can_write_to_logbook(auth.uid(), logbook_id) AND auth.uid() = author_id)
    );

-- =====================================================
-- COMMENTS POLICIES
-- =====================================================

-- Users can read comments from logbooks they're members of
CREATE POLICY "Users can read comments" ON comments
    FOR SELECT USING (
        is_logbook_member(auth.uid(), logbook_id)
    );

-- All members can create comments (including friends)
CREATE POLICY "Members can create comments" ON comments
    FOR INSERT WITH CHECK (
        is_logbook_member(auth.uid(), logbook_id) AND auth.uid() = author_id
    );

-- Parents can update any comment, others can only update their own
CREATE POLICY "Users can update comments" ON comments
    FOR UPDATE USING (
        is_parent(auth.uid(), logbook_id) OR auth.uid() = author_id
    );

-- Parents can delete any comment, others can only delete their own
CREATE POLICY "Users can delete comments" ON comments
    FOR DELETE USING (
        is_parent(auth.uid(), logbook_id) OR auth.uid() = author_id
    );