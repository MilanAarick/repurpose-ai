import { supabase } from './supabaseClient';

export async function uploadToSupabase(file: File, userId: string, projectId: string) {
  const filePath = `${userId}/${projectId}/${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage.from('assets').upload(filePath, file);
  if (error) throw error;
  // Get the public URL (or signed URL if private)
  const { data: urlData } = supabase.storage.from('assets').getPublicUrl(filePath);
  return urlData.publicUrl;
} 