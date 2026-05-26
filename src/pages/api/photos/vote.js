import { getUserIdFromReq } from '../../../lib/auth';
import { getServerSupabase } from '../../../lib/supabaseserver';
import { getCurrentCycleDate } from '../../../lib/time';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: 'Not logged in' });

  const { photoId, allowSelf } = req.body || {};
  if (!photoId) return res.status(400).json({ error: 'Missing photoId' });

  const supabase = getServerSupabase();

  // Block spectators from voting
  const { data: voter } = await supabase
    .from('users')
    .select('is_spectator')
    .eq('id', userId)
    .maybeSingle();
  if (!voter || voter.is_spectator) {
    return res.status(403).json({ error: 'Spectators cannot vote' });
  }

  const today = getCurrentCycleDate();

  const { data: photo } = await supabase
    .from('photos')
    .select('*')
    .eq('id', photoId)
    .eq('status', 'yesterday')
    .maybeSingle();

  if (!photo) return res.status(404).json({ error: 'Photo not found in current feed' });

  const devMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
  if (photo.user_id === userId && !(devMode && allowSelf)) {
    return res.status(400).json({ error: "Can't vote on your own photo" });
  }

  const { data: myVotes } = await supabase
    .from('votes')
    .select('*')
    .eq('voter_id', userId)
    .eq('vote_date', today)
    .order('created_at', { ascending: true });

  const existingVote = (myVotes || []).find(v => v.photo_id === Number(photoId));
  if (existingVote) {
    await supabase.from('votes').delete().eq('id', existingVote.id);
    await supabase
      .from('photos')
      .update({ vote_count: Math.max(0, photo.vote_count - 1) })
      .eq('id', photoId);
    return res.json({ action: 'removed' });
  }

  let removedFromName = null;
  if ((myVotes || []).length >= 2) {
    const oldest = myVotes[0];
    await supabase.from('votes').delete().eq('id', oldest.id);
    const { data: oldPhoto } = await supabase
      .from('photos')
      .select('vote_count, users(name)')
      .eq('id', oldest.photo_id)
      .maybeSingle();
    if (oldPhoto) {
      await supabase
        .from('photos')
        .update({ vote_count: Math.max(0, oldPhoto.vote_count - 1) })
        .eq('id', oldest.photo_id);
      removedFromName = oldPhoto.users?.name;
    }
  }

  await supabase.from('votes').insert({
    voter_id: userId,
    photo_id: Number(photoId),
    vote_date: today,
  });
  await supabase
    .from('photos')
    .update({ vote_count: photo.vote_count + 1 })
    .eq('id', photoId);

  res.json({ action: removedFromName ? 'reassigned' : 'added', removedFromName });
}
