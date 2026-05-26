import { runCycleIfNeeded } from '../../../lib/cycle';

export default async function handler(req, res) {
  try {
    const result = await runCycleIfNeeded();
    res.json(result);
  } catch (e) {
    console.error('Cycle error:', e);
    res.status(500).json({ error: 'Cycle failed' });
  }
}
