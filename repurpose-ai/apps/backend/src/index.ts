import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { supabase } from './supabaseClient';
import geminiRoutes from './routes/gemini';
import { createClient } from '@supabase/supabase-js';
import mediaRoutes from './routes/media';
import cors from 'cors';

// Extend Express Request type to include supabaseUser
declare global {
  namespace Express {
    interface Request {
      supabaseUser?: any;
    }
  }
}

const app = express();
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// --- Supabase JWT validation middleware ---
async function requireSupabaseUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];
  if (!authHeader) { res.status(401).send('Missing Authorization header'); return; }
  const token = authHeader.split(' ')[1];
  if (!token) { res.status(401).send('Missing token'); return; }
  // Validate the JWT with Supabase
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) { res.status(401).send('Invalid or expired token'); return; }
  req.supabaseUser = data.user;
  next();
}

// --- USER CRUD (user_social_accounts table) ---
app.get('/api/users', async (req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase.from('user_social_accounts').select('*');
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

app.post('/api/users', async (req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase.from('user_social_accounts').insert([req.body]).select();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data?.[0]);
});

app.get('/api/users/:id', async (req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase.from('user_social_accounts').select('*').eq('id', req.params.id).single();
  if (error) { res.status(404).json({ error: error.message }); return; }
  res.json(data);
});

app.put('/api/users/:id', async (req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase.from('user_social_accounts').update(req.body).eq('id', req.params.id).select();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data?.[0]);
});

app.delete('/api/users/:id', async (req: Request, res: Response): Promise<void> => {
  const { error } = await supabase.from('user_social_accounts').delete().eq('id', req.params.id);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(204).send();
});

// --- PROJECT CRUD (projects table, user-scoped) ---
app.get('/api/projects', requireSupabaseUser, async (req: Request, res: Response): Promise<void> => {
  const userId = req.supabaseUser.id;
  const { data, error } = await supabase.from('projects').select('*').eq('user_id', userId);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

app.post('/api/projects', requireSupabaseUser, async (req: Request, res: Response): Promise<void> => {
  const userId = req.supabaseUser.id;
  const { name } = req.body;
  const { data, error } = await supabase.from('projects').insert([{ name, user_id: userId }]).select();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data?.[0]);
});

app.get('/api/projects/:id', requireSupabaseUser, async (req: Request, res: Response): Promise<void> => {
  const userId = req.supabaseUser.id;
  const { data, error } = await supabase.from('projects').select('*').eq('id', req.params.id).eq('user_id', userId).single();
  if (error) { res.status(404).json({ error: error.message }); return; }
  res.json(data);
});

app.put('/api/projects/:id', requireSupabaseUser, async (req: Request, res: Response): Promise<void> => {
  const userId = req.supabaseUser.id;
  const { data, error } = await supabase.from('projects').update(req.body).eq('id', req.params.id).eq('user_id', userId).select();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data?.[0]);
});

app.delete('/api/projects/:id', requireSupabaseUser, async (req: Request, res: Response): Promise<void> => {
  const userId = req.supabaseUser.id;
  // Delete all assets for this project and user
  await supabase.from('assets').delete().eq('project_id', req.params.id).eq('user_id', userId);
  // Delete the project
  const { error } = await supabase.from('projects').delete().eq('id', req.params.id).eq('user_id', userId);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(204).send();
});

// --- ASSET CRUD (assets table, user-scoped) ---
app.get('/api/projects/:projectId/assets', requireSupabaseUser, async (req: Request, res: Response): Promise<void> => {
  const userId = req.supabaseUser.id;
  const { data, error } = await supabase.from('assets').select('*').eq('project_id', req.params.projectId).eq('user_id', userId);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

app.post('/api/projects/:projectId/assets', requireSupabaseUser, async (req: Request, res: Response): Promise<void> => {
  const userId = req.supabaseUser.id;
  const { name, file_url, type, status } = req.body;
  const { data, error } = await supabase.from('assets').insert([{ name, file_url, type, status, project_id: req.params.projectId, user_id: userId }]).select();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data?.[0]);
});

app.delete('/api/assets/:id', requireSupabaseUser, async (req: Request, res: Response): Promise<void> => {
  const userId = req.supabaseUser.id;
  // Only delete if asset belongs to user
  const { data: asset, error: findError } = await supabase.from('assets').select('*').eq('id', req.params.id).eq('user_id', userId).single();
  if (findError || !asset) { res.status(404).json({ error: 'Asset not found or not authorized' }); return; }
  const { error } = await supabase.from('assets').delete().eq('id', req.params.id).eq('user_id', userId);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(204).send();
});

app.get('/api/protected', requireSupabaseUser, (req: Request, res: Response) => {
  res.send('This is a protected route for user: ' + req.supabaseUser.email);
});

app.use('/api', geminiRoutes);
app.use('/api/media', mediaRoutes);

// --- TEMPORARY: Supabase DB Connection Test Route ---
app.get('/api/test-supabase', async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase.from('assets').select('*').limit(1);
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ data });
  } catch (err) {
    // Type guard for error
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'Unknown error' });
    }
  }
});
// --- END TEMPORARY TEST ROUTE ---

app.get('/', (req: Request, res: Response) => { res.send('API running!'); });
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

