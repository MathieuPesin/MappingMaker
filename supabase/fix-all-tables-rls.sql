-- Forcer la réactivation de RLS sur toutes les tables
ALTER TABLE entreprises DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

ALTER TABLE entreprises FORCE ROW LEVEL SECURITY;
ALTER TABLE categories FORCE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Entreprises - Select" ON entreprises;
DROP POLICY IF EXISTS "Entreprises - Insert" ON entreprises;
DROP POLICY IF EXISTS "Entreprises - Update" ON entreprises;
DROP POLICY IF EXISTS "Entreprises - Delete" ON entreprises;

DROP POLICY IF EXISTS "Categories - Select" ON categories;
DROP POLICY IF EXISTS "Categories - Insert" ON categories;
DROP POLICY IF EXISTS "Categories - Update" ON categories;
DROP POLICY IF EXISTS "Categories - Delete" ON categories;

-- Recréer les politiques pour entreprises
CREATE POLICY "Entreprises - Select"
  ON entreprises
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  );

CREATE POLICY "Entreprises - Insert"
  ON entreprises
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  );

CREATE POLICY "Entreprises - Update"
  ON entreprises
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  )
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  );

CREATE POLICY "Entreprises - Delete"
  ON entreprises
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  );

-- Recréer les politiques pour categories
CREATE POLICY "Categories - Select"
  ON categories
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  );

CREATE POLICY "Categories - Insert"
  ON categories
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  );

CREATE POLICY "Categories - Update"
  ON categories
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  )
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  );

CREATE POLICY "Categories - Delete"
  ON categories
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  );

-- S'assurer que toutes les tables ont une colonne user_id
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Mettre à jour les données existantes avec l'ID de l'utilisateur actuel
UPDATE entreprises SET user_id = auth.uid() WHERE user_id IS NULL;
UPDATE categories SET user_id = auth.uid() WHERE user_id IS NULL;
