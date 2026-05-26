import { getUserIdFromReq } from '../../../lib/auth';
import { getServerSupabase } from '../../../lib/supabaseServer';
import { getCurrentCycleDate } from '../../../lib/time';

// Deterministic shuffle seeded by string (user_id + date)
// so a given user sees the same order across page loads.
function seededShuffle(arr, seed) {
  const result = [...arr];
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) >>> 0;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default async function handler(req, res) {
  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: 'Not logged in' });

  const supabase = getServerSupabase();
  const today = getCurrentCycleDate();

  // All yesterday photos with uploader name
  const { data: photos } = await supabase
    .from('photos')
    .select('id, user_id, image_url, vote_count, has_applied_sticker, users(name)')
    .eq('status', 'yesterday');

  // Current user's votes today
  const { data: myVotes } = await supabase
    .from('votes')
    .select('photo_id, created_at')
    .eq('voter_id', userId)
    .eq('vote_date', today);

  const votedPhotoIds = (myVotes || []).map(v => v.photo_id);

  // Shape data: hide vote_count unless it's user's own photo
  const shaped = (photos || []).map(p => ({
    id: p.id,
    image_url: p.image_url,
    uploader_name: p.users?.name || 'Unknown',
    uploader_id: p.user_id,
    has_applied_sticker: p.has_applied_sticker,
    is_own: p.user_id === userId,
    vote_count: p.user_id === userId ? p.vote_count : null,
    i_voted: votedPhotoIds.includes(p.id),
  }));

  const shuffled = seededShuffle(shaped, `${userId}-${today}`);

  res.json({
    photos: shuffled,
    votes_used: (myVotes || []).length,
    votes_max: 2,
  });
}
