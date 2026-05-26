// DEV ONLY - REMOVE BEFORE PRODUCTION
import { getUserIdFromReq } from '../../../lib/auth';
import { getServerSupabase } from '../../../lib/supabaseserver';

export default async function handler(req, res) {
  if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true') {
    return res.status(403).json({ error: 'Dev mode disabled' });
  }
  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: 'Not logged in' });

  const supabase = getServerSupabase();

  // Find current max wins and set this user one above
  const { data: top } = await supabase
    .from('users')
    .select('total_wins')
    .order('total_wins', { ascending: false })
    .limit(1)
    .maybeSingle();

  const newWins = (top?.total_wins || 0) + 1;
  await supabase
    .from('users')
    .update({ total_wins: newWins, last_win_at: new Date().toISOString() })
    .eq('id', userId);

  res.json({ ok: true, total_wins: newWins });
}
