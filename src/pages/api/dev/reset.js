// DEV ONLY - REMOVE BEFORE PRODUCTION
import { getServerSupabase } from '../../../lib/supabaseserver';

export default async function handler(req, res) {
  if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true') {
    return res.status(403).json({ error: 'Dev mode disabled' });
  }

  const supabase = getServerSupabase();

  // Get all storage paths to delete
  const { data: photos } = await supabase.from('photos').select('storage_path');
  const paths = (photos || []).map(p => p.storage_path).filter(Boolean);
  if (paths.length > 0) {
    await supabase.storage.from('photos').remove(paths);
  }

  await supabase.from('votes').delete().neq('id', 0);
  await supabase.from('day_cycles').delete().neq('id', 0);
  await supabase.from('photos').delete().neq('id', 0);
  await supabase.from('users').update({ total_wins: 0, last_win_at: null }).neq('id', 0);

  res.json({ ok: true });
}
