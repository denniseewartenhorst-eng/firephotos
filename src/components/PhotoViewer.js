import { useEffect } from 'react';

export default function PhotoViewer({ src, filename = 'firephotos.jpg', onClose }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  async function download() {
    try {
      const r = await fetch(src, { mode: 'cors' });
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      // Fallback - open in new tab
      window.open(src, '_blank');
    }
  }

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col" style={{ touchAction: 'none' }}>
      <div className="flex justify-between items-center p-4 z-10">
        <button
          onClick={onClose}
          className="w-10 h-10 bg-zinc-900/80 rounded-full flex items-center justify-center text-white text-xl active:bg-zinc-800"
          aria-label="Close"
        >
          ✕
        </button>
        <button
          onClick={download}
          className="w-10 h-10 bg-zinc-900/80 rounded-full flex items-center justify-center text-white text-xl active:bg-zinc-800"
          aria-label="Download"
        >
          ⬇
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
        <img
          src={src}
          alt=""
          className="max-w-full max-h-full object-contain savable-image"
          style={{ maxHeight: 'calc(100dvh - 100px)' }}
        />
      </div>
    </div>
  );
}
