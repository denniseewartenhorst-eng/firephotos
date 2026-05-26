import bcrypt from 'bcryptjs';
import { getServerSupabase } from '../../../lib/supabaseServer';
import { setSessionCookie } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, password } = req.body || {};
  if (!name || !password) {
    return res.status(400).json({ error: 'Name and password are required' });
  }

  const cleanName = String(name).trim();
  if (cleanName.length < 1 || cleanName.length > 30) {
    return res.status(400).json({ error: 'Name must be 1-30 characters' });
  }

  const supabase = getServerSupabase();

  // Check if user exists
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('name', cleanName)
    .maybeSingle();

  if (existing) {
    // Login: verify password
    const ok = await bcrypt.compare(password, existing.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid name or password' });
    }
    setSessionCookie(res, existing.id);
    return res.json({ user: { id: existing.id, name: existing.name } });
  }

  // Register: create user
  const hash = await bcrypt.hash(password, 10);
  const { data: created, error } = await supabase
    .from('users')
    .insert({ name: cleanName, password_hash: hash })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: 'Could not create account' });
  }

  setSessionCookie(res, created.id);
  return res.json({ user: { id: created.id, name: created.name } });
}
