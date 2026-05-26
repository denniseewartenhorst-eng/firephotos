import { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout';
import StickerEditor from '../components/StickerEditor';
import { useAuth } from '../lib/useAuth';

export default function Yesterday() {
  const { user, isSpectator, isCrownHolder, todaySticker, loading } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [votesUsed, setVotesUsed] = useState(0);
  const [toast, setToast] = useState('');
  const [editorPhoto, setEditorPhoto] = useState(null);

  async function load() {
    const r = await fetch('/api/photos/yesterday');
    if (r.ok) {
      const d = await r.json();
      setPhotos(d.photos);
      setVotesUsed(d.votes_used);
    }
  }

  useEffect(() => { if (user) load(); }, [user]);

  async function vote(photoId, allowSelf = false) {
    if (isSpectator) {
      setToast("Spectators can't vote");
      setTimeout(() => setToast(''), 2000);
      return;
    }
    const r = await fetch('/api/photos/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId, allowSelf }),
    });
    const d = await r.json();
    if (!r.ok) {
      setToast(d.error || 'Vote failed');
      setTimeout(() => setToast(''), 2000);
      return;
    }
    if (d.action === 'reassigned') {
      setToast(`Moved your fire from ${d.removedFromName}'s photo`);
      setTimeout(() => setToast(''), 2500);
    }
    await load();
  }

  const stickerUrl = todaySticker === 'A' ? '/sticker-a.png' : '/sticker-b.png';

  if (loading || !user) {
    return <Layout><div className="p-6 text-zinc-500">Loading...</div></Layout>;
  }

  if (photos.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
          <div className="text-6xl mb-4">🌫️</div>
          <div className="text-zinc-400 text-center">No photos from yesterday.<br/>Get uploading today!</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideNav={!!editorPhoto}>
      {!editorPhoto && (
        <div className="feed-container">
          {photos.map(p => (
            <PhotoCard
              key={p.id}
              photo={p}
              votesUsed={votesUsed}
              onVote={vote}
              isCrownHolder={isCrownHolder}
              isSpectator={isSpectator}
              onSticker={() => setEditorPhoto(p)}
            />
          ))}
        </div>
      )}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-sm px-4 py-2 rounded-full z-40 border border-zinc-700">
          {toast}
        </div>
      )}
      {editorPhoto && (
        <StickerEditor
          photo={editorPhoto}
          stickerUrl={stickerUrl}
          onClose={() => setEditorPhoto(null)}
          onApplied={() => {
            setEditorPhoto(null);
            load();
          }}
        />
      )}
    </Layout>
  );
}

function PhotoCard({ photo, votesUsed, onVote, isCrownHolder, isSpectator, onSticker }) {
  const lastTap = useRef(0);
  const [showFire, setShowFire] = useState(false);

  function handleTap() {
    if (isSpectator) return;
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setShowFire(true);
      setTimeout(() => setShowFire(false), 800);
      onVote(photo.id);
    }
    lastTap.current = now;
  }

  return (
    <div className="feed-card relative h-screen w-screen flex items-center justify-center bg-black" onClick={handleTap}>
      <img
        src={photo.image_url}
        alt=""
        className="max-w-full max-h-full object-contain savable-image"
        style={{ maxHeight: '100dvh' }}
      />

      <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start gap-2 bg-gradient-to-b from-black/70 to-transparent z-10 no-tap-callout">
        <div className="flex items-center gap-2 flex-shrink min-w-0">
          <span className="font-display text-xl tracking-wider text-white truncate">{photo.uploader_name}</span>
          {photo.i_voted && <span className="text-orange-500 flex-shrink-0">🔥</span>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isCrownHolder && !photo.has_applied_sticker && (
            <button
              onClick={(e) => { e.stopPropagation(); onSticker(); }}
              className="px-3 py-1.5 bg-yellow-500 text-black rounded-full text-[10px] font-bold uppercase tracking-wider"
            >
              👑 ADD YUFANG
            </button>
          )}
          {!isSpectator && (
            <div className="flex gap-1 bg-black/50 px-3 py-1.5 rounded-full">
              <span className={votesUsed >= 1 ? 'opacity-30' : ''}>🔥</span>
              <span className={votesUsed >= 2 ? 'opacity-30' : ''}>🔥</span>
            </div>
          )}
          {isSpectator && (
            <div className="bg-black/50 px-3 py-1.5 rounded-full text-xs">👁️</div>
          )}
        </div>
      </div>

      {photo.is_own && (
        <div className="absolute bottom-6 right-4 bg-black/60 px-3 py-1 rounded-full text-sm z-10">
          {photo.vote_count} 🔥
        </div>
      )}

      {showFire && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="text-9xl fire-pop">🔥</div>
        </div>
      )}
    </div>
  );
}
