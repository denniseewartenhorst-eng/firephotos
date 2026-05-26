import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../lib/useAuth';

export default function Leaderboard() {
  const { user, loading } = useAuth();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (user) {
      fetch('/api/leaderboard').then(r => r.json()).then(d => setUsers(d.users));
    }
  }, [user]);

  if (loading || !user) return <Layout><div className="p-6 text-zinc-500">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="px-5 pt-6">
        <h1 className="font-display text-4xl tracking-wider mb-1">👑 Leaderboard</h1>
        <p className="text-zinc-500 text-sm mb-6">Most top photos wins.</p>

        <div className="space-y-2">
          {users.map((u, i) => (
            <div
              key={u.id}
              className={`flex items-center gap-3 p-3 rounded-xl border ${
                u.id === user.id ? 'border-orange-500 bg-orange-500/5' : 'border-zinc-800 bg-zinc-900'
              }`}
            >
              <span className="text-zinc-500 font-display text-xl w-7 text-center">{i + 1}</span>
              <div className="flex-1 flex items-center gap-2">
                <span className="font-semibold">{u.name}</span>
                {i === 0 && u.total_wins > 0 && <span className="text-lg">👑</span>}
              </div>
              <span className="text-orange-500 font-display text-xl tracking-wider">{u.total_wins}</span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
