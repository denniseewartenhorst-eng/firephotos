// Daily cycle logic. Called by /api/cycle/check on every app load.
// Self-healing: if no one opens the app at 07:00, the cycle runs on next load.
//
// Race condition protection: we insert the day_cycles row FIRST as a "lock".
// The UNIQUE(date) constraint means only one request can succeed if two run
// simultaneously - the other gets an error and bails before doing any work.

import { getServerSupabase } from './supabaseServer';
import { getCurrentCycleDate } from './time';

/**
 * Run the cycle if no cycle exists for today.
 * @param {object} opts
 * @param {'A'|'B'} [opts.forceSticker] - override sticker selection (used by dev tools).
 *   In production this is never used; the alternation is automatic.
 */
export async function runCycleIfNeeded(opts = {}) {
  const supabase = getServerSupabase();
  const today = getCurrentCycleDate();

  // 1. Bail early if a cycle for today already exists.
  const { data: existing } = await supabase
    .from('day_cycles')
    .select('id')
    .eq('date', today)
    .maybeSingle();

  if (existing) {
    return { ran: false, todayCycle: today };
  }

  // 2. Determine the new sticker BEFORE the lock insert.
  //    Look at the most recent PRIOR cycle (excluding today, in case of dev tools).
  let newSticker;
  if (opts.forceSticker === 'A' || opts.forceSticker === 'B') {
    newSticker = opts.forceSticker;
  } else {
    const { data: lastCycle } = await supabase
      .from('day_cycles')
      .select('sticker_of_the_day')
      .lt('date', today)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();
    // If no prior cycle exists, default to 'A'. Otherwise alternate.
    newSticker = lastCycle?.sticker_of_the_day === 'A' ? 'B' : 'A';
  }

  // 3. Insert as a lock. UNIQUE constraint on date prevents double-run.
  const { data: cycleRow, error: insErr } = await supabase
    .from('day_cycles')
    .insert({ date: today, sticker_of_the_day: newSticker })
    .select()
    .single();

  if (insErr) {
    // Another concurrent request won the race. Bail out cleanly.
    return { ran: false, todayCycle: today, raced: true };
  }

  // 4. We hold the lock now. Do the cycle work.

  // 4a. Find yesterday's winner (highest votes, earliest upload as tiebreak).
  const { data: yesterdayPhotos } = await supabase
    .from('photos')
    .select('id, user_id, vote_count')
    .eq('status', 'yesterday')
    .order('vote_count', { ascending: false })
    .order('uploaded_at', { ascending: true });

  let winnerId = null;
  if (yesterdayPhotos && yesterdayPhotos.length > 0 && yesterdayPhotos[0].vote_count > 0) {
    const winner = yesterdayPhotos[0];
    winnerId = winner.id;

    await supabase
      .from('photos')
      .update({ won_photo_of_the_day: true })
      .eq('id', winner.id);

    // Increment winner's total_wins (refetch to avoid stale-value race)
    const { data: uploader } = await supabase
      .from('users')
      .select('total_wins')
      .eq('id', winner.user_id)
      .single();

    await supabase
      .from('users')
      .update({
        total_wins: (uploader?.total_wins || 0) + 1,
        last_win_at: new Date().toISOString(),
      })
      .eq('id', winner.user_id);
  }

  // 4b. Archive yesterday → archived. (idempotent)
  await supabase.from('photos').update({ status: 'archived' }).eq('status', 'yesterday');

  // 4c. Promote today → yesterday. (idempotent)
  await supabase.from('photos').update({ status: 'yesterday' }).eq('status', 'today');

  // 4d. Wipe all votes (refresh everyone's 2 fires).
  await supabase.from('votes').delete().neq('id', 0);

  // 4e. Save winner reference on the cycle row.
  if (winnerId) {
    await supabase
      .from('day_cycles')
      .update({ photo_of_the_day_id: winnerId })
      .eq('id', cycleRow.id);
  }

  return { ran: true, todayCycle: today, winnerId, sticker: newSticker };
}

export async function getCrownHolderId() {
  const supabase = getServerSupabase();
  const { data: users } = await supabase
    .from('users')
    .select('id, total_wins, last_win_at')
    .eq('is_spectator', false)
    .gt('total_wins', 0)
    .order('total_wins', { ascending: false })
    .order('last_win_at', { ascending: false })
    .limit(1);
  return users && users.length > 0 ? users[0].id : null;
}

export async function getTodaySticker() {
  const supabase = getServerSupabase();
  const today = getCurrentCycleDate();
  const { data: cycle } = await supabase
    .from('day_cycles')
    .select('sticker_of_the_day')
    .eq('date', today)
    .maybeSingle();
  return cycle?.sticker_of_the_day || 'A';
}
