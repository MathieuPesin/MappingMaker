-- Forcer la réactivation de RLS
ALTER TABLE entreprises DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

ALTER TABLE entreprises FORCE ROW LEVEL SECURITY;
ALTER TABLE categories FORCE ROW LEVEL SECURITY;

-- Supprimer et recréer les politiques
DROP POLICY IF EXISTS "Entreprises - Select" ON entreprises;
DROP POLICY IF EXISTS "Entreprises - Insert" ON entreprises;
DROP POLICY IF EXISTS "Entreprises - Update" ON entreprises;
DROP POLICY IF EXISTS "Entreprises - Delete" ON entreprises;

-- Recréer avec des conditions plus strictes
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

-- Vérifier que les user_id sont bien assignés
UPDATE entreprises
SET user_id = auth.uid()
WHERE user_id IS NULL;
