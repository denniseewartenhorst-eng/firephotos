import { useState } from 'react';
import { useRouter } from 'next/router';

const ALLOWED_NAMES = [
  'Stef', 'Jonah', 'Liam', 'Levi', 'Dennis', 'Yufang', 'Jelte',
  'Anttoni', 'Merlijn', 'Thijs', 'Roald', 'Olivier', 'Stein', 'stijn'
];

export default function Login() {
  const [name, setName] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();
    if (!name) {
      setError('Please pick your name');
      return;
    }
    setError('');
    setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || 'Wrong passcode');
      return;
    }
    router.replace('/today');
  }

  async function spectatorLogin() {
    setError('');
    setLoading(true);
    const res = await fetch('/api/auth/spectator', { method: 'POST' });
    setLoading(false);
    if (!res.ok) {
      setError('Spectator mode unavailable');
      return;
    }
    router.replace('/yesterday');
  }

  return (
    <>
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
        <div className="mb-12 text-center">
          <h1 className="font-display text-7xl tracking-widest text-orange-500 leading-none">
            FIRE<br />PHOTOS
          </h1>
          <p className="text-zinc-500 mt-3 text-sm">Daily photos. Limited fires. One crown.</p>
        </div>

        <form onSubmit={submit} className="w-full max-w-xs space-y-3">

          {/* Name picker - tapping opens bottom sheet */}
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-left flex justify-between items-center active:border-orange-500"
          >
            <span className={name ? 'text-white' : 'text-zinc-500'}>
              {name || '— Pick your name —'}
            </span>
            <span className="text-zinc-400 ml-2">▼</span>
          </button>

          <input
            type="password"
            placeholder="Passcode"
            value={password}
            onChange={e => setPassword(e.target.value)}
            inputMode="numeric"
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
            required
          />

          {error && <div className="text-red-400 text-sm text-center">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-500 text-black font-bold rounded-lg disabled:opacity-50 active:bg-orange-600"
          >
            {loading ? '...' : 'Enter'}
          </button>
        </form>

        <div className="mt-8 w-full max-w-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-zinc-600 text-xs">OR</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>
          <button
            onClick={spectatorLogin}
            disabled={loading}
            className="w-full py-3 border border-zinc-700 text-zinc-300 rounded-lg disabled:opacity-50 active:bg-zinc-900"
          >
            👁️ Continue as Spectator
          </button>
          <p className="text-zinc-600 text-xs text-center mt-2">
            View only. No uploads, no votes.
          </p>
        </div>
      </div>

      {/* Bottom-sheet name picker */}
      {pickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/70"
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="w-full bg-zinc-900 rounded-t-3xl p-4 pb-8 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
          >
            <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-4" />
            <h3 className="font-display text-2xl tracking-wider text-center text-orange-500 mb-4">
              PICK YOUR NAME
            </h3>
            <div className="space-y-1">
              {ALLOWED_NAMES.map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setName(n);
                    setPickerOpen(false);
                  }}
                  className={`w-full px-4 py-4 text-left rounded-lg text-lg active:bg-zinc-700 ${
                    name === n ? 'bg-orange-500/20 text-orange-500 font-semibold' : 'bg-zinc-800 text-white'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPickerOpen(false)}
              className="w-full mt-4 py-3 text-zinc-500 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
