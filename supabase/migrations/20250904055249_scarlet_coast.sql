/*
  # Create waiting_applicants table

  1. New Tables
    - `waiting_applicants`
      - `id` (uuid, primary key) - 대기자 고유 식별자
      - `match_id` (text) - 매치 ID
      - `user_id` (text) - 사용자 ID
      - `user_name` (text) - 사용자 이름
      - `gender` (text) - 성별
      - `ntrp` (real) - NTRP 레이팅
      - `joined_at` (timestamptz) - 대기열 참여 시간
      - `status` (text) - 대기 상태
      - `payment_requested_at` (timestamptz, nullable) - 결제 요청 시간
      - `payment_expires_at` (timestamptz, nullable) - 결제 만료 시간
      - `payment_submitted_at` (timestamptz, nullable) - 결제 제출 시간
      - `depositor_name` (text, nullable) - 입금자명
      - `created_at` (timestamptz) - 생성 시간
      - `updated_at` (timestamptz) - 업데이트 시간

  2. Security
    - Enable RLS on `waiting_applicants` table
    - Add policy for public read access
    - Add policy for authenticated users to insert
    - Add policy for users to manage their own applications

  3. Constraints
    - Gender check constraint
    - Status check constraint

  4. Indexes
    - Add indexes for common query patterns
*/

-- Create waiting_applicants table
CREATE TABLE IF NOT EXISTS waiting_applicants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id text NOT NULL,
  user_id text NOT NULL,
  user_name text NOT NULL,
  gender text NOT NULL,
  ntrp real NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'waiting',
  payment_requested_at timestamptz,
  payment_expires_at timestamptz,
  payment_submitted_at timestamptz,
  depositor_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add check constraints
ALTER TABLE waiting_applicants 
ADD CONSTRAINT waiting_applicants_gender_check 
CHECK (gender IN ('남성', '여성'));

ALTER TABLE waiting_applicants 
ADD CONSTRAINT waiting_applicants_status_check 
CHECK (status IN ('waiting', 'payment_requested', 'payment_submitted', 'payment_confirmed', 'payment_failed', 'cancelled'));

-- Enable Row Level Security
ALTER TABLE waiting_applicants ENABLE ROW LEVEL SECURITY;

-- Create policies for waiting_applicants table
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_waiting_applicants_match_id ON waiting_applicants (match_id);
CREATE INDEX IF NOT EXISTS idx_waiting_applicants_user_id ON waiting_applicants (user_id);
CREATE INDEX IF NOT EXISTS idx_waiting_applicants_joined_at ON waiting_applicants (joined_at);
CREATE INDEX IF NOT EXISTS idx_waiting_applicants_match_status ON waiting_applicants (match_id, status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_waiting_applicants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_waiting_applicants_updated_at
  BEFORE UPDATE ON waiting_applicants
  FOR EACH ROW
  EXECUTE FUNCTION update_waiting_applicants_updated_at();