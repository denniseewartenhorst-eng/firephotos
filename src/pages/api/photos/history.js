import { getUserIdFromReq } from '../../../lib/auth';
import { getServerSupabase } from '../../../lib/supabaseServer';

export default async function handler(req, res) {
  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: 'Not logged in' });

  const supabase = getServerSupabase();
  const { data: photos } = await supabase
    .from('photos')
    .select('id, image_url, upload_date, uploaded_at, vote_count, won_photo_of_the_day, users(name)')
    .eq('status', 'archived')
    .order('upload_date', { ascending: false })
    .order('uploaded_at', { ascending: true });

  // Group by date
  const groups = {};
  for (const p of photos || []) {
    if (!groups[p.upload_date]) groups[p.upload_date] = [];
    groups[p.upload_date].push({
      id: p.id,
      image_url: p.image_url,
      uploader_name: p.users?.name,
      uploaded_at: p.uploaded_at,
      vote_count: p.vote_count,
      won: p.won_photo_of_the_day,
    });
  }

  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));
  const result = sortedDates.map(date => ({ date, photos: groups[date] }));

  res.json({ history: result });
}
