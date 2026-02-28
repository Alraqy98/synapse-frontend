import React, { useRef, useEffect } from 'react';

/**
 * Synapse network animation — floating nodes and connections.
 * Runs in useEffect with requestAnimationFrame; canvas sized to container.
 */
export default function SynapseCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const NODE_COUNT = 38;
    const TEAL = [0, 200, 180];
    const BLUE = [63, 124, 255];
    const RED = [255, 75, 75];
    const CONN_DIST = 0.22;

    const nodes = Array.from({ length: NODE_COUNT }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00018,
      vy: (Math.random() - 0.5) * 0.00018,
      r: 2 + Math.random() * 3,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.018 + Math.random() * 0.022,
      type: i < 3 ? 'red' : i < 8 ? 'blue' : 'teal',
    }));

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    resize();
    window.addEventListener('resize', resize);

    function draw(ts) {
      const W = canvas.width;
      const H = canvas.height;
      const diag = Math.sqrt(W * W + H * H);

      ctx.clearRect(0, 0, W, H);

      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        n.pulse += n.pulseSpeed;
        if (n.x < 0 || n.x > 1) n.vx *= -1;
        if (n.y < 0 || n.y > 1) n.vy *= -1;
      });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = (a.x - b.x) * W;
          const dy = (a.y - b.y) * H;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = CONN_DIST * diag;
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.18;
            const col =
              a.type === 'red' || b.type === 'red' ? RED : a.type === 'blue' || b.type === 'blue' ? BLUE : TEAL;
            ctx.beginPath();
            ctx.moveTo(a.x * W, a.y * H);
            ctx.lineTo(b.x * W, b.y * H);
            ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
            const phase = (ts * 0.0007 + i * 0.3) % 1;
            if (phase < 0.15) {
              const t = phase / 0.15;
              const px = a.x * W + (b.x * W - a.x * W) * t;
              const py = a.y * H + (b.y * H - a.y * H) * t;
              ctx.beginPath();
              ctx.arc(px, py, 1.5, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${alpha * 3})`;
              ctx.fill();
            }
          }
        }
      }

      nodes.forEach((n) => {
        const px = n.x * W;
        const py = n.y * H;
        const col = n.type === 'red' ? RED : n.type === 'blue' ? BLUE : TEAL;
        const glow = 0.5 + 0.5 * Math.sin(n.pulse);
        const grad = ctx.createRadialGradient(px, py, 0, px, py, n.r * 4);
        grad.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${0.12 * glow})`);
        grad.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
        ctx.beginPath();
        ctx.arc(px, py, n.r * 4, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px, py, n.r * (0.7 + 0.3 * glow), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${0.5 + 0.5 * glow})`;
        ctx.fill();
      });

      requestAnimationFrame(draw);
    }

    const rafId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="synapse-canvas"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: 0.35,
        pointerEvents: 'none',
        zIndex: 0,
      }}
      aria-hidden="true"
    />
  );
}
