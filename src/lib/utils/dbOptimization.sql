-- Database optimization indexes for Little Logbook
-- Run these in your Supabase SQL editor for improved query performance

-- Index for gallery images sorted by creation date (most common query)
CREATE INDEX IF NOT EXISTS idx_gallery_images_logbook_created 
ON gallery_images(logbook_id, created_at DESC);

-- Index for logbook members with last visited tracking
CREATE INDEX IF NOT EXISTS idx_logbook_members_user_visited 
ON logbook_members(user_id, last_visited_at DESC);

-- Index for timeline events by logbook and date
CREATE INDEX IF NOT EXISTS idx_timeline_events_logbook_date 
ON timeline_events(logbook_id, event_date DESC);

-- Index for vault entries by logbook and type
CREATE INDEX IF NOT EXISTS idx_vault_entries_logbook_type 
ON vault_entries(logbook_id, entry_type, created_at DESC);

-- Index for help items by logbook and completion status
CREATE INDEX IF NOT EXISTS idx_help_items_logbook_completed 
ON help_items(logbook_id, completed, created_at DESC);

-- Index for comments by media and creation date
CREATE INDEX IF NOT EXISTS idx_comments_media_created 
ON comments(media_id, created_at DESC);

-- Index for invite codes by logbook and expiration
CREATE INDEX IF NOT EXISTS idx_invite_codes_logbook_expires 
ON invite_codes(logbook_id, expires_at DESC) 
WHERE expires_at > NOW();

-- Composite index for media with timeline events
CREATE INDEX IF NOT EXISTS idx_media_timeline_logbook 
ON media(logbook_id, timeline_event_id, created_at DESC);

-- Index for gallery settings (ensure quick theme loading)
CREATE INDEX IF NOT EXISTS idx_gallery_settings_logbook 
ON gallery_settings(logbook_id);

-- Performance analysis queries to run periodically:

-- Check index usage
-- SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes ORDER BY idx_tup_read DESC;

-- Check slow queries
-- SELECT query, mean_time, calls FROM pg_stat_statements 
-- WHERE mean_time > 100 ORDER BY mean_time DESC LIMIT 10;

-- Table sizes for monitoring growth
-- SELECT 
--   schemaname,
--   tablename,
--   pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
--   pg_total_relation_size(schemaname||'.'||tablename) as bytes
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- ORDER BY bytes DESC;