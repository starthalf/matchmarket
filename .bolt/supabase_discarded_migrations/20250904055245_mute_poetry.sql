/*
  # Create app_settings table

  1. New Tables
    - `app_settings`
      - `id` (uuid, primary key) - 설정 고유 식별자
      - `key` (text, unique) - 설정 키
      - `value` (text) - 설정 값
      - `updated_at` (timestamptz) - 마지막 업데이트 시간

  2. Security
    - Enable RLS on `app_settings` table
    - Add policy for public read access
    - Add policy for service role to manage settings

  3. Indexes
    - Add index for key lookups
*/

-- Create app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for app_settings table
CREATE POLICY "Anyone can read app settings"
  ON app_settings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can manage app settings"
  ON app_settings
  FOR ALL
  TO service_role
  USING (true);

-- Create index for key lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings (key);