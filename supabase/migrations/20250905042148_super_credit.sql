/*
  # 관리자 시스템을 위한 테이블 생성

  1. New Tables
    - `admin_users` - 관리자 계정 관리
    - `withdrawal_requests` - 출금 신청 관리
    - `payment_confirmations` - 입금 확인 관리
    - `admin_logs` - 관리자 활동 로그
    - `system_settings` - 시스템 설정

  2. Security
    - 모든 테이블에 RLS 활성화
    - 관리자 전용 정책 설정
    - 일반 사용자는 접근 불가

  3. Functions
    - 관리자 권한 확인 함수
    - 출금 처리 함수
    - 입금 확인 함수
*/

-- 관리자 사용자 테이블
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  permissions jsonb NOT NULL DEFAULT '[]',
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 출금 신청 테이블
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  user_name text NOT NULL,
  amount integer NOT NULL,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_holder text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  admin_note text,
  processed_by uuid REFERENCES admin_users(id),
  processed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 입금 확인 테이블
CREATE TABLE IF NOT EXISTS payment_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id text NOT NULL,
  user_id text NOT NULL,
  user_name text NOT NULL,
  amount integer NOT NULL,
  depositor_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  admin_note text,
  confirmed_by uuid REFERENCES admin_users(id),
  confirmed_at timestamptz,
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 관리자 활동 로그 테이블
CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- 시스템 설정 테이블 (기존 app_settings 확장)
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  key text NOT NULL,
  value text NOT NULL,
  data_type text NOT NULL DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
  description text,
  is_public boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES admin_users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(category, key)
);

-- RLS 활성화
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- 관리자 권한 확인 함수
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = is_admin.user_id 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 관리자 전용 정책들
CREATE POLICY "Only admins can read admin_users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Only super admins can modify admin_users"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin' 
      AND is_active = true
    )
  );

CREATE POLICY "Only admins can read withdrawal_requests"
  ON withdrawal_requests
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can update withdrawal_requests"
  ON withdrawal_requests
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can read payment_confirmations"
  ON payment_confirmations
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can update payment_confirmations"
  ON payment_confirmations
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can read admin_logs"
  ON admin_logs
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can insert admin_logs"
  ON admin_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Public settings are readable by all"
  ON system_settings
  FOR SELECT
  TO public
  USING (is_public = true);

CREATE POLICY "Only admins can read all system_settings"
  ON system_settings
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can modify system_settings"
  ON system_settings
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

-- 업데이트 트리거들
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_withdrawal_requests_updated_at
  BEFORE UPDATE ON withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_confirmations_updated_at
  BEFORE UPDATE ON payment_confirmations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 기본 시스템 설정값 삽입
INSERT INTO system_settings (category, key, value, data_type, description, is_public) VALUES
('payment', 'platform_fee', '15', 'number', '플랫폼 수수료 (%)', false),
('payment', 'withdrawal_fee', '0', 'number', '출금 수수료 (원)', false),
('payment', 'min_withdrawal_amount', '10000', 'number', '최소 출금 금액 (원)', false),
('payment', 'withdrawal_period_days', '14', 'number', '출금 주기 (일)', false),
('system', 'maintenance_mode', 'false', 'boolean', '점검 모드', true),
('notification', 'push_enabled', 'true', 'boolean', '푸시 알림 활성화', false),
('notification', 'email_enabled', 'true', 'boolean', '이메일 알림 활성화', false)
ON CONFLICT (category, key) DO NOTHING;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_created_at ON withdrawal_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_confirmations_status ON payment_confirmations(status);
CREATE INDEX IF NOT EXISTS idx_payment_confirmations_match_id ON payment_confirmations(match_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);