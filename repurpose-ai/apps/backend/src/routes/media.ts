import { Router } from 'express';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

const router = Router();

ffmpeg.setFfmpegPath(ffmpegPath as string);

// Helper: Download file from URL to local path
async function downloadFile(url: string, dest: string) {
  const writer = fs.createWriteStream(dest);
  const response = await axios({ url, method: 'GET', responseType: 'stream' });
  response.data.pipe(writer);
  return new Promise<void>((resolve, reject) => {
    writer.on('finish', () => resolve());
    writer.on('error', reject);
  });
}

// Helper: Upload file to Supabase Storage
async function uploadToSupabase(localPath: string, storagePath: string) {
  const fileBuffer = fs.readFileSync(localPath);
  const { data, error } = await supabase.storage.from('assets').upload(storagePath, fileBuffer, { upsert: true });
  if (error) throw new Error(error.message);
  return data?.path;
}

// Endpoint to generate a video reel from an uploaded asset (e.g., clip from a video)
router.post('/generate-reel', async (req, res) => {
  const { assetId, startTime, endTime, style } = req.body;
  if (!assetId) {
    res.status(400).json({ error: 'assetId is required' });
    return;
  }
  const jobId = uuidv4();
  await supabase.from('media_jobs').insert([
    {
      id: jobId,
      asset_id: assetId,
      user_id: null, // TODO: Extract user ID from auth if needed
      type: 'reel',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);
  const { data: asset, error: assetError } = await supabase.from('assets').select('*').eq('id', assetId).single();
  if (assetError || !asset) {
    await supabase.from('media_jobs').update({ status: 'error', error: 'Asset not found', updated_at: new Date().toISOString() }).eq('id', jobId);
    res.status(404).json({ error: 'Asset not found' });
    return;
  }
  try {
    // Download asset file
    const inputUrl = asset.file_url;
    const inputPath = path.join('/tmp', `${assetId}-input`);
    const outputPath = path.join('/tmp', `${jobId}-output.mp4`);
    await downloadFile(inputUrl, inputPath);
    // Run FFmpeg to extract a 30s clip (or as specified)
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(startTime || 0)
        .setDuration((endTime || 30) - (startTime || 0))
        .outputOptions('-c:v libx264', '-preset veryfast')
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', reject)
        .run();
    });
    // Upload result to Supabase Storage
    const fileData = fs.readFileSync(outputPath);
    const storagePath = `generated/${jobId}.mp4`;
    const uploadedPath = await uploadToSupabase(outputPath, storagePath);
    const { data: publicUrlData } = supabase.storage.from('assets').getPublicUrl(uploadedPath);
    const outputUrl = publicUrlData?.publicUrl;
    // Update job status
    await supabase.from('media_jobs').update({
      status: 'complete',
      output_url: outputUrl,
      updated_at: new Date().toISOString(),
    }).eq('id', jobId);
    // Clean up temp files
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);
    res.json({ jobId });
  } catch (err: any) {
    await supabase.from('media_jobs').update({
      status: 'error',
      error: err.message || 'Processing failed',
      updated_at: new Date().toISOString(),
    }).eq('id', jobId);
    res.status(500).json({ error: err.message || 'Processing failed' });
  }
});

// Endpoint to generate an audiogram (e.g., audio clip with waveform) from an uploaded asset
router.post('/generate-audiogram', async (req, res) => {
  const { assetId, style } = req.body;
  if (!assetId) {
    res.status(400).json({ error: 'assetId is required' });
    return;
  }
  const jobId = uuidv4();
  await supabase.from('media_jobs').insert([
    {
      id: jobId,
      asset_id: assetId,
      user_id: null, // TODO: Extract user ID from auth if needed
      type: 'audiogram',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);
  const { data: asset, error: assetError } = await supabase.from('assets').select('*').eq('id', assetId).single();
  if (assetError || !asset) {
    await supabase.from('media_jobs').update({ status: 'error', error: 'Asset not found', updated_at: new Date().toISOString() }).eq('id', jobId);
    res.status(404).json({ error: 'Asset not found' });
    return;
  }
  try {
    // Download asset file
    const inputUrl = asset.file_url;
    const inputPath = path.join('/tmp', `${assetId}-input`);
    const outputPath = path.join('/tmp', `${jobId}-audiogram.mp4`);
    await downloadFile(inputUrl, inputPath);
    // Run FFmpeg to generate a waveform video (audiogram)
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .complexFilter([
          {
            filter: 'showwaves',
            options: { s: '1280x720', mode: 'line', colors: 'white' },
          },
        ])
        .outputOptions('-c:v libx264', '-preset veryfast', '-tune stillimage', '-pix_fmt yuv420p')
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', reject)
        .run();
    });
    // Upload result to Supabase Storage
    const fileData = fs.readFileSync(outputPath);
    const storagePath = `generated/${jobId}-audiogram.mp4`;
    const uploadedPath = await uploadToSupabase(outputPath, storagePath);
    const { data: publicUrlData } = supabase.storage.from('assets').getPublicUrl(uploadedPath);
    const outputUrl = publicUrlData?.publicUrl;
    // Update job status
    await supabase.from('media_jobs').update({
      status: 'complete',
      output_url: outputUrl,
      updated_at: new Date().toISOString(),
    }).eq('id', jobId);
    // Clean up temp files
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);
    res.json({ jobId });
  } catch (err: any) {
    await supabase.from('media_jobs').update({
      status: 'error',
      error: err.message || 'Processing failed',
      updated_at: new Date().toISOString(),
    }).eq('id', jobId);
    res.status(500).json({ error: err.message || 'Processing failed' });
  }
});

// Endpoint to get job status/result
router.get('/job/:jobId', async (req, res) => {
  const { jobId } = req.params;
  const { data: job, error } = await supabase.from('media_jobs').select('*').eq('id', jobId).single();
  if (error || !job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }
  res.json(job);
});

export default router; 