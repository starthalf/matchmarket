/*
  # Settlement Management System for Admin

  ## Overview
  This migration creates the infrastructure for admin to manually track and manage monthly commission settlements from sellers with support for partial payments.

  ## New Tables

  ### 1. `settlement_payments` 
  Tracks individual payment transactions for settlements (supports multiple partial payments)
  - `id` (uuid, primary key) - Unique payment record ID
  - `settlement_id` (uuid, foreign key) - References monthly_settlements
  - `paid_amount` (decimal) - Amount paid in this transaction
  - `payment_date` (timestamptz) - Date of payment
  - `payment_method` (text) - Payment method (e.g., 'bank_transfer')
  - `notes` (text) - Admin notes about this payment
  - `created_by` (uuid) - Admin user who recorded this payment
  - `created_at` (timestamptz) - Record creation timestamp

  ### 2. `monthly_settlements` (modifications)
  Add new fields to existing table:
  - `total_paid_amount` (decimal) - Sum of all partial payments
  - `unpaid_amount` (decimal) - Remaining unpaid amount (commission_due - total_paid_amount)
  - `is_account_suspended` (boolean) - Whether seller account is suspended for non-payment
  - `suspension_date` (timestamptz) - When the account was suspended
  - `admin_notes` (text) - General admin notes for this settlement

  ## Security
  - Enable RLS on settlement_payments table
  - Only admin users can view and insert settlement payment records
  - Add RLS policies for authenticated admin access

  ## Important Notes
  - Partial payments are supported through settlement_payments table
  - Each payment is recorded separately for audit trail
  - Unpaid amount is calculated dynamically but stored for quick access
  - Account suspension is manual process controlled by admin
  - No automatic notifications to sellers (manual process)
*/

-- =============================================
-- Create settlement_payments table
-- =============================================

CREATE TABLE IF NOT EXISTS settlement_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id uuid NOT NULL,
  paid_amount decimal(10,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  payment_date timestamptz NOT NULL DEFAULT now(),
  payment_method text NOT NULL DEFAULT 'bank_transfer',
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'settlement_payments_settlement_id_fkey'
  ) THEN
    ALTER TABLE settlement_payments
    ADD CONSTRAINT settlement_payments_settlement_id_fkey
    FOREIGN KEY (settlement_id) REFERENCES monthly_settlements(id) ON DELETE CASCADE;
  END IF;
END $$;

-- =============================================
-- Modify monthly_settlements table
-- =============================================

-- Add total_paid_amount column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'monthly_settlements' AND column_name = 'total_paid_amount'
  ) THEN
    ALTER TABLE monthly_settlements ADD COLUMN total_paid_amount decimal(10,2) DEFAULT 0 CHECK (total_paid_amount >= 0);
  END IF;
END $$;

-- Add unpaid_amount column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'monthly_settlements' AND column_name = 'unpaid_amount'
  ) THEN
    ALTER TABLE monthly_settlements ADD COLUMN unpaid_amount decimal(10,2) DEFAULT 0;
  END IF;
END $$;

-- Add is_account_suspended column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'monthly_settlements' AND column_name = 'is_account_suspended'
  ) THEN
    ALTER TABLE monthly_settlements ADD COLUMN is_account_suspended boolean DEFAULT false;
  END IF;
END $$;

-- Add suspension_date column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'monthly_settlements' AND column_name = 'suspension_date'
  ) THEN
    ALTER TABLE monthly_settlements ADD COLUMN suspension_date timestamptz;
  END IF;
END $$;

-- Add admin_notes column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'monthly_settlements' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE monthly_settlements ADD COLUMN admin_notes text;
  END IF;
END $$;

-- =============================================
-- Initialize existing data
-- =============================================

-- Set unpaid_amount for existing records
UPDATE monthly_settlements
SET 
  total_paid_amount = 0,
  unpaid_amount = commission_due,
  is_account_suspended = is_blocked
WHERE total_paid_amount IS NULL;

-- =============================================
-- Row Level Security (RLS)
-- =============================================

-- Enable RLS on settlement_payments
ALTER TABLE settlement_payments ENABLE ROW LEVEL SECURITY;

-- Policy: Admin users can view all settlement payments
CREATE POLICY "Admin users can view all settlement payments"
  ON settlement_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Policy: Admin users can insert settlement payments
CREATE POLICY "Admin users can insert settlement payments"
  ON settlement_payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Policy: Admin users can update settlement payments
CREATE POLICY "Admin users can update settlement payments"
  ON settlement_payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Policy: Admin users can delete settlement payments
CREATE POLICY "Admin users can delete settlement payments"
  ON settlement_payments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- =============================================
-- Create indexes for performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_settlement_payments_settlement_id 
  ON settlement_payments(settlement_id);

CREATE INDEX IF NOT EXISTS idx_settlement_payments_payment_date 
  ON settlement_payments(payment_date);

CREATE INDEX IF NOT EXISTS idx_monthly_settlements_account_suspended 
  ON monthly_settlements(is_account_suspended) 
  WHERE is_account_suspended = true;