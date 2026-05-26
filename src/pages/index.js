import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Index() {
  const router = useRouter();
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.user) router.replace('/today');
        else router.replace('/login');
      });
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-4xl font-display tracking-widest text-orange-500 animate-pulse">FIREPHOTOS</div>
    </div>
  );
}
