// DEV ONLY - REMOVE BEFORE PRODUCTION
import { getServerSupabase } from '../../../lib/supabaseServer';
import { getCurrentCycleDate } from '../../../lib/time';
import { runCycleIfNeeded } from '../../../lib/cycle';

export default async function handler(req, res) {
  if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true') {
    return res.status(403).json({ error: 'Dev mode disabled' });
  }

  // Force a cycle run by deleting today's cycle record then re-running
  const supabase = getServerSupabase();
  const today = getCurrentCycleDate();
  await supabase.from('day_cycles').delete().eq('date', today);

  const result = await runCycleIfNeeded();
  res.json({ ok: true, ...result });
}
