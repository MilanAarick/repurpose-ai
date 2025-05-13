# media_jobs Table Schema (Job Tracking for Media Generation)

## Purpose
Tracks the status and result of each media asset generation job (video reel, audiogram, etc.) for user assets.

## Fields
- id: uuid (primary key)
- asset_id: uuid (references assets.id)
- user_id: uuid (references users.id)
- type: text (e.g., 'reel', 'audiogram')
- status: text (e.g., 'pending', 'processing', 'complete', 'error')
- output_url: text (URL to generated media in storage, nullable)
- error: text (nullable, error message if failed)
- created_at: timestamp
- updated_at: timestamp

## Usage
- Insert a new row when a media generation job is created.
- Update status and output_url as processing progresses.
- Used by backend endpoints and frontend polling for job status/results. 