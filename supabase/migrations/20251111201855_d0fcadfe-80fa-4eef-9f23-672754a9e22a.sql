-- Allow public uploads to gallery bucket
CREATE POLICY "Allow public uploads to gallery"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'gallery');

-- Allow public updates to gallery bucket (for overwrites)
CREATE POLICY "Allow public updates to gallery"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'gallery')
WITH CHECK (bucket_id = 'gallery');

-- Allow public deletes from gallery bucket
CREATE POLICY "Allow public deletes from gallery"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'gallery');