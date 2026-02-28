import React, { useEffect, useRef, useState } from 'react';

/**
 * Custom cursor: dot (follows mouse) + ring (smooth follow).
 * Uses requestAnimationFrame for ring smoothing. Only render when on landing.
 */
export default function CursorDot() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const handleMouseMove = (e) => {
      setMouse({ x: e.clientX, y: e.clientY });
    };

    let rafId;
    const loop = () => {
      const rx = ringPos.current.x;
      const ry = ringPos.current.y;
      ringPos.current.x += (mouse.x - rx) * 0.15;
      ringPos.current.y += (mouse.y - ry) * 0.15;

      dot.style.left = `${mouse.x}px`;
      dot.style.top = `${mouse.y}px`;
      ring.style.left = `${ringPos.current.x}px`;
      ring.style.top = `${ringPos.current.y}px`;

      rafId = requestAnimationFrame(loop);
    };

    document.addEventListener('mousemove', handleMouseMove);
    rafId = requestAnimationFrame(loop);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, [mouse.x, mouse.y]);

  return (
    <>
      <div
        ref={dotRef}
        className="cursor-dot"
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'var(--teal-neon, #00F5CC)',
          pointerEvents: 'none',
          zIndex: 9999,
          transform: 'translate(-50%, -50%)',
          transition: 'transform 0.1s',
          mixBlendMode: 'screen',
        }}
      />
      <div
        ref={ringRef}
        className="cursor-ring"
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '1px solid rgba(0,245,204,0.4)',
          pointerEvents: 'none',
          zIndex: 9998,
          transform: 'translate(-50%, -50%)',
          transition: 'transform 0.18s cubic-bezier(0.23, 1, 0.32, 1), width 0.2s, height 0.2s, opacity 0.2s',
        }}
      />
    </>
  );
}
