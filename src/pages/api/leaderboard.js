import { getUserIdFromReq } from '../../lib/auth';
import { getServerSupabase } from '../../lib/supabaseServer';

export default async function handler(req, res) {
  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: 'Not logged in' });

  const supabase = getServerSupabase();
  const { data: users } = await supabase
    .from('users')
    .select('id, name, total_wins, last_win_at')
    .order('total_wins', { ascending: false })
    .order('last_win_at', { ascending: false, nullsFirst: false });

  res.json({ users: users || [] });
}
