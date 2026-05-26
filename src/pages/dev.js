// =====================================================
// === DEV TOOLS — REMOVE BEFORE PRODUCTION ===
// To remove: delete this file, the /api/dev folder,
// and set NEXT_PUBLIC_DEV_MODE=false in env vars.
// =====================================================
import { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../lib/useAuth';

export default function Dev() {
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState([]);

  if (loading || !user) return <Layout><div className="p-6 text-zinc-500">Loading...</div></Layout>;

  if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true') {
    return <Layout><div className="p-6 text-zinc-500">Dev mode disabled.</div></Layout>;
  }

  async function run(label, endpoint, opts = {}) {
    setBusy(true);
    setLog(l => [`▶ ${label}...`, ...l]);
    try {
      const r = await fetch(endpoint, { method: 'POST', ...opts });
      const d = await r.json();
      setLog(l => [`${r.ok ? '✓' : '✗'} ${label}: ${JSON.stringify(d)}`, ...l]);
    } catch (e) {
      setLog(l => [`✗ ${label}: ${e.message}`, ...l]);
    }
    setBusy(false);
  }

  return (
    <Layout>
      <div className="px-5 pt-6">
        <h1 className="font-display text-4xl tracking-wider mb-1 text-red-500">⚙️ DEV TOOLS</h1>
        <p className="text-zinc-500 text-sm mb-6">Remove before production. Set NEXT_PUBLIC_DEV_MODE=false.</p>

        <div className="space-y-3">
          <button
            onClick={() => run('Skip Day (run cycle)', '/api/dev/skip-day')}
            disabled={busy}
            className="w-full py-3 bg-orange-500 text-black font-bold rounded-lg disabled:opacity-50"
          >
            ⏩ Skip Day (run cycle now)
          </button>
          <button
            onClick={() => run('Force me as crown holder', '/api/dev/force-crown')}
            disabled={busy}
            className="w-full py-3 bg-yellow-500 text-black font-bold rounded-lg disabled:opacity-50"
          >
            👑 Make me crown holder
          </button>
          <button
            onClick={() => {
              if (confirm('Delete ALL data (photos, votes, users keep names but wins reset)?')) {
                run('Reset all data', '/api/dev/reset');
              }
            }}
            disabled={busy}
            className="w-full py-3 bg-red-600 text-white font-bold rounded-lg disabled:opacity-50"
          >
            🗑️ Reset all data
          </button>
        </div>

        <div className="mt-6 p-3 bg-zinc-900 rounded-lg text-xs font-mono space-y-1 max-h-80 overflow-y-auto">
          {log.length === 0 && <div className="text-zinc-600">No actions yet.</div>}
          {log.map((line, i) => <div key={i} className="text-zinc-300">{line}</div>)}
        </div>

        <p className="text-zinc-600 text-xs mt-6">
          <strong>Voting on own photos:</strong> in dev mode, the vote endpoint accepts an
          `allowSelf: true` flag. To enable from the feed, you'd need to modify the vote call.
          For now, you can simulate this by registering a second account and voting from there.
        </p>
      </div>
    </Layout>
  );
}
