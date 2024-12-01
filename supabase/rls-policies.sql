-- Suppression de toutes les politiques existantes
DROP POLICY IF EXISTS "Entreprises - Select" ON entreprises;
DROP POLICY IF EXISTS "Entreprises - Insert" ON entreprises;
DROP POLICY IF EXISTS "Entreprises - Update" ON entreprises;
DROP POLICY IF EXISTS "Entreprises - Delete" ON entreprises;
DROP POLICY IF EXISTS "Categories - Select" ON categories;
DROP POLICY IF EXISTS "Categories - Insert" ON categories;
DROP POLICY IF EXISTS "Categories - Update" ON categories;
DROP POLICY IF EXISTS "Categories - Delete" ON categories;
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres entreprises" ON entreprises;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leurs propres entreprises" ON entreprises;
DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs propres entreprises" ON entreprises;
DROP POLICY IF EXISTS "Les utilisateurs peuvent insérer leurs propres entreprises" ON entreprises;
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres catégories" ON categories;
DROP POLICY IF EXISTS "Les utilisateurs peuvent ajouter leurs propres catégories" ON categories;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leurs propres catégories" ON categories;
DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer leurs propres catégories" ON categories;

-- Désactiver puis réactiver RLS pour s'assurer qu'il n'y a pas de politiques résiduelles
ALTER TABLE entreprises DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

ALTER TABLE entreprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- S'assurer que la colonne user_id existe et est une clé étrangère
ALTER TABLE entreprises DROP CONSTRAINT IF EXISTS entreprises_user_id_fkey;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_user_id_fkey;

ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Ajouter les contraintes de clé étrangère si elles n'existent pas
ALTER TABLE entreprises 
  ADD CONSTRAINT entreprises_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id);

ALTER TABLE categories 
  ADD CONSTRAINT categories_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id);

-- Créer les nouvelles politiques pour entreprises
CREATE POLICY "Entreprises - Select"
  ON entreprises
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Entreprises - Insert"
  ON entreprises
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Entreprises - Update"
  ON entreprises
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Entreprises - Delete"
  ON entreprises
  FOR DELETE
  USING (auth.uid() = user_id);

-- Créer les nouvelles politiques pour categories
CREATE POLICY "Categories - Select"
  ON categories
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Categories - Insert"
  ON categories
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Categories - Update"
  ON categories
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Categories - Delete"
  ON categories
  FOR DELETE
  USING (auth.uid() = user_id);

-- Storage policies pour les logos
DROP POLICY IF EXISTS "Logos - Select" ON storage.objects;
DROP POLICY IF EXISTS "Logos - Insert" ON storage.objects;
DROP POLICY IF EXISTS "Logos - Update" ON storage.objects;
DROP POLICY IF EXISTS "Logos - Delete" ON storage.objects;

-- Lecture publique des logos
CREATE POLICY "Logos - Select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'logos');

-- Upload de logos uniquement par les utilisateurs authentifiés dans leur dossier
CREATE POLICY "Logos - Insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'logos' AND
    auth.role() = 'authenticated' AND
    position(auth.uid()::text in storage.filename(name)) > 0
  );

-- Mise à jour uniquement par le propriétaire
CREATE POLICY "Logos - Update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'logos' AND
    auth.role() = 'authenticated' AND
    position(auth.uid()::text in storage.filename(name)) > 0
  );

-- Suppression uniquement par le propriétaire
CREATE POLICY "Logos - Delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'logos' AND
    auth.role() = 'authenticated' AND
    position(auth.uid()::text in storage.filename(name)) > 0
  );
