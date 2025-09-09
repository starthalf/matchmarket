/*
  # Create users table for user profiles

  1. New Tables
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `name` (text, user display name)
      - `gender` (text, 남성 or 여성)
      - `age_group` (text, 20대, 30대, 40대, 50대+)
      - `ntrp` (real, NTRP rating)
      - `experience` (integer, months of experience)
      - `play_style` (text, 공격형, 수비형, 올라운드)
      - `career_type` (text, 동호인, 대학선수, 실업선수)
      - `certification_ntrp` (text, none, pending, verified)
      - `certification_career` (text, none, pending, verified)
      - `certification_youtube` (text, none, pending, verified)
      - `certification_instagram` (text, none, pending, verified)
      - `profile_image` (text, optional profile image URL)
      - `view_count` (integer, profile view count)
      - `like_count` (integer, profile like count)
      - `avg_rating` (real, average rating from reviews)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `users` table
    - Add policy for users to read all profiles
    - Add policy for users to update their own profile
    - Add policy for authenticated users to insert their profile

  3. Functions
    - Add trigger to automatically update `updated_at` timestamp
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  gender text NOT NULL CHECK (gender IN ('남성', '여성')),
  age_group text NOT NULL CHECK (age_group IN ('20대', '30대', '40대', '50대+')),
  ntrp real NOT NULL CHECK (ntrp >= 1.0 AND ntrp <= 7.0),
  experience integer NOT NULL CHECK (experience >= 0),
  play_style text NOT NULL CHECK (play_style IN ('공격형', '수비형', '올라운드')),
  career_type text NOT NULL CHECK (career_type IN ('동호인', '대학선수', '실업선수')),
  certification_ntrp text NOT NULL DEFAULT 'none' CHECK (certification_ntrp IN ('none', 'pending', 'verified')),
  certification_career text NOT NULL DEFAULT 'none' CHECK (certification_career IN ('none', 'pending', 'verified')),
  certification_youtube text NOT NULL DEFAULT 'none' CHECK (certification_youtube IN ('none', 'pending', 'verified')),
  certification_instagram text NOT NULL DEFAULT 'none' CHECK (certification_instagram IN ('none', 'pending', 'verified')),
  profile_image text,
  view_count integer NOT NULL DEFAULT 0,
  like_count integer NOT NULL DEFAULT 0,
  avg_rating real NOT NULL DEFAULT 0 CHECK (avg_rating >= 0 AND avg_rating <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read user profiles"
  ON users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Authenticated users can insert their profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);
CREATE INDEX IF NOT EXISTS idx_users_gender ON users(gender);
CREATE INDEX IF NOT EXISTS idx_users_ntrp ON users(ntrp);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);