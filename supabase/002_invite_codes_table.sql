-- Invite Codes Table Setup
-- This script ensures the invite_codes table exists with the correct structure
-- and all necessary indexes, constraints, and RLS policies

-- Note: This table may already exist from the initial schema migration.
-- This script will create it if it doesn't exist, or verify the structure if it does.

-- =====================================================
-- INVITE CODES TABLE
-- =====================================================

-- Create the invite_codes table if it doesn't exist
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

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Index on code for fast lookups during invite validation
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);

-- Index on logbook_id for fetching all codes for a logbook
CREATE INDEX IF NOT EXISTS idx_invite_codes_logbook_id ON invite_codes(logbook_id);

-- Index on created_by for user-specific queries
CREATE INDEX IF NOT EXISTS idx_invite_codes_created_by ON invite_codes(created_by);

-- Index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_invite_codes_expires_at ON invite_codes(expires_at);

-- Composite index for active codes (not expired and under usage limit)
CREATE INDEX IF NOT EXISTS idx_invite_codes_active ON invite_codes(code, expires_at, max_uses, uses_count);

-- =====================================================
-- ADDITIONAL CONSTRAINTS
-- =====================================================

-- Add constraints only if they don't already exist
DO $$
BEGIN
    -- Ensure uses_count doesn't exceed max_uses
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE constraint_name = 'chk_invite_codes_uses_within_limit'
    ) THEN
        ALTER TABLE invite_codes 
        ADD CONSTRAINT chk_invite_codes_uses_within_limit 
        CHECK (max_uses IS NULL OR uses_count <= max_uses);
    END IF;

    -- Ensure uses_count is not negative
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE constraint_name = 'chk_invite_codes_uses_positive'
    ) THEN
        ALTER TABLE invite_codes 
        ADD CONSTRAINT chk_invite_codes_uses_positive 
        CHECK (uses_count >= 0);
    END IF;

    -- Ensure max_uses is positive if set
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE constraint_name = 'chk_invite_codes_max_uses_positive'
    ) THEN
        ALTER TABLE invite_codes 
        ADD CONSTRAINT chk_invite_codes_max_uses_positive 
        CHECK (max_uses IS NULL OR max_uses > 0);
    END IF;
END $$;

-- Ensure expires_at is in the future when creating
-- Note: This is handled in the application layer, but we could add a trigger if needed

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on the table
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies only if they don't already exist
DO $$
BEGIN
    -- Policy: Only parents can read invite codes for their logbooks
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'invite_codes' 
        AND policyname = 'Parents can read invite codes'
    ) THEN
        CREATE POLICY "Parents can read invite codes" ON invite_codes
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM logbook_members 
                    WHERE logbook_members.logbook_id = invite_codes.logbook_id 
                    AND logbook_members.user_id = auth.uid() 
                    AND logbook_members.role = 'parent'
                )
            );
    END IF;

    -- Policy: Only parents can create invite codes for their logbooks
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'invite_codes' 
        AND policyname = 'Parents can create invite codes'
    ) THEN
        CREATE POLICY "Parents can create invite codes" ON invite_codes
            FOR INSERT WITH CHECK (
                auth.uid() = created_by AND
                EXISTS (
                    SELECT 1 FROM logbook_members 
                    WHERE logbook_members.logbook_id = invite_codes.logbook_id 
                    AND logbook_members.user_id = auth.uid() 
                    AND logbook_members.role = 'parent'
                )
            );
    END IF;

    -- Policy: Only parents can update invite codes for their logbooks
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'invite_codes' 
        AND policyname = 'Parents can update invite codes'
    ) THEN
        CREATE POLICY "Parents can update invite codes" ON invite_codes
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM logbook_members 
                    WHERE logbook_members.logbook_id = invite_codes.logbook_id 
                    AND logbook_members.user_id = auth.uid() 
                    AND logbook_members.role = 'parent'
                )
            );
    END IF;

    -- Policy: Only parents can delete invite codes for their logbooks
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'invite_codes' 
        AND policyname = 'Parents can delete invite codes'
    ) THEN
        CREATE POLICY "Parents can delete invite codes" ON invite_codes
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM logbook_members 
                    WHERE logbook_members.logbook_id = invite_codes.logbook_id 
                    AND logbook_members.user_id = auth.uid() 
                    AND logbook_members.role = 'parent'
                )
            );
    END IF;
END $$;

-- Special policy: Allow anyone to read invite codes for validation during signup
-- This is needed for the invite validation process in signUpWithInvite()
-- We drop and recreate this policy to ensure it's current
DROP POLICY IF EXISTS "Allow invite code validation" ON invite_codes;
CREATE POLICY "Allow invite code validation" ON invite_codes
    FOR SELECT USING (
        -- Allow reading for validation if:
        -- 1. The code is not expired
        -- 2. The code hasn't reached max uses (if max_uses is set)
        (expires_at > NOW()) AND 
        (max_uses IS NULL OR uses_count < max_uses)
    );

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to generate a random invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    -- Generate an 8-character code
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
    END LOOP;
    
    -- Check if code already exists, regenerate if needed
    WHILE EXISTS (SELECT 1 FROM invite_codes WHERE code = result) LOOP
        result := '';
        FOR i IN 1..8 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
        END LOOP;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired invite codes
CREATE OR REPLACE FUNCTION cleanup_expired_invite_codes()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM invite_codes WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE invite_codes IS 'Stores invite codes that allow users to join logbooks with specific roles';
COMMENT ON COLUMN invite_codes.code IS 'Unique alphanumeric code used for invitations (8 characters)';
COMMENT ON COLUMN invite_codes.logbook_id IS 'The logbook this invite code grants access to';
COMMENT ON COLUMN invite_codes.role IS 'Role that will be assigned to users who join with this code (family or friend)';
COMMENT ON COLUMN invite_codes.max_uses IS 'Maximum number of times this code can be used (NULL = unlimited)';
COMMENT ON COLUMN invite_codes.uses_count IS 'Number of times this code has been used';
COMMENT ON COLUMN invite_codes.expires_at IS 'When this invite code expires and becomes invalid';
COMMENT ON COLUMN invite_codes.created_by IS 'User who created this invite code (must be a parent of the logbook)';

-- =====================================================
-- EXAMPLE USAGE
-- =====================================================

/*
-- Example: Create an invite code for family members (valid for 7 days, max 5 uses)
INSERT INTO invite_codes (code, logbook_id, role, max_uses, expires_at, created_by)
VALUES (
    generate_invite_code(),
    'your-logbook-uuid',
    'family',
    5,
    NOW() + INTERVAL '7 days',
    auth.uid()
);

-- Example: Create an unlimited friend invite (valid for 30 days)
INSERT INTO invite_codes (code, logbook_id, role, max_uses, expires_at, created_by)
VALUES (
    generate_invite_code(),
    'your-logbook-uuid',
    'friend',
    NULL,
    NOW() + INTERVAL '30 days',
    auth.uid()
);

-- Example: Validate an invite code
SELECT 
    ic.id,
    ic.logbook_id,
    ic.role,
    ic.max_uses,
    ic.uses_count,
    ic.expires_at,
    l.name as logbook_name,
    l.slug as logbook_slug
FROM invite_codes ic
JOIN logbooks l ON ic.logbook_id = l.id
WHERE ic.code = 'ABC12345'
AND ic.expires_at > NOW()
AND (ic.max_uses IS NULL OR ic.uses_count < ic.max_uses);

-- Example: Clean up expired codes
SELECT cleanup_expired_invite_codes();
*/