-- ══════════════════════════════════════════════════════
-- Migration 006: Supabase Storage — avatars bucket
-- ══════════════════════════════════════════════════════

-- Create the avatars storage bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,  -- 2MB in bytes
  ARRAY['image/jpeg','image/png','image/gif','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: anyone can read
CREATE POLICY "avatars_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- RLS: authenticated users can upload their own avatar
CREATE POLICY "avatars_user_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
  AND name = 'avatars/' || auth.uid()::text || '.' || (storage.extension(name))
);

-- RLS: users can update/delete their own avatar
CREATE POLICY "avatars_user_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "avatars_user_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
);
