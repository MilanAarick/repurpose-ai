import express from 'express';
import { supabase } from '../supabaseClient';
import axios from 'axios';

const router = express.Router();

// Get all active Gemini API keys, ordered by usage_count
router.get('/gemini-keys', async (req, res) => {
  const { data, error } = await supabase
    .from('gemini_api_keys')
    .select('*')
    .eq('active', true)
    .order('usage_count', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Summarize transcript and save to asset
router.post('/summarize', async (req, res) => {
  const { assetId, transcript } = req.body;
  if (!assetId || !transcript) {
    return res.status(400).json({ error: 'assetId and transcript are required' });
  }

  // 1. Get the least-used active Gemini API key
  const { data: keys, error: keyError } = await supabase
    .from('gemini_api_keys')
    .select('*')
    .eq('active', true)
    .order('usage_count', { ascending: true })
    .limit(1);

  if (keyError || !keys || keys.length === 0) {
    return res.status(500).json({ error: 'No active Gemini API keys available' });
  }
  const apiKey = keys[0].api_key;

  // 2. Call Gemini API
  try {
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: `Summarize this transcript:\n${transcript}` }] }]
      }
    );
    const summary = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // 3. Save summary to asset
    const { error: updateError } = await supabase
      .from('assets')
      .update({ summary })
      .eq('id', assetId);

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    // 4. Increment usage_count for the key
    await supabase
      .from('gemini_api_keys')
      .update({ usage_count: keys[0].usage_count + 1, last_used_at: new Date().toISOString() })
      .eq('id', keys[0].id);

    res.json({ summary });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gemini API error' });
  }
});

export default router;