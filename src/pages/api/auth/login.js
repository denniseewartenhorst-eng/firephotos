import bcrypt from 'bcryptjs';
import { getServerSupabase } from '../../../lib/supabaseserver';
import { setSessionCookie } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, password } = req.body || {};
  if (!name || !password) {
    return res.status(400).json({ error: 'Name and password are required' });
  }

  const cleanName = String(name).trim();
  const supabase = getServerSupabase();

  // Find user (case-insensitive name match)
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .ilike('name', cleanName)
    .maybeSingle();

  if (!user || user.is_spectator) {
    // Don't reveal whether user exists; also block spectator login via this endpoint
    return res.status(401).json({ error: 'Invalid name or password' });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid name or password' });
  }

  setSessionCookie(res, user.id);
  return res.json({ user: { id: user.id, name: user.name } });
}
