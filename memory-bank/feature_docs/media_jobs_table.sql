-- Migration: Create media_jobs table for job tracking
CREATE TABLE IF NOT EXISTS media_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  status text NOT NULL,
  output_url text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_jobs_asset_id ON media_jobs(asset_id);
CREATE INDEX IF NOT EXISTS idx_media_jobs_user_id ON media_jobs(user_id); 