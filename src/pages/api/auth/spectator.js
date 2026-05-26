import { getServerSupabase } from '../../../lib/supabaseserver';
import { setSessionCookie } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const supabase = getServerSupabase();
  const { data: spectator } = await supabase
    .from('users')
    .select('id, name')
    .eq('is_spectator', true)
    .maybeSingle();

  if (!spectator) {
    return res.status(500).json({ error: 'Spectator account not set up' });
  }

  setSessionCookie(res, spectator.id);
  return res.json({ user: spectator });
}
