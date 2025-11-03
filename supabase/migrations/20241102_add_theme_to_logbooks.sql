-- Add theme field to logbooks table
-- This allows each logbook to have its own theme setting controlled by the admin

ALTER TABLE logbooks 
ADD COLUMN theme text DEFAULT 'forest-light' CHECK (theme IN ('forest-light', 'forest-dark', 'soft-pastels'));

-- Update existing logbooks to have the default theme
UPDATE logbooks SET theme = 'forest-light' WHERE theme IS NULL;

-- Create index for performance if needed
CREATE INDEX IF NOT EXISTS idx_logbooks_theme ON logbooks(theme);

-- Comment explaining the field
COMMENT ON COLUMN logbooks.theme IS 'Theme setting for the logbook, controlled by parents and applies to all members';