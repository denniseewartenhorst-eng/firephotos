import { getUserIdFromReq } from '../../../lib/auth';
import { getServerSupabase } from '../../../lib/supabaseServer';
import { getCurrentCycleDate } from '../../../lib/time';

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: 'Not logged in' });

  const { imageBase64 } = req.body || {};
  if (!imageBase64) return res.status(400).json({ error: 'No image' });

  const supabase = getServerSupabase();

  // Check spectator
  const { data: user } = await supabase
    .from('users')
    .select('is_spectator')
    .eq('id', userId)
    .maybeSingle();
  if (!user || user.is_spectator) {
    return res.status(403).json({ error: 'Spectators cannot upload' });
  }

  const today = getCurrentCycleDate();

  // Count only current-day's TODAY-status photos (this fixes the leftover-photos bug
  // after a manual day skip — old photos still have today's calendar date but status='yesterday')
  const { count } = await supabase
    .from('photos')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('upload_date', today)
    .eq('status', 'today');

  if ((count || 0) >= 3) {
    return res.status(400).json({ error: 'You already uploaded 3 photos today' });
  }

  const matches = imageBase64.match(/^data:(image\/[a-z+]+);base64,(.+)$/);
  if (!matches) return res.status(400).json({ error: 'Invalid image format' });
  const mime = matches[1];
  const ext = mime.split('/')[1].replace('jpeg', 'jpg');
  const buffer = Buffer.from(matches[2], 'base64');

  const filename = `${userId}/${today}/${Date.now()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from('photos')
    .upload(filename, buffer, { contentType: mime, upsert: false });

  if (upErr) {
    console.error(upErr);
    return res.status(500).json({ error: 'Upload failed' });
  }

  const { data: pub } = supabase.storage.from('photos').getPublicUrl(filename);

  const { data: photo, error: insErr } = await supabase
    .from('photos')
    .insert({
      user_id: userId,
      image_url: pub.publicUrl,
      storage_path: filename,
      upload_date: today,
      status: 'today',
    })
    .select()
    .single();

  if (insErr) return res.status(500).json({ error: 'DB insert failed' });
  res.json({ photo });
}
