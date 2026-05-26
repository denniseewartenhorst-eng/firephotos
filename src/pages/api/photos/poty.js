import { getUserIdFromReq } from '../../../lib/auth';
import { getServerSupabase } from '../../../lib/supabaseserver';

export default async function handler(req, res) {
  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: 'Not logged in' });

  const supabase = getServerSupabase();
  const { data: cycles } = await supabase
    .from('day_cycles')
    .select('date, photo_of_the_day_id, photos:photo_of_the_day_id(id, image_url, vote_count, users(name))')
    .not('photo_of_the_day_id', 'is', null)
    .order('date', { ascending: false });

  const list = (cycles || []).map(c => ({
    date: c.date,
    image_url: c.photos?.image_url,
    uploader_name: c.photos?.users?.name,
    vote_count: c.photos?.vote_count,
  }));

  res.json({ winners: list });
}
