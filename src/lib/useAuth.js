import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isCrownHolder, setIsCrownHolder] = useState(false);
  const [todaySticker, setTodaySticker] = useState('A');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Trigger cycle check on every page load (self-healing)
    fetch('/api/cycle/check').catch(() => {});

    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (!d.user) {
          router.replace('/login');
        } else {
          setUser(d.user);
          setIsCrownHolder(d.isCrownHolder);
          setTodaySticker(d.todaySticker);
        }
        setLoading(false);
      });
  }, [router]);

  return { user, isCrownHolder, todaySticker, loading };
}

export async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login';
}
