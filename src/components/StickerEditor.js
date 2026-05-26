import { useEffect, useRef, useState } from 'react';

export default function StickerEditor({ photo, stickerUrl, onClose, onApplied }) {
  const containerRef = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [applying, setApplying] = useState(false);

  const gestureRef = useRef(null);

  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        setContainerSize({ w: r.width, h: r.height });
        setPos({ x: r.width / 2, y: r.height / 2 });
      }
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Block page scroll while editor is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Attach native touch listeners with passive: false so preventDefault works on iOS
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onTouchStart(e) {
      e.preventDefault();
      if (e.touches.length === 1) {
        gestureRef.current = {
          type: 'drag',
          startX: e.touches[0].clientX - pos.x,
          startY: e.touches[0].clientY - pos.y,
        };
      } else if (e.touches.length === 2) {
        const [a, b] = e.touches;
        const dx = b.clientX - a.clientX;
        const dy = b.clientY - a.clientY;
        gestureRef.current = {
          type: 'pinch',
          startDist: Math.hypot(dx, dy),
          startAngle: Math.atan2(dy, dx),
          startScale: scale,
          startRotation: rotation,
        };
      }
    }

    function onTouchMove(e) {
      e.preventDefault();
      const g = gestureRef.current;
      if (!g) return;
      if (g.type === 'drag' && e.touches.length === 1) {
        setPos({
          x: e.touches[0].clientX - g.startX,
          y: e.touches[0].clientY - g.startY,
        });
      } else if (g.type === 'pinch' && e.touches.length === 2) {
        const [a, b] = e.touches;
        const dx = b.clientX - a.clientX;
        const dy = b.clientY - a.clientY;
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        setScale(Math.max(0.2, Math.min(4, g.startScale * (dist / g.startDist))));
        setRotation(g.startRotation + (angle - g.startAngle) * (180 / Math.PI));
      }
    }

    function onTouchEnd() {
      gestureRef.current = null;
    }

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [pos, scale, rotation]);

  async function apply() {
    setApplying(true);
    try {
      const photoImg = await loadImage(photo.image_url);
      const stickerImg = await loadImage(stickerUrl);

      const canvas = document.createElement('canvas');
      canvas.width = photoImg.naturalWidth;
      canvas.height = photoImg.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(photoImg, 0, 0);

      const photoAspect = photoImg.naturalWidth / photoImg.naturalHeight;
      const containerAspect = containerSize.w / containerSize.h;

      let displayedW, displayedH, offsetX, offsetY;
      if (photoAspect > containerAspect) {
        displayedW = containerSize.w;
        displayedH = containerSize.w / photoAspect;
        offsetX = 0;
        offsetY = (containerSize.h - displayedH) / 2;
      } else {
        displayedH = containerSize.h;
        displayedW = containerSize.h * photoAspect;
        offsetY = 0;
        offsetX = (containerSize.w - displayedW) / 2;
      }

      const scaleToPhoto = photoImg.naturalWidth / displayedW;
      const baseDisplaySize = containerSize.w * 0.3;
      const stickerSizeInPhoto = baseDisplaySize * scale * scaleToPhoto;
      const photoX = (pos.x - offsetX) * scaleToPhoto;
      const photoY = (pos.y - offsetY) * scaleToPhoto;

      const stickerAspect = stickerImg.naturalWidth / stickerImg.naturalHeight;
      const sW = stickerSizeInPhoto;
      const sH = stickerSizeInPhoto / stickerAspect;

      ctx.save();
      ctx.translate(photoX, photoY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(stickerImg, -sW / 2, -sH / 2, sW, sH);
      ctx.restore();

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

      const res = await fetch('/api/photos/sticker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: photo.id, imageBase64: dataUrl }),
      });
      const d = await res.json();
      if (!res.ok) {
        alert(d.error || 'Apply failed');
      } else {
        onApplied(d.image_url);
      }
    } catch (err) {
      alert('Failed: ' + err.message);
    } finally {
      setApplying(false);
    }
  }

  const stickerSize = containerSize.w * 0.3;

  return (
    <div
      className="fixed inset-0 bg-black z-[100] flex flex-col"
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
    >
      <div className="p-4 flex justify-between items-center bg-zinc-900">
        <button onClick={onClose} className="text-zinc-400">Cancel</button>
        <span className="text-sm text-zinc-400">Drag • Pinch • Rotate</span>
        <button onClick={apply} disabled={applying} className="text-orange-500 font-bold disabled:opacity-50">
          {applying ? '...' : 'Apply'}
        </button>
      </div>

      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-zinc-950"
        style={{ touchAction: 'none' }}
      >
        <img
          src={photo.image_url}
          alt=""
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
        />
        {containerSize.w > 0 && (
          <img
            src={stickerUrl}
            alt=""
            className="absolute pointer-events-none select-none"
            style={{
              left: pos.x,
              top: pos.y,
              width: stickerSize,
              transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
              transformOrigin: 'center',
            }}
            draggable={false}
          />
        )}
      </div>

      <div className="p-4 bg-zinc-900 flex justify-center gap-3">
        <button onClick={() => setRotation(r => r - 15)} className="px-4 py-2 bg-zinc-800 rounded text-lg">↺</button>
        <button onClick={() => setRotation(r => r + 15)} className="px-4 py-2 bg-zinc-800 rounded text-lg">↻</button>
        <button onClick={() => setScale(s => Math.max(0.2, s - 0.1))} className="px-4 py-2 bg-zinc-800 rounded text-lg">−</button>
        <button onClick={() => setScale(s => Math.min(4, s + 0.1))} className="px-4 py-2 bg-zinc-800 rounded text-lg">+</button>
      </div>
    </div>
  );
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
