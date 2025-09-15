/*
  # Simplify career types to 동호인 and 선수

  1. Data Migration
    - Update existing '대학선수' and '실업선수' values to '선수' in users table
    - Update existing '대학선수' and '실업선수' values to '선수' in matches table

  2. Schema Changes
    - Update CHECK constraints to allow only '동호인' and '선수' values
    - Apply constraints to both users and matches tables

  3. Security
    - No changes to RLS policies (existing policies remain valid)
*/

-- Step 1: Update existing data in users table
UPDATE public.users
SET career_type = '선수'
WHERE career_type IN ('대학선수', '실업선수');

-- Step 2: Update existing data in matches table
UPDATE public.matches
SET seller_career_type = '선수'
WHERE seller_career_type IN ('대학선수', '실업선수');

-- Step 3: Update CHECK constraint for users table
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_career_type_check;

ALTER TABLE public.users
ADD CONSTRAINT users_career_type_check
CHECK (career_type = ANY (ARRAY['동호인'::text, '선수'::text]));

-- Step 4: Update CHECK constraint for matches table (if it exists)
-- Note: matches table might not have a career_type check constraint, but we'll add one for consistency
ALTER TABLE public.matches
DROP CONSTRAINT IF EXISTS matches_seller_career_type_check;

ALTER TABLE public.matches
ADD CONSTRAINT matches_seller_career_type_check
CHECK (seller_career_type = ANY (ARRAY['동호인'::text, '선수'::text]));