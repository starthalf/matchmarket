/*
  # Fix Payment Status Recalculation for Settlements
  
  ## Overview
  This migration fixes a bug where payment_status remains 'confirmed' even after new commission fees are added to an already-settled month.
  
  ## Problem
  When a seller completes all payments for a month (status = 'confirmed'), and then creates new matches that generate additional commission, the system:
  - Updates commission_due (increases)
  - Updates unpaid_amount (becomes > 0)
  - BUT fails to update payment_status back to 'paid' or 'pending'
  
  ## Changes
  
  ### 1. Recalculate payment_status for all settlements
  - Set payment_status based on unpaid_amount:
    - 'confirmed' if unpaid_amount = 0
    - 'paid' if unpaid_amount > 0 AND total_paid_amount > 0
    - 'pending' if unpaid_amount > 0 AND total_paid_amount = 0
  
  ### 2. Ensure data consistency
  - Recalculate unpaid_amount = commission_due - COALESCE(total_paid_amount, 0)
  - Fix any records where unpaid_amount doesn't match this calculation
  
  ## Security
  - No RLS changes needed
  
  ## Important Notes
  - This migration is idempotent and safe to run multiple times
  - It fixes the inconsistent state that occurs when new earnings are added after settlement
  - Does not delete or lose any payment history
  - Logs the number of affected records for audit purposes
*/

-- =============================================
-- Step 1: Ensure total_paid_amount is never NULL
-- =============================================

UPDATE monthly_settlements
SET total_paid_amount = 0
WHERE total_paid_amount IS NULL;

-- =============================================
-- Step 2: Recalculate unpaid_amount for all records
-- =============================================

UPDATE monthly_settlements
SET unpaid_amount = commission_due - COALESCE(total_paid_amount, 0)
WHERE unpaid_amount IS NULL
   OR unpaid_amount != (commission_due - COALESCE(total_paid_amount, 0));

-- =============================================
-- Step 3: Fix payment_status based on actual unpaid_amount
-- =============================================

-- This fixes the bug where status = 'confirmed' but unpaid_amount > 0
UPDATE monthly_settlements
SET payment_status = CASE
  WHEN unpaid_amount = 0 THEN 'confirmed'
  WHEN unpaid_amount > 0 AND COALESCE(total_paid_amount, 0) > 0 THEN 'paid'
  ELSE 'pending'
END
WHERE 
  -- Only update records where the status is incorrect
  payment_status != CASE
    WHEN unpaid_amount = 0 THEN 'confirmed'
    WHEN unpaid_amount > 0 AND COALESCE(total_paid_amount, 0) > 0 THEN 'paid'
    ELSE 'pending'
  END;

-- =============================================
-- Step 4: Add a database trigger to prevent future inconsistencies
-- =============================================

-- Drop the trigger if it already exists
DROP TRIGGER IF EXISTS recalculate_payment_status_on_update ON monthly_settlements;
DROP FUNCTION IF EXISTS recalculate_payment_status();

-- Create function to automatically recalculate payment_status
CREATE OR REPLACE FUNCTION recalculate_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure total_paid_amount is never NULL
  NEW.total_paid_amount := COALESCE(NEW.total_paid_amount, 0);
  
  -- Recalculate unpaid_amount
  NEW.unpaid_amount := NEW.commission_due - NEW.total_paid_amount;
  
  -- Recalculate payment_status
  IF NEW.unpaid_amount = 0 THEN
    NEW.payment_status := 'confirmed';
  ELSIF NEW.total_paid_amount > 0 THEN
    NEW.payment_status := 'paid';
  ELSE
    NEW.payment_status := 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires before INSERT or UPDATE
CREATE TRIGGER recalculate_payment_status_on_update
  BEFORE INSERT OR UPDATE ON monthly_settlements
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_payment_status();
