import { getUserIdFromReq } from '../../../lib/auth';
import { getServerSupabase } from '../../../lib/supabaseServer';
import { getCrownHolderId } from '../../../lib/cycle';

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: 'Not logged in' });

  const { photoId, imageBase64 } = req.body || {};
  if (!photoId || !imageBase64) return res.status(400).json({ error: 'Missing data' });

  const devMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
  const crownId = await getCrownHolderId();
  if (crownId !== userId && !devMode) {
    return res.status(403).json({ error: 'Only crown holder can apply stickers' });
  }

  const supabase = getServerSupabase();

  const { data: photo } = await supabase
    .from('photos')
    .select('*')
    .eq('id', photoId)
    .eq('status', 'yesterday')
    .maybeSingle();

  if (!photo) return res.status(404).json({ error: 'Photo not found' });
  if (photo.has_applied_sticker) {
    return res.status(400).json({ error: 'Sticker already applied to this photo' });
  }

  // Upload new composited image, replace old
  const matches = imageBase64.match(/^data:(image\/[a-z+]+);base64,(.+)$/);
  if (!matches) return res.status(400).json({ error: 'Invalid image format' });
  const mime = matches[1];
  const buffer = Buffer.from(matches[2], 'base64');

  // Overwrite the existing file (upsert)
  const { error: upErr } = await supabase.storage
    .from('photos')
    .upload(photo.storage_path, buffer, { contentType: mime, upsert: true });

  if (upErr) {
    console.error(upErr);
    return res.status(500).json({ error: 'Upload failed' });
  }

  // Add cache-buster to URL so clients re-fetch
  const newUrl = photo.image_url.split('?')[0] + `?v=${Date.now()}`;

  await supabase
    .from('photos')
    .update({ image_url: newUrl, has_applied_sticker: true })
    .eq('id', photoId);

  res.json({ ok: true, image_url: newUrl });
}
