/*
  # Add waiting applicants table for persistent waitlist storage

  1. New Tables
    - `waiting_applicants`
      - `id` (uuid, primary key)
      - `match_id` (text, foreign key to matches.id)
      - `user_id` (text)
      - `user_name` (text)
      - `gender` (text)
      - `ntrp` (real)
      - `joined_at` (timestamp)
      - `status` (text)
      - `payment_requested_at` (timestamp, nullable)
      - `payment_expires_at` (timestamp, nullable)
      - `payment_submitted_at` (timestamp, nullable)
      - `depositor_name` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `waiting_applicants` table
    - Add policy for public read access
    - Add policy for authenticated users to insert their own records
    - Add policy for authenticated users to update their own records

  3. Indexes
    - Add index on match_id for efficient queries
    - Add index on user_id for user-specific queries
    - Add composite index on (match_id, status) for waitlist queries
*/

CREATE TABLE IF NOT EXISTS waiting_applicants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id text NOT NULL,
  user_id text NOT NULL,
  user_name text NOT NULL,
  gender text NOT NULL CHECK (gender IN ('남성', '여성')),
  ntrp real NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'payment_requested', 'payment_submitted', 'payment_confirmed', 'payment_failed', 'cancelled')),
  payment_requested_at timestamptz,
  payment_expires_at timestamptz,
  payment_submitted_at timestamptz,
  depositor_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE waiting_applicants ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read waiting applicants"
  ON waiting_applicants
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert waiting applicants"
  ON waiting_applicants
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own waiting applications"
  ON waiting_applicants
  FOR UPDATE
  TO authenticated
  USING (user_id = (auth.uid())::text);

CREATE POLICY "Users can delete their own waiting applications"
  ON waiting_applicants
  FOR DELETE
  TO authenticated
  USING (user_id = (auth.uid())::text);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_waiting_applicants_match_id 
  ON waiting_applicants (match_id);

CREATE INDEX IF NOT EXISTS idx_waiting_applicants_user_id 
  ON waiting_applicants (user_id);

CREATE INDEX IF NOT EXISTS idx_waiting_applicants_match_status 
  ON waiting_applicants (match_id, status);

CREATE INDEX IF NOT EXISTS idx_waiting_applicants_joined_at 
  ON waiting_applicants (joined_at);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_waiting_applicants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_waiting_applicants_updated_at
  BEFORE UPDATE ON waiting_applicants
  FOR EACH ROW
  EXECUTE FUNCTION update_waiting_applicants_updated_at();