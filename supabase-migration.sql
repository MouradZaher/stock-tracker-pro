-- ============================================================================
-- FIXED SUPABASE MIGRATION SCRIPT FOR PIN AUTH SUPPORT
-- Description: Modified to support PIN-based generic User IDs (TEXT) instead of strict UUIDs
-- ============================================================================

-- 1. CLEANUP (Drop tables to rebuild schema correctly)
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

DROP TABLE IF EXISTS public.portfolios;
DROP TABLE IF EXISTS public.watchlists;
DROP TABLE IF EXISTS public.profiles;

-- 2. CREATE TABLES (Using TEXT for IDs to allow 'user-1', 'admin-1', etc.)
-- ============================================================================

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY, -- Changed from UUID REFERENCES auth.users
  email TEXT,
  role TEXT DEFAULT 'user',
  is_approved BOOLEAN DEFAULT TRUE, -- Default to TRUE for PIN users
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PORTFOLIOS
CREATE TABLE IF NOT EXISTS public.portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- Changed from UUID REFERENCES to TEXT
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  units DECIMAL NOT NULL CHECK (units > 0),
  avg_cost DECIMAL NOT NULL CHECK (avg_cost > 0),
  current_price DECIMAL NOT NULL CHECK (current_price >= 0),
  sector TEXT,
  dividends JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, symbol)
);

-- WATCHLISTS
CREATE TABLE IF NOT EXISTS public.watchlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- Changed from UUID to TEXT
  symbol TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, symbol)
);

-- 3. DISABLE RLS (For PIN Auth compatibility since auth.uid() is not used)
-- ============================================================================
-- Since we are managing auth via client-side PINs, we disable RLS to allow the client
-- to read/write based on the user_id it provides.
-- WARNING: This relies on the client to behave correctly. For strict security, 
-- a backend proxy or real Supabase Auth is recommended in production.

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists DISABLE ROW LEVEL SECURITY;

-- 4. FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function: Update Timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: On Portfolio Update
CREATE TRIGGER update_portfolios_updated_at
  BEFORE UPDATE ON public.portfolios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. INITIAL DATA (Populate PIN Users so Admin Panel sees them)
-- ============================================================================
INSERT INTO public.profiles (id, email, role, is_approved) VALUES 
('admin-1', 'admin@stocktracker.pro', 'admin', true),
('user-1', 'user1@example.com', 'user', true),
('user-2', 'user2@example.com', 'user', true),
('user-3', 'user3@example.com', 'user', true)
ON CONFLICT (id) DO UPDATE SET 
role = EXCLUDED.role,
is_approved = EXCLUDED.is_approved;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
