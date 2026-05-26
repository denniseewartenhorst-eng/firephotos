import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../lib/useAuth';
import { formatDateLabel } from '../lib/time';

export default function POTY() {
  const { user, loading } = useAuth();
  const [winners, setWinners] = useState([]);

  useEffect(() => {
    if (user) {
      fetch('/api/photos/poty').then(r => r.json()).then(d => setWinners(d.winners));
    }
  }, [user]);

  if (loading || !user) return <Layout><div className="p-6 text-zinc-500">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="px-5 pt-6">
        <h1 className="font-display text-4xl tracking-wider mb-1">🏆 Top Photos</h1>
        <p className="text-zinc-500 text-sm mb-6">The daily winners.</p>

        {winners.length === 0 && (
          <div className="text-zinc-500 text-center py-12">No winners yet.</div>
        )}

        <div className="space-y-8">
          {winners.map(w => (
            <div key={w.date}>
              <div className="flex justify-between items-baseline mb-2">
                <h2 className="font-display text-xl tracking-wider text-orange-500">{formatDateLabel(w.date)}</h2>
                <span className="text-sm text-zinc-400">{w.vote_count} 🔥</span>
              </div>
              <img
                src={w.image_url}
                alt=""
                className="w-full rounded-xl savable-image"
              />
              <div className="text-zinc-400 text-sm mt-2">by {w.uploader_name}</div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
