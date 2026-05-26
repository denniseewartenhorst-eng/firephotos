import { useEffect, useState } from 'react';

export default function PhotoViewer({ src, filename = 'firephotos.jpg', onClose }) {
  const [busy, setBusy] = useState(false);

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

  async function save() {
    setBusy(true);
    try {
      const r = await fetch(src, { mode: 'cors' });
      const blob = await r.blob();
      const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });

      // Prefer Web Share API on mobile - on iOS this gives "Save Image" → Photos library
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
          setBusy(false);
          return;
        } catch (shareErr) {
          // User cancelled the share sheet - that's fine, don't fall through
          if (shareErr.name === 'AbortError') {
            setBusy(false);
            return;
          }
          // Other error - fall through to download
        }
      }

      // Fallback for desktop / older browsers: trigger normal download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      // Last resort: open in new tab so user can long-press
      window.open(src, '_blank');
    } finally {
      setBusy(false);
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
          onClick={save}
          disabled={busy}
          className="w-10 h-10 bg-zinc-900/80 rounded-full flex items-center justify-center text-white text-xl active:bg-zinc-800 disabled:opacity-50"
          aria-label="Save to Photos"
        >
          {busy ? '…' : '⬇'}
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
      <div className="text-center text-zinc-500 text-xs pb-4">
        Tap ⬇ to save to your Photos
      </div>
    </div>
  );
}
