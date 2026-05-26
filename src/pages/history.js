import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import PhotoViewer from '../components/PhotoViewer';
import { useAuth } from '../lib/useAuth';
import { formatDateLabel, formatTime } from '../lib/time';

export default function History() {
  const { user, loading } = useAuth();
  const [history, setHistory] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [viewerSrc, setViewerSrc] = useState(null);
  const [viewerName, setViewerName] = useState('');

  useEffect(() => {
    if (user) {
      fetch('/api/photos/history').then(r => r.json()).then(d => setHistory(d.history));
    }
  }, [user]);

  function toggle(date) {
    setExpanded(prev => ({ ...prev, [date]: !prev[date] }));
  }

  if (loading || !user) return <Layout><div className="p-6 text-zinc-500">Loading...</div></Layout>;

  return (
    <Layout hideNav={!!viewerSrc}>
      <div className="px-5 pt-6">
        <h1 className="font-display text-4xl tracking-wider mb-1">📚 History</h1>
        <p className="text-zinc-500 text-sm mb-6">Every photo, every day.</p>

        {history.length === 0 && (
          <div className="text-zinc-500 text-center py-12">No archived photos yet.</div>
        )}

        <div className="space-y-3">
          {history.map(group => (
            <div key={group.date} className="border border-zinc-800 rounded-xl overflow-hidden">
              <button
                onClick={() => toggle(group.date)}
                className="w-full px-4 py-3 flex justify-between items-center bg-zinc-900 active:bg-zinc-800"
              >
                <span className="font-display text-lg tracking-wider">{formatDateLabel(group.date)}</span>
                <span className="text-zinc-500 text-sm">
                  {group.photos.length} photos {expanded[group.date] ? '▲' : '▼'}
                </span>
              </button>
              {expanded[group.date] && (
                <div className="p-3 grid grid-cols-2 gap-2">
                  {group.photos.map(p => (
                    <div
                      key={p.id}
                      className="relative cursor-pointer"
                      onClick={() => {
                        setViewerSrc(p.image_url);
                        setViewerName(`${group.date}-${p.uploader_name}.jpg`);
                      }}
                    >
                      <img src={p.image_url} alt="" className="w-full aspect-square object-cover rounded-lg" />
                      {p.won && (
                        <div className="absolute top-1 left-1 bg-yellow-500 text-black px-1.5 py-0.5 rounded text-xs font-bold">🏆</div>
                      )}
                      <div className="absolute bottom-1 left-1 right-1 bg-black/70 px-1.5 py-0.5 rounded text-xs">
                        <div className="font-semibold truncate">{p.uploader_name}</div>
                        <div className="text-zinc-400">{formatTime(p.uploaded_at)} • {p.vote_count} 🔥</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
