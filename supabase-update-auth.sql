-- ============================================================================
-- UPDATED SUPABASE MIGRATION - USERNAME + PIN AUTH
-- Description: Adds username and pin_hash columns for user registration
-- Run this in your Supabase SQL Editor to enable username-based auth
-- ============================================================================

-- 1. ADD NEW COLUMNS TO PROFILES (if not exists)
-- ============================================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pin_hash TEXT;

-- 2. UPDATE EXISTING PROFILES WITH USERNAMES
-- ============================================================================
UPDATE public.profiles SET username = 'admin', pin_hash = '1927' WHERE id = 'admin-1';
UPDATE public.profiles SET username = 'user1', pin_hash = '7777' WHERE id = 'user-1';
UPDATE public.profiles SET username = 'user2', pin_hash = '7778' WHERE id = 'user-2';
UPDATE public.profiles SET username = 'user3', pin_hash = '7779' WHERE id = 'user-3';

-- 3. CREATE INDEX FOR FAST USERNAME LOOKUP
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- 4. GRANT PERMISSIONS
-- ============================================================================
GRANT ALL ON public.profiles TO anon, authenticated;
