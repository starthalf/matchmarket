/*
  # Add is_blocked column to monthly_settlements table

  ## Overview
  This migration adds the `is_blocked` column to the `monthly_settlements` table to maintain
  consistency with the codebase that references both `is_blocked` and `is_account_suspended`.
  
  ## Changes
  
  ### 1. Add `is_blocked` column to `monthly_settlements`
  - `is_blocked` (boolean) - Whether the seller account is blocked for non-payment
  - Defaults to false
  - Initialized with the current value of `is_account_suspended`
  
  ### 2. Create trigger to keep is_blocked and is_account_suspended in sync
  - Automatically syncs both columns when either is updated
  - Ensures data consistency across the application
  
  ### 3. Create index for performance
  - Index on `is_blocked` for faster queries filtering blocked accounts
  
  ## Security
  - No RLS changes needed (inherits from existing table policies)
  
  ## Important Notes
  - Both `is_blocked` and `is_account_suspended` will always have the same value
  - The trigger ensures automatic synchronization
  - Existing code can reference either field name
*/

-- =============================================
-- Add is_blocked column to monthly_settlements
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'monthly_settlements' AND column_name = 'is_blocked'
  ) THEN
    ALTER TABLE monthly_settlements ADD COLUMN is_blocked boolean DEFAULT false;
  END IF;
END $$;

-- =============================================
-- Initialize is_blocked with is_account_suspended values
-- =============================================

UPDATE monthly_settlements
SET is_blocked = COALESCE(is_account_suspended, false)
WHERE is_blocked IS NULL OR is_blocked != COALESCE(is_account_suspended, false);

-- =============================================
-- Create trigger function to sync is_blocked and is_account_suspended
-- =============================================

CREATE OR REPLACE FUNCTION sync_account_suspension_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- If is_blocked was changed, update is_account_suspended
  IF NEW.is_blocked IS DISTINCT FROM OLD.is_blocked THEN
    NEW.is_account_suspended := NEW.is_blocked;
  END IF;
  
  -- If is_account_suspended was changed, update is_blocked
  IF NEW.is_account_suspended IS DISTINCT FROM OLD.is_account_suspended THEN
    NEW.is_blocked := NEW.is_account_suspended;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Create trigger on monthly_settlements
-- =============================================

DROP TRIGGER IF EXISTS sync_monthly_settlements_suspension ON monthly_settlements;

CREATE TRIGGER sync_monthly_settlements_suspension
  BEFORE UPDATE ON monthly_settlements
  FOR EACH ROW
  EXECUTE FUNCTION sync_account_suspension_fields();

-- =============================================
-- Create index for performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_monthly_settlements_is_blocked 
  ON monthly_settlements(is_blocked) 
  WHERE is_blocked = true;