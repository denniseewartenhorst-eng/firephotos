import { getUserIdFromReq } from '../../../lib/auth';
import { getServerSupabase } from '../../../lib/supabaseServer';

export default async function handler(req, res) {
  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: 'Not logged in' });

  const supabase = getServerSupabase();

  if (req.method === 'GET') {
    // Filter by status='today' so old photos disappear after a cycle, even if
    // the calendar date hasn't actually changed (relevant for dev Skip Day).
    const { data } = await supabase
      .from('photos')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'today')
      .order('uploaded_at', { ascending: true });
    return res.json({ photos: data || [] });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing id' });

    const { data: photo } = await supabase
      .from('photos')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .eq('status', 'today')
      .maybeSingle();

    if (!photo) return res.status(404).json({ error: 'Photo not found' });

    await supabase.storage.from('photos').remove([photo.storage_path]);
    await supabase.from('photos').delete().eq('id', id);
    return res.json({ ok: true });
  }

  res.status(405).end();
}
