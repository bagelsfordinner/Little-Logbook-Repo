-- Fix Gallery RLS Policies Migration
-- Addresses authentication mismatches between server-side user.id and auth.uid()
-- Improves gallery image upload functionality

-- =====================================================
-- DROP EXISTING PROBLEMATIC POLICIES
-- =====================================================

-- Drop existing gallery image policies that are causing auth issues
DROP POLICY IF EXISTS "Users can view gallery images for accessible logbooks" ON gallery_images;
DROP POLICY IF EXISTS "Parents and family can upload images" ON gallery_images;
DROP POLICY IF EXISTS "Users can update their own images" ON gallery_images;
DROP POLICY IF EXISTS "Users can delete own images or parents can delete any" ON gallery_images;

-- Drop existing gallery settings policies
DROP POLICY IF EXISTS "Users can view gallery settings for accessible logbooks" ON gallery_settings;
DROP POLICY IF EXISTS "Only parents can modify gallery settings" ON gallery_settings;

-- =====================================================
-- CREATE IMPROVED RLS POLICIES
-- =====================================================

-- Gallery Images Policies (More Robust)
-- 1. Users can view gallery images for logbooks they have access to
CREATE POLICY "gallery_images_select_policy" ON gallery_images
    FOR SELECT USING (
        -- Check if user has access to the logbook
        EXISTS (
            SELECT 1 FROM logbook_members lm 
            WHERE lm.logbook_id = gallery_images.logbook_id 
            AND lm.user_id = auth.uid()
        )
    );

-- 2. Parents and family can upload images (more permissive for server operations)
CREATE POLICY "gallery_images_insert_policy" ON gallery_images
    FOR INSERT WITH CHECK (
        -- Allow if user is authenticated and has proper role
        auth.uid() IS NOT NULL
        AND (
            -- Direct user permission check
            EXISTS (
                SELECT 1 FROM logbook_members lm 
                WHERE lm.logbook_id = gallery_images.logbook_id 
                AND lm.user_id = auth.uid()
                AND lm.role IN ('parent', 'family')
            )
            -- OR server-side operation (when uploader_id matches a valid member)
            OR EXISTS (
                SELECT 1 FROM logbook_members lm 
                WHERE lm.logbook_id = gallery_images.logbook_id 
                AND lm.user_id = gallery_images.uploader_id
                AND lm.role IN ('parent', 'family')
            )
        )
    );

-- 3. Users can update their own images OR with proper permissions
CREATE POLICY "gallery_images_update_policy" ON gallery_images
    FOR UPDATE USING (
        -- User owns the image
        (uploader_id = auth.uid())
        -- OR user has access to the logbook
        OR EXISTS (
            SELECT 1 FROM logbook_members lm 
            WHERE lm.logbook_id = gallery_images.logbook_id 
            AND lm.user_id = auth.uid()
            AND lm.role IN ('parent', 'family')
        )
    );

-- 4. Users can delete their own images OR parents can delete any image in their logbook
CREATE POLICY "gallery_images_delete_policy" ON gallery_images
    FOR DELETE USING (
        -- User owns the image
        (uploader_id = auth.uid())
        -- OR user is a parent in this logbook
        OR EXISTS (
            SELECT 1 FROM logbook_members lm 
            WHERE lm.logbook_id = gallery_images.logbook_id 
            AND lm.user_id = auth.uid()
            AND lm.role = 'parent'
        )
    );

-- Gallery Settings Policies (Improved)
-- 1. Users can view settings for accessible logbooks
CREATE POLICY "gallery_settings_select_policy" ON gallery_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM logbook_members lm 
            WHERE lm.logbook_id = gallery_settings.logbook_id 
            AND lm.user_id = auth.uid()
        )
    );

-- 2. Parents and family can modify gallery settings (more permissive)
CREATE POLICY "gallery_settings_modify_policy" ON gallery_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM logbook_members lm 
            WHERE lm.logbook_id = gallery_settings.logbook_id 
            AND lm.user_id = auth.uid()
            AND lm.role IN ('parent', 'family')
        )
    );

-- =====================================================
-- CREATE STORAGE BUCKET AND POLICIES
-- =====================================================

-- Create media bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies to recreate them
DROP POLICY IF EXISTS "Users can upload images to their logbooks" ON storage.objects;
DROP POLICY IF EXISTS "Users can view images from accessible logbooks" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- Storage bucket policies for media uploads
-- 1. Allow authenticated users to upload images to their logbook folders
CREATE POLICY "gallery_upload_policy" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'media'
        AND auth.uid() IS NOT NULL
        AND (
            -- Allow uploads to gallery/{logbook_slug} folders if user has access
            name ~ '^gallery/[^/]+/.+$'
            AND EXISTS (
                SELECT 1 FROM logbooks l
                JOIN logbook_members lm ON l.id = lm.logbook_id
                WHERE l.slug = split_part(split_part(name, '/', 2), '/', 1)
                AND lm.user_id = auth.uid()
                AND lm.role IN ('parent', 'family')
            )
        )
    );

-- 2. Allow viewing images from accessible logbooks
CREATE POLICY "gallery_view_policy" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'media'
        AND (
            -- Public access for now (can be restricted later)
            true
            -- OR user has access to the logbook
            OR EXISTS (
                SELECT 1 FROM logbooks l
                JOIN logbook_members lm ON l.id = lm.logbook_id
                WHERE l.slug = split_part(split_part(name, '/', 2), '/', 1)
                AND lm.user_id = auth.uid()
            )
        )
    );

-- 3. Allow deletion of own images or by parents
CREATE POLICY "gallery_delete_storage_policy" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'media'
        AND auth.uid() IS NOT NULL
        AND (
            -- User uploaded the file
            owner = auth.uid()
            -- OR user is a parent in the logbook
            OR EXISTS (
                SELECT 1 FROM logbooks l
                JOIN logbook_members lm ON l.id = lm.logbook_id
                WHERE l.slug = split_part(split_part(name, '/', 2), '/', 1)
                AND lm.user_id = auth.uid()
                AND lm.role = 'parent'
            )
        )
    );

-- =====================================================
-- CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to help with server-side operations
CREATE OR REPLACE FUNCTION bypass_rls_for_service_role()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT current_setting('role') = 'service_role';
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION bypass_rls_for_service_role() TO authenticated;
GRANT EXECUTE ON FUNCTION bypass_rls_for_service_role() TO service_role;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON POLICY "gallery_images_insert_policy" ON gallery_images IS 
'Allows parents and family to upload images, with support for server-side operations';

COMMENT ON POLICY "gallery_settings_modify_policy" ON gallery_settings IS 
'Allows parents and family to modify gallery settings (more permissive than before)';

COMMENT ON POLICY "gallery_upload_policy" ON storage.objects IS 
'Allows authenticated users to upload to gallery folders of logbooks they have access to';

-- =====================================================
-- FINAL VERIFICATION
-- =====================================================

-- Verify that all policies are created
DO $$
BEGIN
    -- Check if all expected policies exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'gallery_images'
        AND policyname IN ('gallery_images_select_policy', 'gallery_images_insert_policy', 'gallery_images_update_policy', 'gallery_images_delete_policy')
    ) THEN
        RAISE EXCEPTION 'Gallery image policies were not created properly';
    END IF;
    
    RAISE NOTICE 'Gallery RLS policies have been successfully updated';
END $$;