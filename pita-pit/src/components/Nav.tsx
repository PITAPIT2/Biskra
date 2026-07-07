import { useEffect, useState, useCallback } from "react";
import { Link } from "wouter";
import { useCart } from "../context/CartContext";

export default function Nav() {
  const { itemCount, openCart } = useCart();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    openCart();
  }, [openCart]);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[900] flex items-center justify-between px-4 sm:px-8 h-14 sm:h-16 transition-all duration-500"
      style={{
        background: scrolled ? "rgba(5,5,5,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
      }}
    >
      {/* Logo */}
      <Link href="/">
        <img
          src={`${import.meta.env.BASE_URL}logo-nav.png`}
          alt="Pita Pit 2"
          className="w-36 sm:w-56 h-auto object-contain cursor-pointer hover:scale-105 transition-transform duration-200"
          style={{ mixBlendMode: "screen" }}
        />
      </Link>

      {/* Center link */}
      <div className="flex items-center">
        <Link href="/">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] font-mono cursor-pointer text-[#39ff14] transition-colors duration-200">
            Home
          </span>
        </Link>
      </div>

      {/* Cart button */}
      <button
        onClick={handleCart}
        className="relative flex items-center gap-2 group cursor-pointer"
        aria-label="Open cart"
        data-testid="btn-open-cart"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          className="text-white/70 group-hover:text-[#39ff14] transition-colors duration-200">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
        {itemCount > 0 && (
          <span
            key={itemCount}
            className="absolute -top-2 -right-2 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#39ff14] text-black text-[9px] sm:text-[10px] font-black flex items-center justify-center"
            style={{ animation: "ping-once 0.3s ease-out" }}
          >
            {itemCount > 9 ? "9+" : itemCount}
          </span>
        )}
        <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] font-mono text-white/50 group-hover:text-white/80 transition-colors hidden sm:inline">
          Cart
        </span>
      </button>

      <style>{`
        @keyframes ping-once {
          0%   { transform: scale(0.6); opacity: 0; }
          60%  { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </nav>
  );
}
