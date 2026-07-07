import { useEffect, useRef } from "react";

export default function NeonCursor() {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot  = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Hide on touch devices
    if (window.matchMedia("(pointer: coarse)").matches) return;

    document.body.style.cursor = "none";

    let rx = 0, ry = 0;        // ring position
    let mx = 0, my = 0;        // mouse position
    let color = "#39ff14";
    let raf: number;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      rx = lerp(rx, mx, 0.14);
      ry = lerp(ry, my, 0.14);

      dot.style.transform  = `translate(${mx}px, ${my}px)`;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
    };
    loop();

    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };

    const onEnterLink = (e: Event) => {
      const el = e.target as HTMLElement;
      const isRed = el.closest("[data-cursor-red]");
      color = isRed ? "#ff6a00" : "#39ff14";
      dot.style.background  = color;
      ring.style.borderColor = color;
      ring.style.boxShadow   = `0 0 16px ${color}`;
      ring.style.width  = "56px";
      ring.style.height = "56px";
      ring.style.marginLeft = "-28px";
      ring.style.marginTop  = "-28px";
    };

    const onLeaveLink = () => {
      dot.style.background  = "#39ff14";
      ring.style.borderColor = "#39ff14";
      ring.style.boxShadow   = "0 0 10px #39ff14";
      ring.style.width  = "36px";
      ring.style.height = "36px";
      ring.style.marginLeft = "-18px";
      ring.style.marginTop  = "-18px";
    };

    const onDown = () => { dot.style.transform += " scale(0.5)"; };
    const onUp   = () => {};

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup",   onUp);

    document.querySelectorAll("a, button, [data-cursor]").forEach((el) => {
      el.addEventListener("mouseenter", onEnterLink);
      el.addEventListener("mouseleave", onLeaveLink);
    });

    return () => {
      cancelAnimationFrame(raf);
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup",   onUp);
    };
  }, []);

  return (
    <>
      {/* Core dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 z-[9999] pointer-events-none"
        style={{
          width: 8, height: 8,
          marginLeft: -4, marginTop: -4,
          borderRadius: "50%",
          background: "#39ff14",
          boxShadow: "0 0 8px #39ff14, 0 0 20px #39ff14",
          transition: "background 0.2s",
          willChange: "transform",
        }}
      />
      {/* Delayed ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 z-[9998] pointer-events-none"
        style={{
          width: 36, height: 36,
          marginLeft: -18, marginTop: -18,
          borderRadius: "50%",
          border: "1.5px solid #39ff14",
          boxShadow: "0 0 10px #39ff14",
          transition: "width 0.3s, height 0.3s, border-color 0.2s, box-shadow 0.2s, margin 0.3s",
          willChange: "transform",
        }}
      />
    </>
  );
}
