-- Allow users to upload files to their own folder
CREATE POLICY "Users can upload files to their own folder" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    -- Ensure authenticated
    auth.role() = 'authenticated' AND
    -- Ensure correct folder pattern: auth.uid()/filename
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to update their own files
CREATE POLICY "Users can update their own files" ON storage.objects
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE
  USING (
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public access to read files
CREATE POLICY "Public access to logos" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'logos'
  );
