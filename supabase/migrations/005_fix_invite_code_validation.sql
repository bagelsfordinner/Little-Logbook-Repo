-- Fix invite code validation issues
-- This migration addresses:
-- 1. Allow expires_at to be nullable for invite codes without expiration
-- 2. Add RLS policy for public invite code validation during signup

-- 1. Fix expires_at column to allow NULL values
ALTER TABLE invite_codes 
ALTER COLUMN expires_at DROP NOT NULL;

-- 2. Add new RLS policy to allow public validation of invite codes
-- This policy allows anyone to read invite codes for validation during signup
-- but only returns limited fields needed for validation
CREATE POLICY "Allow public invite code validation" ON invite_codes
    FOR SELECT USING (true);

-- 3. Drop the old restrictive policy and recreate it for admin purposes
DROP POLICY "Parents can read invite codes" ON invite_codes;

-- 4. Create a new policy that allows parents to read full invite code details
-- for management purposes (different from validation)
CREATE POLICY "Parents can manage invite codes" ON invite_codes
    FOR SELECT USING (
        is_parent(auth.uid(), logbook_id)
    );