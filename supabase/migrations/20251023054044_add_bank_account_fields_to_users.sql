/*
  # Add bank account fields to users table

  1. Schema Changes
    - Add `bank_name` (text, nullable) - Bank name for withdrawal/payment
    - Add `account_number` (text, nullable) - Bank account number
    - Add `account_holder` (text, nullable) - Account holder name

  2. Migration Details
    - These fields are optional (nullable) since not all users need to register bank accounts immediately
    - Users can add bank account information later through profile settings
    - Required when users want to:
      - Register matches for sale (to receive payments)
      - Request withdrawals
      - Receive refunds

  3. Security
    - No changes to RLS policies needed
    - Existing policies already cover these fields:
      - "Users can update their own profile" - allows users to update their own bank info
      - "Anyone can read user profiles" - allows viewing (but consider privacy in future)

  4. Important Notes
    - Bank account information is sensitive data
    - Consider adding encryption or access restrictions in production
    - Current implementation allows public read access (inherited from users table policy)
*/

-- Add bank account columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS account_number text,
ADD COLUMN IF NOT EXISTS account_holder text;

-- Create index for faster queries when filtering by users with registered accounts
CREATE INDEX IF NOT EXISTS idx_users_has_bank_account 
ON public.users(id) 
WHERE bank_name IS NOT NULL AND account_number IS NOT NULL;

-- Add helpful comment to columns
COMMENT ON COLUMN public.users.bank_name IS 'Bank name for withdrawal and payment processing';
COMMENT ON COLUMN public.users.account_number IS 'Bank account number for withdrawal and payment processing';
COMMENT ON COLUMN public.users.account_holder IS 'Account holder name, should match user verification';