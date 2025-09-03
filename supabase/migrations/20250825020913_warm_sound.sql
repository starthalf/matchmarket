/*
  # 매치 데이터 테이블 생성

  1. New Tables
    - `matches`
      - 매치의 모든 정보를 저장하는 메인 테이블
      - 판매자 정보도 함께 저장하여 조인 없이 빠른 조회 가능
      - 더미 데이터와 실제 사용자 데이터 구분을 위한 `is_dummy` 컬럼 포함
    
    - `app_settings`
      - 앱 전역 설정값 저장 (마지막 더미 데이터 생성 날짜 등)

  2. Security
    - 두 테이블 모두 RLS 활성화
    - 모든 사용자가 매치 데이터를 읽을 수 있도록 정책 설정
    - 앱 설정은 관리자만 수정 가능하도록 제한

  3. Indexes
    - 매치 조회 성능 향상을 위한 인덱스 생성
    - 날짜, 생성일, 더미 여부 등에 대한 인덱스
*/

-- 매치 테이블 생성
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

-- 앱 설정 테이블 생성
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- RLS 활성화
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- 매치 테이블 정책
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
  USING (seller_id = auth.uid()::text);

-- 앱 설정 테이블 정책
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

-- 성능을 위한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(date);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_is_dummy ON matches(is_dummy);
CREATE INDEX IF NOT EXISTS idx_matches_location ON matches(location);
CREATE INDEX IF NOT EXISTS idx_matches_seller_gender ON matches(seller_gender);
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);

-- 초기 설정값 삽입
INSERT INTO app_settings (key, value) 
VALUES ('last_dummy_generation_date', '2024-01-01')
ON CONFLICT (key) DO NOTHING;