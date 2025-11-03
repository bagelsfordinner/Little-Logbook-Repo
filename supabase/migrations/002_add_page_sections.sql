-- Add page_sections column to logbooks table for flexible content management
-- This enables parents to edit content and visibility across all pages

ALTER TABLE logbooks 
ADD COLUMN IF NOT EXISTS page_sections JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN logbooks.page_sections IS 'Flexible storage for all page content and visibility settings. Structure: { "home": { "hero": {...} }, "gallery": {...} }';