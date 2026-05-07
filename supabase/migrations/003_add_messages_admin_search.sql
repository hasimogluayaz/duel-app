-- ============================================================
-- Migration 003: Messages tablosu + Admin/Search alanları
-- Supabase Dashboard > SQL Editor'de çalıştır
-- ============================================================

-- 1. profiles tablosuna is_admin ve is_banned sütunları ekle
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false;

-- 2. messages tablosu (direct messaging)
CREATE TABLE IF NOT EXISTS messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content     text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  is_read     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index: hızlı conversation sorgusu
CREATE INDEX IF NOT EXISTS idx_messages_sender    ON messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_receiver  ON messages(receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread    ON messages(receiver_id, is_read) WHERE is_read = false;

-- 3. Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi mesajlarını görebilir
CREATE POLICY "messages_select"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Giriş yapmış kullanıcı mesaj gönderebilir (sender = kendisi)
CREATE POLICY "messages_insert"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Sadece alıcı is_read güncelleyebilir
CREATE POLICY "messages_update_read"
  ON messages FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- 4. profiles: is_banned olan kullanıcılar bazı işlemlerden kısıtlanabilir
-- Admin olmayan kullanıcılar is_admin / is_banned alanlarını değiştiremez
CREATE POLICY "profiles_no_self_admin"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    -- Kendi is_admin ve is_banned alanlarını değiştiremez
    is_admin = (SELECT is_admin FROM profiles WHERE id = auth.uid()) AND
    is_banned = (SELECT is_banned FROM profiles WHERE id = auth.uid())
  );

-- 5. Admin ilk kullanıcıyı admin yap (kendi user ID'ni yaz)
-- UPDATE profiles SET is_admin = true WHERE id = 'YOUR-USER-UUID-HERE';

-- ============================================================
-- Realtime: messages tablosunu realtime'a ekle
-- Supabase Dashboard > Database > Replication > messages tablosunu aç
-- Veya aşağıdaki komutu çalıştır:
-- ============================================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
