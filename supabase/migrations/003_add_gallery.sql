-- Gallery System Migration
-- Adds tables for gallery images with proper RLS and indexes

-- =====================================================
-- GALLERY TABLES
-- =====================================================

-- 1. Gallery Images table
CREATE TABLE IF NOT EXISTS gallery_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    logbook_id UUID NOT NULL REFERENCES logbooks(id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    uploader_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    original_filename TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Gallery Settings table (per logbook)
CREATE TABLE IF NOT EXISTS gallery_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    logbook_id UUID NOT NULL REFERENCES logbooks(id) ON DELETE CASCADE UNIQUE,
    show_dates BOOLEAN DEFAULT FALSE,
    show_captions BOOLEAN DEFAULT FALSE,
    show_uploaders BOOLEAN DEFAULT FALSE,
    display_mode TEXT DEFAULT 'simple' CHECK (display_mode IN ('simple', 'enhanced')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Gallery images indexes
CREATE INDEX IF NOT EXISTS idx_gallery_images_logbook_id ON gallery_images(logbook_id);
CREATE INDEX IF NOT EXISTS idx_gallery_images_uploader_id ON gallery_images(uploader_id);
CREATE INDEX IF NOT EXISTS idx_gallery_images_upload_date ON gallery_images(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_images_logbook_upload_date ON gallery_images(logbook_id, upload_date DESC);

-- Gallery settings indexes
CREATE INDEX IF NOT EXISTS idx_gallery_settings_logbook_id ON gallery_settings(logbook_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on both tables
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_settings ENABLE ROW LEVEL SECURITY;

-- Gallery Images RLS Policies
-- 1. Users can view gallery images for logbooks they have access to
CREATE POLICY "Users can view gallery images for accessible logbooks" ON gallery_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM logbook_members lm 
            WHERE lm.logbook_id = gallery_images.logbook_id 
            AND lm.user_id = auth.uid()
        )
    );

-- 2. Parents and family can upload images
CREATE POLICY "Parents and family can upload images" ON gallery_images
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM logbook_members lm 
            WHERE lm.logbook_id = gallery_images.logbook_id 
            AND lm.user_id = auth.uid()
            AND lm.role IN ('parent', 'family')
        )
        AND uploader_id = auth.uid()
    );

-- 3. Users can update their own images
CREATE POLICY "Users can update their own images" ON gallery_images
    FOR UPDATE USING (
        uploader_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM logbook_members lm 
            WHERE lm.logbook_id = gallery_images.logbook_id 
            AND lm.user_id = auth.uid()
        )
    );

-- 4. Users can delete their own images OR parents can delete any image
CREATE POLICY "Users can delete own images or parents can delete any" ON gallery_images
    FOR DELETE USING (
        uploader_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM logbook_members lm 
            WHERE lm.logbook_id = gallery_images.logbook_id 
            AND lm.user_id = auth.uid()
            AND lm.role = 'parent'
        )
    );

-- Gallery Settings RLS Policies
-- 1. Users can view settings for accessible logbooks
CREATE POLICY "Users can view gallery settings for accessible logbooks" ON gallery_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM logbook_members lm 
            WHERE lm.logbook_id = gallery_settings.logbook_id 
            AND lm.user_id = auth.uid()
        )
    );

-- 2. Only parents can modify gallery settings
CREATE POLICY "Only parents can modify gallery settings" ON gallery_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM logbook_members lm 
            WHERE lm.logbook_id = gallery_settings.logbook_id 
            AND lm.user_id = auth.uid()
            AND lm.role = 'parent'
        )
    );

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_gallery_images_updated_at BEFORE UPDATE ON gallery_images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gallery_settings_updated_at BEFORE UPDATE ON gallery_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DEFAULT GALLERY SETTINGS
-- =====================================================

-- Function to create default gallery settings for new logbooks
CREATE OR REPLACE FUNCTION create_default_gallery_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO gallery_settings (logbook_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create default settings when a logbook is created
CREATE TRIGGER create_default_gallery_settings_trigger
    AFTER INSERT ON logbooks
    FOR EACH ROW EXECUTE FUNCTION create_default_gallery_settings();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE gallery_images IS 'Stores uploaded images for each logbook gallery';
COMMENT ON TABLE gallery_settings IS 'Per-logbook settings for gallery display preferences';

COMMENT ON COLUMN gallery_images.file_url IS 'Public URL to the uploaded image file';
COMMENT ON COLUMN gallery_images.thumbnail_url IS 'Optional URL to compressed thumbnail version';
COMMENT ON COLUMN gallery_images.uploader_name IS 'Display name of uploader (cached for performance)';
COMMENT ON COLUMN gallery_images.file_size IS 'File size in bytes';
COMMENT ON COLUMN gallery_images.mime_type IS 'MIME type of the uploaded file';

COMMENT ON COLUMN gallery_settings.display_mode IS 'simple = images only, enhanced = with metadata';
COMMENT ON COLUMN gallery_settings.show_dates IS 'Whether to display upload dates';
COMMENT ON COLUMN gallery_settings.show_captions IS 'Whether to display image captions';
COMMENT ON COLUMN gallery_settings.show_uploaders IS 'Whether to display uploader names';