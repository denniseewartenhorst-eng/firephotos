-- =====================================================
-- FirePhotos Database Schema
-- Paste this entire file into Supabase SQL Editor and run it
-- =====================================================

-- Users
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  total_wins INTEGER NOT NULL DEFAULT 0,
  last_win_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Photos
CREATE TABLE photos (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  upload_date DATE NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'today' CHECK (status IN ('today', 'yesterday', 'archived')),
  vote_count INTEGER NOT NULL DEFAULT 0,
  won_photo_of_the_day BOOLEAN NOT NULL DEFAULT FALSE,
  has_applied_sticker BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX photos_user_date_idx ON photos(user_id, upload_date);
CREATE INDEX photos_status_idx ON photos(status);

-- Votes
CREATE TABLE votes (
  id BIGSERIAL PRIMARY KEY,
  voter_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photo_id BIGINT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  vote_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(voter_id, photo_id)
);
CREATE INDEX votes_voter_date_idx ON votes(voter_id, vote_date);

-- Day Cycles
CREATE TABLE day_cycles (
  id BIGSERIAL PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  photo_of_the_day_id BIGINT REFERENCES photos(id) ON DELETE SET NULL,
  sticker_of_the_day TEXT NOT NULL CHECK (sticker_of_the_day IN ('A', 'B')),
  cycle_completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Allow public access via anon key (since we're using custom auth)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE votes DISABLE ROW LEVEL SECURITY;
ALTER TABLE day_cycles DISABLE ROW LEVEL SECURITY;

-- Storage bucket policy: allow anyone to upload and read from 'photos' bucket
-- (Run after creating the 'photos' bucket in Storage UI)
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload photos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'photos');
CREATE POLICY "Anyone can read photos" ON storage.objects FOR SELECT
  USING (bucket_id = 'photos');
CREATE POLICY "Anyone can update photos" ON storage.objects FOR UPDATE
  USING (bucket_id = 'photos');
CREATE POLICY "Anyone can delete photos" ON storage.objects FOR DELETE
  USING (bucket_id = 'photos');
