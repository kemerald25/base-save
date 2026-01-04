-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Savings Plans Table
CREATE TABLE IF NOT EXISTS savings_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address TEXT NOT NULL,
  user_fid INTEGER,
  plan_id BIGINT NOT NULL,
  daily_amount TEXT NOT NULL,
  duration INTEGER NOT NULL, -- 0: ONE_MONTH, 1: THREE_MONTHS, 2: SIX_MONTHS, 3: ONE_YEAR
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  total_target TEXT NOT NULL,
  accumulated_balance TEXT NOT NULL DEFAULT '0',
  principal_deposited TEXT NOT NULL DEFAULT '0',
  yield_earned TEXT NOT NULL DEFAULT '0',
  successful_deductions INTEGER NOT NULL DEFAULT 0,
  missed_deductions INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_address, plan_id)
);

-- Plan Events Table (for tracking transactions and events)
CREATE TABLE IF NOT EXISTS plan_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id BIGINT NOT NULL,
  user_address TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'created', 'deduction', 'withdrawal', 'completed', 'yield_claimed'
  amount TEXT,
  transaction_hash TEXT,
  block_number BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_savings_plans_user_address ON savings_plans(user_address);
CREATE INDEX IF NOT EXISTS idx_savings_plans_plan_id ON savings_plans(plan_id);
CREATE INDEX IF NOT EXISTS idx_savings_plans_user_fid ON savings_plans(user_fid);
CREATE INDEX IF NOT EXISTS idx_plan_events_plan_id ON plan_events(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_events_user_address ON plan_events(user_address);
CREATE INDEX IF NOT EXISTS idx_plan_events_transaction_hash ON plan_events(transaction_hash);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_savings_plans_updated_at
  BEFORE UPDATE ON savings_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE savings_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own plans
CREATE POLICY "Users can view their own plans"
  ON savings_plans
  FOR SELECT
  USING (auth.jwt() ->> 'address' = user_address OR auth.jwt() ->> 'fid' = user_fid::text);

-- Policy: Users can insert their own plans
CREATE POLICY "Users can insert their own plans"
  ON savings_plans
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'address' = user_address OR auth.jwt() ->> 'fid' = user_fid::text);

-- Policy: Users can update their own plans
CREATE POLICY "Users can update their own plans"
  ON savings_plans
  FOR UPDATE
  USING (auth.jwt() ->> 'address' = user_address OR auth.jwt() ->> 'fid' = user_fid::text);

-- Policy: Users can view their own plan events
CREATE POLICY "Users can view their own plan events"
  ON plan_events
  FOR SELECT
  USING (auth.jwt() ->> 'address' = user_address OR auth.jwt() ->> 'fid' = (SELECT user_fid::text FROM savings_plans WHERE plan_id = plan_events.plan_id LIMIT 1));

-- Policy: Users can insert their own plan events
CREATE POLICY "Users can insert their own plan events"
  ON plan_events
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'address' = user_address);

-- Note: In production, you may want to disable RLS and handle authentication at the application level
-- since we're using Quick Auth for authentication, not Supabase Auth

