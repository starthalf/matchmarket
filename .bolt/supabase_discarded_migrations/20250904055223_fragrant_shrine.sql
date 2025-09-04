/*
  # Create matches table and related structures

  1. New Tables
    - `matches`
      - `id` (text, primary key) - 매치 고유 식별자
      - `seller_id` (text) - 판매자 ID
      - `seller_name` (text) - 판매자 이름
      - `seller_gender` (text) - 판매자 성별
      - `seller_age_group` (text) - 판매자 연령대
      - `seller_ntrp` (real) - 판매자 NTRP 레이팅
      - `seller_experience` (integer) - 판매자 경험 (개월)
      - `seller_play_style` (text) - 판매자 플레이 스타일
      - `seller_career_type` (text) - 판매자 경력 타입
      - `seller_certification_*` (text) - 판매자 인증 정보
      - `seller_profile_image` (text, nullable) - 판매자 프로필 이미지 URL
      - `seller_view_count` (integer) - 판매자 조회수
      - `seller_like_count` (integer) - 판매자 좋아요 수
      - `seller_avg_rating` (real) - 판매자 평균 평점
      - `title` (text) - 매치 제목
      - `date` (text) - 매치 날짜
      - `time` (text) - 매치 시작 시간
      - `end_time` (text) - 매치 종료 시간
      - `court` (text) - 코트 이름
      - `description` (text) - 매치 설명
      - `base_price` (integer) - 기본 가격
      - `initial_price` (integer) - 초기 가격
      - `current_price` (integer) - 현재 가격
      - `max_price` (integer) - 최대 가격
      - `expected_views` (integer) - 예상 조회수
      - `expected_waiting_applicants` (integer) - 예상 대기자 수
      - `expected_participants_*` (integer) - 예상 참가자 수 (성별별)
      - `current_applicants_*` (integer) - 현재 신청자 수 (성별별)
      - `match_type` (text) - 매치 타입 (단식/복식)
      - `waiting_applicants` (integer) - 대기자 수
      - `ad_enabled` (boolean) - 광고 활성화 여부
      - `ntrp_min` (real) - 최소 NTRP 요구사항
      - `ntrp_max` (real) - 최대 NTRP 요구사항
      - `weather` (text) - 날씨
      - `location` (text) - 지역
      - `is_dummy` (boolean) - 더미 데이터 여부
      - `created_at` (timestamptz) - 생성 시간

  2. Security
    - Enable RLS on `matches` table
    - Add policy for public read access
    - Add policy for authenticated users to insert matches
    - Add policy for users to update their own matches

  3. Indexes
    - Add indexes for common query patterns (date, location, gender, etc.)
*/

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id text PRIMARY KEY,
  seller_id text NOT NULL,
  seller_name text NOT NULL,
  seller_gender text NOT NULL,
  seller_age_group text NOT NULL,
  seller_ntrp real NOT NULL,
  seller_experience integer NOT NULL,
  seller_play_style text NOT NULL,
  seller_career_type text NOT NULL,
  seller_certification_ntrp text NOT NULL DEFAULT 'none',
  seller_certification_career text NOT NULL DEFAULT 'none',
  seller_certification_youtube text NOT NULL DEFAULT 'none',
  seller_certification_instagram text NOT NULL DEFAULT 'none',
  seller_profile_image text,
  seller_view_count integer NOT NULL DEFAULT 0,
  seller_like_count integer NOT NULL DEFAULT 0,
  seller_avg_rating real NOT NULL DEFAULT 0,
  title text NOT NULL,
  date text NOT NULL,
  time text NOT NULL,
  end_time text NOT NULL,
  court text NOT NULL,
  description text NOT NULL,
  base_price integer NOT NULL,
  initial_price integer NOT NULL,
  current_price integer NOT NULL,
  max_price integer NOT NULL,
  expected_views integer NOT NULL DEFAULT 0,
  expected_waiting_applicants integer NOT NULL DEFAULT 0,
  expected_participants_male integer NOT NULL DEFAULT 0,
  expected_participants_female integer NOT NULL DEFAULT 0,
  expected_participants_total integer NOT NULL DEFAULT 0,
  current_applicants_male integer NOT NULL DEFAULT 0,
  current_applicants_female integer NOT NULL DEFAULT 0,
  current_applicants_total integer NOT NULL DEFAULT 0,
  match_type text NOT NULL,
  waiting_applicants integer NOT NULL DEFAULT 0,
  ad_enabled boolean NOT NULL DEFAULT false,
  ntrp_min real NOT NULL,
  ntrp_max real NOT NULL,
  weather text NOT NULL,
  location text NOT NULL,
  is_dummy boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Create policies for matches table
CREATE POLICY "Anyone can read matches"
  ON matches
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert matches"
  ON matches
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own matches"
  ON matches
  FOR UPDATE
  TO authenticated
  USING (seller_id = (auth.uid())::text);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches (date);
CREATE INDEX IF NOT EXISTS idx_matches_location ON matches (location);
CREATE INDEX IF NOT EXISTS idx_matches_seller_gender ON matches (seller_gender);
CREATE INDEX IF NOT EXISTS idx_matches_is_dummy ON matches (is_dummy);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches (created_at DESC);