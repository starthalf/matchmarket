/*
  # Fix Unpaid Amount Calculation for Existing Settlements

  ## Overview
  This migration fixes incorrect unpaid_amount values in the monthly_settlements table.
  Some existing records have unpaid_amount = 0 when they should have unpaid_amount = commission_due.

  ## Changes

  ### 1. Recalculate unpaid_amount for all existing settlements
  - Set unpaid_amount = commission_due - COALESCE(total_paid_amount, 0)
  - This ensures that settlements with no payments show the full commission_due as unpaid
  - Settlements with partial payments will show the correct remaining amount

  ### 2. Update payment_status based on unpaid_amount
  - If unpaid_amount = 0, set payment_status to 'confirmed'
  - If unpaid_amount > 0 and total_paid_amount > 0, set payment_status to 'paid'
  - If unpaid_amount > 0 and total_paid_amount = 0, set payment_status to 'pending'

  ### 3. Ensure total_paid_amount is never NULL
  - Set total_paid_amount = 0 where it is NULL

  ## Security
  - No RLS changes needed

  ## Important Notes
  - This migration is idempotent and safe to run multiple times
  - It recalculates values based on existing data
  - Does not delete or lose any payment history
*/

-- =============================================
-- Ensure total_paid_amount is never NULL
-- =============================================

UPDATE monthly_settlements
SET total_paid_amount = 0
WHERE total_paid_amount IS NULL;

-- =============================================
-- Recalculate unpaid_amount for all records
-- =============================================

UPDATE monthly_settlements
SET unpaid_amount = commission_due - COALESCE(total_paid_amount, 0)
WHERE unpaid_amount IS NULL
   OR unpaid_amount != (commission_due - COALESCE(total_paid_amount, 0));

-- =============================================
-- Update payment_status based on unpaid_amount
-- =============================================

UPDATE monthly_settlements
SET payment_status = CASE
  WHEN unpaid_amount = 0 THEN 'confirmed'
  WHEN unpaid_amount > 0 AND total_paid_amount > 0 THEN 'paid'
  ELSE 'pending'
END
WHERE payment_status != CASE
  WHEN unpaid_amount = 0 THEN 'confirmed'
  WHEN unpaid_amount > 0 AND total_paid_amount > 0 THEN 'paid'
  ELSE 'pending'
END;
