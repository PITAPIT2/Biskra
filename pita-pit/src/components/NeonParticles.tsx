import { useEffect, useRef } from "react";

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  r: number; g: number; b: number;
  size: number; baseAlpha: number;
  phase: number; speed: number;
}

export default function NeonParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(devicePixelRatio, 2);
    let W = canvas.offsetWidth;
    let H = canvas.offsetHeight;

    const resize = () => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width  = W * dpr;
      canvas.height = H * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();

    const COUNT = W < 768 ? 90 : 200;
    const particles: Particle[] = [];

    const PALETTE = [
      { r: 57,  g: 255, b: 20  },
      { r: 57,  g: 255, b: 20  },
      { r: 57,  g: 255, b: 20  },
      { r: 255, g: 7,   b: 58  },
      { r: 255, g: 255, b: 255 },
    ];

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    for (let i = 0; i < COUNT; i++) {
      const c = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      particles.push({
        x: rand(0, W), y: rand(0, H),
        vx: rand(-0.18, 0.18),
        vy: rand(-0.15, 0.15),
        r: c.r, g: c.g, b: c.b,
        size: rand(0.8, 2.4),
        baseAlpha: rand(0.3, 0.75),
        phase: rand(0, Math.PI * 2),
        speed: rand(0.8, 2.2),
      });
    }

    let mx = -9999, my = -9999;
    const onMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mx = e.clientX - rect.left;
      my = e.clientY - rect.top;
    };
    const onLeave = () => { mx = -9999; my = -9999; };
    const onTouch = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      mx = e.touches[0].clientX - rect.left;
      my = e.touches[0].clientY - rect.top;
    };
    window.addEventListener("mousemove", onMouse);
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("resize", resize);

    let raf: number;
    let t = 0;

    const drawGlow = (x: number, y: number, r: number, g: number, b: number, radius: number, alpha: number) => {
      const grd = ctx.createRadialGradient(x, y, 0, x, y, radius);
      grd.addColorStop(0,   `rgba(${r},${g},${b},${alpha})`);
      grd.addColorStop(0.45, `rgba(${r},${g},${b},${alpha * 0.2})`);
      grd.addColorStop(1,   `rgba(${r},${g},${b},0)`);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    };

    const draw = () => {
      raf = requestAnimationFrame(draw);
      t += 0.008;

      // Clear with slight fade for trails
      ctx.fillStyle = "rgba(10,10,10,0.22)";
      ctx.fillRect(0, 0, W, H);

      for (const p of particles) {
        // Mouse influence (gentle)
        const dx = mx - p.x, dy = my - p.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < 18000) {
          const force = (1 - dist2 / 18000) * 0.012;
          p.vx -= dx * force;
          p.vy -= dy * force;
        }

        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x  += p.vx;
        p.y  += p.vy;

        if (p.x < -20) p.x = W + 20;
        if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20;
        if (p.y > H + 20) p.y = -20;

        const pulse = 0.55 + 0.45 * Math.sin(t * p.speed + p.phase);
        const a = p.baseAlpha * pulse;

        // Glow halo (soft)
        drawGlow(p.x, p.y, p.r, p.g, p.b, p.size * 8, a * 0.45);
        // Bright core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.65, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${Math.min(1, a * 1.6)})`;
        ctx.fill();
      }

      // Sparse neon web lines
      ctx.lineWidth = 0.4;
      for (let i = 0; i < COUNT; i += 3) {
        for (let j = i + 3; j < COUNT; j += 3) {
          const pi = particles[i], pj = particles[j];
          const d2 = (pi.x - pj.x) ** 2 + (pi.y - pj.y) ** 2;
          if (d2 < 9000) {
            const op = (1 - d2 / 9000) * 0.09;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(57,255,20,${op})`;
            ctx.moveTo(pi.x, pi.y);
            ctx.lineTo(pj.x, pj.y);
            ctx.stroke();
          }
        }
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1, opacity: 0.75 }}
      aria-hidden="true"
    />
  );
}
