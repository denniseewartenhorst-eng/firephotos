import { getUserIdFromReq } from '../../../lib/auth';
import { getServerSupabase } from '../../../lib/supabaseServer';
import { getCurrentCycleDate } from '../../../lib/time';

export default async function handler(req, res) {
  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: 'Not logged in' });

  const supabase = getServerSupabase();
  const today = getCurrentCycleDate();

  if (req.method === 'GET') {
    const { data } = await supabase
      .from('photos')
      .select('*')
      .eq('user_id', userId)
      .eq('upload_date', today)
      .order('uploaded_at', { ascending: true });
    return res.json({ photos: data || [] });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing id' });

    // Only allow deleting own today photo
    const { data: photo } = await supabase
      .from('photos')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .eq('status', 'today')
      .maybeSingle();

    if (!photo) return res.status(404).json({ error: 'Photo not found' });

    // Delete from storage
    await supabase.storage.from('photos').remove([photo.storage_path]);
    await supabase.from('photos').delete().eq('id', id);
    return res.json({ ok: true });
  }

  res.status(405).end();
}
