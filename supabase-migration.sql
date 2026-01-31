-- Migration: Add Portfolios and Watchlists Tables
-- Description: Create tables for user portfolios and watchlists with Row Level Security
-- Date: 2026-01-31

-- ============================================================================
-- PORTFOLIOS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS portfolios (
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
  UNIQUE(user_id, symbol, created_at)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_symbol ON portfolios(symbol);
CREATE INDEX IF NOT EXISTS idx_portfolios_user_symbol ON portfolios(user_id, symbol);

-- Enable Row Level Security
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- RLS Policies for portfolios
CREATE POLICY "Users can view their own portfolios"
  ON portfolios FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own portfolios"
  ON portfolios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolios"
  ON portfolios FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolios"
  ON portfolios FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- WATCHLISTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS watchlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, symbol)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_user_symbol ON watchlists(user_id, symbol);

-- Enable Row Level Security
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for watchlists
CREATE POLICY "Users can view their own watchlists"
  ON watchlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watchlists"
  ON watchlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchlists"
  ON watchlists FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for portfolios
DROP TRIGGER IF EXISTS update_portfolios_updated_at ON portfolios;
CREATE TRIGGER update_portfolios_updated_at
  BEFORE UPDATE ON portfolios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GRANTS (if needed for service role)
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON portfolios TO authenticated;
GRANT SELECT, INSERT, DELETE ON watchlists TO authenticated;
