import { getUserIdFromReq } from '../../../lib/auth';
import { getServerSupabase } from '../../../lib/supabaseServer';
import { getCrownHolderId, getTodaySticker } from '../../../lib/cycle';

export default async function handler(req, res) {
  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ user: null });

  const supabase = getServerSupabase();
  const { data: user } = await supabase
    .from('users')
    .select('id, name, total_wins, is_spectator')
    .eq('id', userId)
    .maybeSingle();

  if (!user) return res.status(401).json({ user: null });

  const crownHolderId = await getCrownHolderId();

  // Get crown holder name for button label
  let crownHolderName = null;
  if (crownHolderId) {
    const { data: ch } = await supabase
      .from('users')
      .select('name')
      .eq('id', crownHolderId)
      .maybeSingle();
    crownHolderName = ch?.name || null;
  }

  const sticker = await getTodaySticker();

  res.json({
    user,
    isCrownHolder: crownHolderId === user.id && !user.is_spectator,
    crownHolderName,
    todaySticker: sticker,
  });
}
