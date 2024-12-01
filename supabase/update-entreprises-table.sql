-- Add new columns to entreprises table
ALTER TABLE entreprises
ADD COLUMN IF NOT EXISTS localisation text,
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS site_web text,
ADD COLUMN IF NOT EXISTS categorie text[];

-- Update RLS policies
ALTER TABLE entreprises ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all companies" ON entreprises;
DROP POLICY IF EXISTS "Users can insert their own companies" ON entreprises;
DROP POLICY IF EXISTS "Users can update their own companies" ON entreprises;
DROP POLICY IF EXISTS "Users can delete their own companies" ON entreprises;

-- Allow users to see all companies
CREATE POLICY "Users can view all companies" ON entreprises
    FOR SELECT
    USING (true);

-- Allow users to insert their own companies
CREATE POLICY "Users can insert their own companies" ON entreprises
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own companies
CREATE POLICY "Users can update their own companies" ON entreprises
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Allow users to delete their own companies
CREATE POLICY "Users can delete their own companies" ON entreprises
    FOR DELETE
    USING (auth.uid() = user_id);
