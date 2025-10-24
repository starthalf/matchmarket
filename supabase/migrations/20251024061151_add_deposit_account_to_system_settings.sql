/*
  # Add Deposit Account Settings

  1. New Settings
    - Add deposit account information to system_settings table
      - Bank name (은행명)
      - Account number (계좌번호)
      - Account holder (예금주)
  
  2. Security
    - Settings are added with is_public = false for security
    - Only admin users can manage these settings
    - Authenticated users can read them

  3. Initial Data
    - Insert placeholder deposit account information
*/

INSERT INTO system_settings (category, key, value, data_type, description, is_public)
VALUES 
  ('deposit_account', 'bank_name', '국민은행', 'string', '플랫폼 수수료 입금 은행명', false),
  ('deposit_account', 'account_number', '123-456-789012', 'string', '플랫폼 수수료 입금 계좌번호', false),
  ('deposit_account', 'account_holder', '매치마켓', 'string', '플랫폼 수수료 입금 계좌 예금주', false)
ON CONFLICT (category, key) DO NOTHING;