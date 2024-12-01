-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow users to upload files to the logos bucket
CREATE POLICY "Allow users to upload logos" ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'logos' AND
    auth.role() = 'authenticated'
);

-- Allow users to update their uploaded files
CREATE POLICY "Allow users to update their logos" ON storage.objects FOR UPDATE
USING (
    bucket_id = 'logos' AND
    auth.role() = 'authenticated'
);

-- Allow users to delete their uploaded files
CREATE POLICY "Allow users to delete their logos" ON storage.objects FOR DELETE
USING (
    bucket_id = 'logos' AND
    auth.role() = 'authenticated'
);

-- Allow public read access to all files in the logos bucket
CREATE POLICY "Allow public read access to logos" ON storage.objects FOR SELECT
USING (bucket_id = 'logos');
