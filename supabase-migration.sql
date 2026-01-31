-- ============================================================================
-- FIXED SUPABASE MIGRATION SCRIPT
-- Description: Corrected order of operations to avoid "relation does not exist" errors
-- ============================================================================

-- 1. CLEANUP FUNCTIONS (Safe to drop first)
-- ============================================================================
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- 2. CREATE TABLES (Ensure they exist before modifying triggers/policies)
-- ============================================================================

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'user',
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PORTFOLIOS
CREATE TABLE IF NOT EXISTS public.portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, symbol)
);

-- 3. CLEANUP TRIGGERS & POLICIES (Now safe because tables exist)
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_portfolios_updated_at ON public.portfolios;

-- 4. ENABLE RLS & RE-CREATE POLICIES
-- ============================================================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update profiles" ON public.profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Portfolios
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Users can insert their own portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Users can update their own portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Users can delete their own portfolios" ON public.portfolios;

CREATE POLICY "Users can view their own portfolios" ON public.portfolios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own portfolios" ON public.portfolios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own portfolios" ON public.portfolios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own portfolios" ON public.portfolios FOR DELETE USING (auth.uid() = user_id);

-- Watchlists
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own watchlists" ON public.watchlists;
DROP POLICY IF EXISTS "Users can insert their own watchlists" ON public.watchlists;
DROP POLICY IF EXISTS "Users can delete their own watchlists" ON public.watchlists;

CREATE POLICY "Users can view their own watchlists" ON public.watchlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own watchlists" ON public.watchlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own watchlists" ON public.watchlists FOR DELETE USING (auth.uid() = user_id);

-- 5. RE-CREATE FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function: Handle New User
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, is_approved)
  VALUES (new.id, new.email, 'user', false)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: On Auth User Created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

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

-- 6. ADMIN SETUP
-- ============================================================================
UPDATE public.profiles 
SET role = 'admin', is_approved = true 
WHERE email = 'bitdegenbiz@gmail.com';

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
