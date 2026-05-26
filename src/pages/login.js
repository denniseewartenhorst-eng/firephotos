import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();
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
      setError(data.error || 'Login failed');
      return;
    }
    router.replace('/today');
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="mb-12 text-center">
        <h1 className="font-display text-7xl tracking-widest text-orange-500 leading-none">
          FIRE<br />PHOTOS
        </h1>
        <p className="text-zinc-500 mt-3 text-sm">Daily photos. Limited fires. One crown.</p>
      </div>

      <form onSubmit={submit} className="w-full max-w-xs space-y-3">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
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
        <p className="text-zinc-600 text-xs text-center pt-2">
          New name = new account. Remember your password.
        </p>
      </form>
    </div>
  );
}
