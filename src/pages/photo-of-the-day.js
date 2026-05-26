import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import PhotoViewer from '../components/PhotoViewer';
import { useAuth } from '../lib/useAuth';
import { formatDateLabel } from '../lib/time';

export default function POTY() {
  const { user, loading } = useAuth();
  const [winners, setWinners] = useState([]);
  const [viewerSrc, setViewerSrc] = useState(null);
  const [viewerName, setViewerName] = useState('');

  useEffect(() => {
    if (user) {
      fetch('/api/photos/poty').then(r => r.json()).then(d => setWinners(d.winners));
    }
  }, [user]);

  if (loading || !user) return <Layout><div className="p-6 text-zinc-500">Loading...</div></Layout>;

  return (
    <Layout hideNav={!!viewerSrc}>
      <div className="px-5 pt-6">
        <h1 className="font-display text-4xl tracking-wider mb-1">🏆 Top Photos</h1>
        <p className="text-zinc-500 text-sm mb-6">One winner per day. Scroll back through time.</p>

        {winners.length === 0 && (
          <div className="text-zinc-500 text-center py-12">
            <div className="text-5xl mb-3">🏆</div>
            No winners yet.<br/>
            <span className="text-xs">The first one is crowned tomorrow at 07:00.</span>
          </div>
        )}

        <div className="space-y-6">
          {winners.map(w => (
            <div key={w.date} className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950">
              {/* Date header bar - matches History styling */}
              <div className="px-4 py-3 bg-zinc-900 flex justify-between items-center">
                <span className="font-display text-lg tracking-wider text-orange-500">
                  {formatDateLabel(w.date)}
                </span>
                <span className="text-sm text-zinc-400">{w.vote_count} 🔥</span>
              </div>
              {/* The winner photo */}
              <img
                src={w.image_url}
                alt=""
                onClick={() => {
                  setViewerSrc(w.image_url);
                  setViewerName(`top-${w.date}-${w.uploader_name}.jpg`);
                }}
                className="w-full cursor-pointer"
              />
              <div className="px-4 py-2 text-zinc-400 text-sm">by {w.uploader_name}</div>
            </div>
          ))}
        </div>
      </div>

      {viewerSrc && (
        <PhotoViewer
          src={viewerSrc}
          filename={viewerName}
          onClose={() => setViewerSrc(null)}
        />
      )}
    </Layout>
  );
}
