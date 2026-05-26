// Daily cycle logic. Called by /api/cycle/check on every app load.
// Self-healing: if no one opens the app at 07:00, the cycle runs on next load.

import { getServerSupabase } from './supabaseServer';
import { getCurrentCycleDate, getPreviousCycleDate } from './time';

// Run the cycle if needed. Returns { ran: boolean, todayCycle: string }
export async function runCycleIfNeeded() {
  const supabase = getServerSupabase();
  const today = getCurrentCycleDate(); // The cycle currently "active" (today's batch is being uploaded)

  // Has a cycle record been created for today already?
  const { data: existing } = await supabase
    .from('day_cycles')
    .select('*')
    .eq('date', today)
    .maybeSingle();

  if (existing) {
    return { ran: false, todayCycle: today };
  }

  // We need to run the cycle. This means:
  //  - "yesterday" batch becomes "archived"
  //  - "today" batch becomes "yesterday"
  //  - new "today" cycle is recorded

  // 1. Find what was previously the yesterday batch and pick its winner
  //    The previous "yesterday" batch's upload_date is the date BEFORE the previous cycle ran.
  //    Easiest: among all photos with status='yesterday', pick the winner.
  const { data: yesterdayPhotos } = await supabase
    .from('photos')
    .select('*')
    .eq('status', 'yesterday')
    .order('vote_count', { ascending: false })
    .order('uploaded_at', { ascending: true });

  let winnerId = null;
  if (yesterdayPhotos && yesterdayPhotos.length > 0) {
    const topVotes = yesterdayPhotos[0].vote_count;
    if (topVotes > 0) {
      // First photo after sorting is the winner (highest votes, earliest upload as tiebreak)
      const winner = yesterdayPhotos[0];
      winnerId = winner.id;

      // Mark winner
      await supabase
        .from('photos')
        .update({ won_photo_of_the_day: true })
        .eq('id', winner.id);

      // Increment uploader's wins
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
  }

  // 2. Archive the old yesterday batch
  await supabase
    .from('photos')
    .update({ status: 'archived' })
    .eq('status', 'yesterday');

  // 3. Promote today batch to yesterday
  await supabase
    .from('photos')
    .update({ status: 'yesterday' })
    .eq('status', 'today');

  // 4. Wipe votes (fires refresh)
  await supabase.from('votes').delete().neq('id', 0);

  // 5. Determine today's sticker (alternates A/B)
  const { data: lastCycle } = await supabase
    .from('day_cycles')
    .select('sticker_of_the_day')
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  const newSticker = lastCycle?.sticker_of_the_day === 'A' ? 'B' : 'A';

  // 6. Record the new cycle
  await supabase.from('day_cycles').insert({
    date: today,
    photo_of_the_day_id: winnerId,
    sticker_of_the_day: newSticker,
  });

  return { ran: true, todayCycle: today, winnerId, sticker: newSticker };
}

// Get current crown holder (user with most wins, tiebreak by most recent win)
export async function getCrownHolderId() {
  const supabase = getServerSupabase();
  const { data: users } = await supabase
    .from('users')
    .select('id, total_wins, last_win_at')
    .gt('total_wins', 0)
    .order('total_wins', { ascending: false })
    .order('last_win_at', { ascending: false })
    .limit(1);
  return users && users.length > 0 ? users[0].id : null;
}

// Get today's sticker (A or B)
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
