import { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout';
import { useAuth, logout } from '../lib/useAuth';
import { millisecondsUntilNext7am } from '../lib/time';
import imageCompression from 'browser-image-compression';

export default function Today() {
  const { user, isSpectator, loading } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [countdown, setCountdown] = useState('');
  const cameraRef = useRef(null);
  const libraryRef = useRef(null);

  async function load() {
    const r = await fetch('/api/photos/today');
    if (r.ok) {
      const d = await r.json();
      setPhotos(d.photos);
    }
  }

  useEffect(() => {
    if (user) load();
  }, [user]);

  useEffect(() => {
    function tick() {
      const ms = millisecondsUntilNext7am();
      const totalSec = Math.floor(ms / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      setCountdown(`${h}h ${m}m ${s}s`);
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = rej;
        r.readAsDataURL(compressed);
      });
      const res = await fetch('/api/photos/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      const d = await res.json();
      if (!res.ok) alert(d.error || 'Upload failed');
      else await load();
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      if (cameraRef.current) cameraRef.current.value = '';
      if (libraryRef.current) libraryRef.current.value = '';
    }
  }

  async function deletePhoto(id) {
    if (!confirm('Delete this photo?')) return;
    await fetch(`/api/photos/today?id=${id}`, { method: 'DELETE' });
    await load();
  }

  if (loading || !user) {
    return <Layout><div className="p-6 text-zinc-500">Loading...</div></Layout>;
  }

  // Spectator view of "Today"
  if (isSpectator) {
    return (
      <Layout>
        <div className="px-5 pt-6">
          <div className="flex justify-between items-center mb-1">
            <div>
              <div className="text-zinc-500 text-xs uppercase tracking-widest">Mode</div>
              <div className="text-2xl font-display tracking-wide">👁️ Spectator</div>
            </div>
            <button onClick={logout} className="text-xs text-zinc-500 underline">Log out</button>
          </div>
          <div className="mt-12 text-center">
            <div className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Reveal in</div>
            <div className="text-3xl font-display tracking-widest text-orange-500">{countdown}</div>
          </div>
          <p className="text-zinc-500 text-sm text-center mt-12">
            You're watching only. Head to Yesterday, Top, History, or Board to see the action.
          </p>
        </div>
      </Layout>
    );
  }

  const canUpload = photos.length < 3;

  return (
    <Layout>
      <div className="px-5 pt-6">
        <div className="flex justify-between items-center mb-1">
          <div>
            <div className="text-zinc-500 text-xs uppercase tracking-widest">Hello</div>
            <div className="text-2xl font-display tracking-wide">{user.name}</div>
          </div>
          <button onClick={logout} className="text-xs text-zinc-500 underline">Log out</button>
        </div>

        <div className="mt-8 mb-6 text-center">
          <div className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Reveal in</div>
          <div className="text-3xl font-display tracking-widest text-orange-500">{countdown}</div>
        </div>

        <div className="text-center mb-4">
          <div className="text-zinc-400 text-sm">{photos.length} / 3 uploaded today</div>
        </div>

        {canUpload && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => cameraRef.current?.click()}
              disabled={uploading}
              className="py-5 border-2 border-dashed border-orange-500 rounded-2xl text-orange-500 font-bold uppercase tracking-wider disabled:opacity-50 active:bg-orange-500/10 flex flex-col items-center gap-1"
            >
              <span className="text-2xl">📷</span>
              <span className="text-xs">{uploading ? '...' : 'Camera'}</span>
            </button>
            <button
              onClick={() => libraryRef.current?.click()}
              disabled={uploading}
              className="py-5 border-2 border-dashed border-zinc-600 rounded-2xl text-zinc-300 font-bold uppercase tracking-wider disabled:opacity-50 active:bg-zinc-800 flex flex-col items-center gap-1"
            >
              <span className="text-2xl">🖼️</span>
              <span className="text-xs">{uploading ? '...' : 'Library'}</span>
            </button>
          </div>
        )}
        {!canUpload && (
          <div className="text-center py-8 text-zinc-500 text-sm">
            All 3 slots used. Come back after 07:00.
          </div>
        )}

        {/* Camera input - forces back camera */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          className="hidden"
        />
        {/* Library input - opens photo library */}
        <input
          ref={libraryRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />

        <div className="grid grid-cols-3 gap-2 mt-6">
          {photos.map(p => (
            <div key={p.id} className="relative aspect-square">
              <img src={p.image_url} alt="" className="w-full h-full object-cover rounded-lg" />
              <button
                onClick={() => deletePhoto(p.id)}
                className="absolute top-1 right-1 w-7 h-7 bg-black/70 rounded-full text-white text-xs flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <p className="text-zinc-600 text-xs text-center mt-8 px-4">
          No one can see your uploads until 07:00. After that, today becomes yesterday's feed.
        </p>
      </div>
    </Layout>
  );
}
