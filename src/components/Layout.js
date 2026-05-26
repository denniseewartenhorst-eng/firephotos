import Link from 'next/link';
import { useRouter } from 'next/router';

const TABS = [
  { href: '/today', label: 'Today', icon: '📷' },
  { href: '/yesterday', label: 'Yesterday', icon: '🔥' },
  { href: '/photo-of-the-day', label: 'Top', icon: '🏆' },
  { href: '/history', label: 'History', icon: '📚' },
  { href: '/leaderboard', label: 'Board', icon: '👑' },
];

export default function Layout({ children, hideNav = false }) {
  const router = useRouter();
  const devMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
  const tabs = devMode ? [...TABS, { href: '/dev', label: 'DEV', icon: '⚙️' }] : TABS;

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {children}
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 z-50">
          <div className="flex justify-around items-center" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            {tabs.map(tab => {
              const active = router.pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex flex-col items-center py-2 px-2 flex-1 ${active ? 'text-orange-500' : 'text-zinc-500'}`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span className="text-[10px] mt-0.5 uppercase tracking-wider">{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
