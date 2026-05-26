// DEV ONLY - REMOVE BEFORE PRODUCTION
//
// In production, the cycle alternates sticker based on yesterday's sticker.
// In dev, we re-run on the same day repeatedly, so we need to explicitly
// alternate from TODAY's current sticker (if any) - otherwise we'd just
// keep producing the same sticker over and over.

import { getServerSupabase } from '../../../lib/supabaseserver';
import { getCurrentCycleDate } from '../../../lib/time';
import { runCycleIfNeeded } from '../../../lib/cycle';

export default async function handler(req, res) {
  if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true') {
    return res.status(403).json({ error: 'Dev mode disabled' });
  }

  const supabase = getServerSupabase();
  const today = getCurrentCycleDate();

  // Read current today sticker BEFORE deletion, so we can flip it.
  const { data: current } = await supabase
    .from('day_cycles')
    .select('sticker_of_the_day')
    .eq('date', today)
    .maybeSingle();

  // If there's a current sticker, flip it. Otherwise default to A.
  const nextSticker = current?.sticker_of_the_day === 'A' ? 'B'
                    : current?.sticker_of_the_day === 'B' ? 'A'
                    : 'A';

  // Delete today's cycle row so runCycleIfNeeded will run again.
  await supabase.from('day_cycles').delete().eq('date', today);

  const result = await runCycleIfNeeded({ forceSticker: nextSticker });
  res.json({ ok: true, ...result });
}
