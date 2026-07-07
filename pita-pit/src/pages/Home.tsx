import React, {
  useEffect, useRef, useState, useCallback,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "@studio-freight/lenis";
import Nav from "../components/Nav";
import Cart from "../components/Cart";
import { useCart } from "../context/CartContext";

import wrapImg    from "../assets/images/pita-wrap.png";
import meatImg    from "../assets/images/grilled-meat.png";
import { Flame, Leaf, Zap, ShieldCheck } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

/* ─── utils ──────────────────────────────────────────────────────────── */
const isMobile = () => window.innerWidth < 768;

/* ─── LineReveal ─────────────────────────────────────────────────────── */
function LineReveal({
  lines, tag: Tag = "div", className, staggerDelay = 0.11,
}: {
  lines: React.ReactNode[];
  tag?: keyof React.JSX.IntrinsicElements;
  className?: string;
  staggerDelay?: number;
}) {
  const wrapRef   = useRef<HTMLElement>(null);
  const innerRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const inners = innerRefs.current.filter(Boolean) as HTMLSpanElement[];
    gsap.set(inners, { y: "115%" });

    const trig = ScrollTrigger.create({
      trigger: wrapRef.current,
      start: "top 84%",
      once: true,
      onEnter: () =>
        gsap.to(inners, {
          y: "0%", duration: 0.9,
          stagger: staggerDelay, ease: "power3.out",
        }),
    });
    return () => trig.kill();
  }, [staggerDelay]);

  const TagComp = Tag as React.ElementType;
  return (
    <TagComp ref={wrapRef} className={className}>
      {lines.map((line, i) => (
        <span key={i} className="line-outer">
          <span ref={(el) => { innerRefs.current[i] = el; }} className="line-inner">
            {line}
          </span>
        </span>
      ))}
    </TagComp>
  );
}

/* ─── Scramble ───────────────────────────────────────────────────────── */
const SC = "!<>-_\\/[]{}—=+*^?#@$%&";
function useScramble(text: string, active: boolean) {
  const [out, setOut] = useState(text);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!active) return;
    let iter = 0;
    const total = text.length * 3;
    const tick = () => {
      setOut(text.split("").map((c, i) => {
        if (c === " ") return " ";
        if (i < iter / 3) return c;
        return SC[Math.floor(Math.random() * SC.length)];
      }).join(""));
      if (iter++ < total) t.current = setTimeout(tick, 26);
      else setOut(text);
    };
    tick();
    return () => { if (t.current) clearTimeout(t.current); };
  }, [active, text]);
  return out;
}

/* ─── Animated stat number ───────────────────────────────────────────── */
function StatNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obj = { val: 0 };
    const trig = ScrollTrigger.create({
      trigger: el, start: "top 80%", once: true,
      onEnter: () =>
        gsap.to(obj, {
          val: target, duration: 2.2, ease: "power2.out",
          onUpdate: () => { el.textContent = Math.round(obj.val) + suffix; },
        }),
    });
    return () => trig.kill();
  }, [target, suffix]);
  return <span ref={ref}>0{suffix}</span>;
}

/* ─── Magnetic button ────────────────────────────────────────────────── */
function MagneticBtn({ children, className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ref = useRef<HTMLButtonElement>(null);
  const onMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.4, y: (e.clientY - r.top - r.height / 2) * 0.3, duration: 0.4, ease: "power2.out" });
  }, []);
  const onLeave = useCallback(() => {
    gsap.to(ref.current, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1,0.4)" });
  }, []);
  return (
    <button ref={ref} className={className} onMouseMove={onMove} onMouseLeave={onLeave} {...rest}>
      {children}
    </button>
  );
}

/* ─── 3D card ────────────────────────────────────────────────────────── */
function Card3D({ title, desc, index }: { title: string; desc: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    gsap.to(el, { rotateY: x * 22, rotateX: -y * 18, translateZ: 20, duration: 0.22, ease: "power2.out" });
    const s = el.querySelector<HTMLDivElement>(".c-shine");
    if (s) s.style.background = `radial-gradient(circle at ${(x+.5)*100}% ${(y+.5)*100}%, rgba(57,255,20,0.22) 0%, transparent 65%)`;
  }, []);
  const onLeave = useCallback(() => {
    const el = ref.current; if (!el) return;
    gsap.to(el, { rotateY: 0, rotateX: 0, translateZ: 0, duration: 0.7, ease: "elastic.out(1,0.5)" });
    const s = el.querySelector<HTMLDivElement>(".c-shine");
    if (s) s.style.background = "none";
  }, []);
  return (
    <div ref={ref} className="food-card relative bg-[#0d0d0d] border border-white/8 p-7 sm:p-10 overflow-hidden group cursor-pointer"
      style={{ transformStyle: "preserve-3d", willChange: "transform" }}
      onMouseMove={onMove} onMouseLeave={onLeave} data-cursor>
      <div className="c-shine absolute inset-0 pointer-events-none z-10 transition-all duration-100" />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 border border-[#39ff14]/30 pointer-events-none" />
      <div className="font-mono text-[#39ff14] text-sm sm:text-base mb-4 opacity-30 group-hover:opacity-100 transition-opacity duration-300">0{index + 1}</div>
      <h3 className="text-xl sm:text-2xl md:text-3xl font-black uppercase mb-3 text-white">{title}</h3>
      <p className="text-sm sm:text-base text-white/45 leading-relaxed">{desc}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   HOME MENU SECTION
══════════════════════════════════════════════════════════════════════ */
type HMPrice = { label: string; value: number };
type HMItem  = { id: string; name: string; prices: HMPrice[]; extra?: string };
type HMCat   = { key: string; label: string; items: HMItem[]; extra?: string; img?: string };

const S = (d: string) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d={d}/>
  </svg>
);
const S2 = (d1: string, d2: string) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d={d1}/><path d={d2}/>
  </svg>
);

const MENU_ICONS: Record<string, React.ReactNode> = {
  "tacos-gratine":    S2("M2 15 C4 9 8 5 16 4","M2 15 C6 13 10 12 16 4"),
  "tacos-classique":  (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="14" height="9" rx="4.5"/><path d="M6 10h8M6 12.5h5"/></svg>),
  "tacos-crispy":     (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M2 15 C4 9 8 5 16 4 M2 15 C6 13 10 12 16 4"/><path d="M8 8 C9 6 11 6 12 8" strokeWidth="1"/></svg>),
  "fajitas":          S2("M4 14 C4 14 5 6 10 4 C15 2 17 8 17 8","M4 14 C6 13 12 12 17 8"),
  "souffle":          (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="10" cy="13" rx="7" ry="3"/><path d="M3 13 C3 8 7 5 10 5 C13 5 17 8 17 13"/></svg>),
  "chapati":          (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="10" cy="10" rx="7.5" ry="4"/><path d="M5 10 C6 8.5 8 8 10 8 C12 8 14 8.5 15 10"/></svg>),
  "shawarma-arabi":   (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="3" x2="10" y2="17"/><ellipse cx="10" cy="7" rx="5" ry="2.5"/><ellipse cx="10" cy="11" rx="4" ry="2"/><ellipse cx="10" cy="14.5" rx="3" ry="1.5"/></svg>),
  "matlou3":          (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 14 C3 11 5 8 10 7 C15 8 17 11 17 14 Z"/><path d="M6 14 C7 11 9 10 10 10 C11 10 13 11 14 14"/></svg>),
  "malfouf-makloub":  S2("M3 10 C3 6 6 3 10 3 C14 3 17 6 17 10","M3 10 C4 13 7 15 10 15 C13 15 16 13 17 10"),
  "malfouf-tunisien": (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7 C4 4 6.7 3 10 3 C13.3 3 16 4 16 7"/><rect x="3" y="7" width="14" height="7" rx="3.5"/><path d="M6 10.5h8"/></svg>),
  "poutine":          (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="8" width="10" height="9" rx="1"/><path d="M5 8 L6.5 3h7L14 8"/><path d="M7 11h6M7 13.5h4"/></svg>),
  "burger":           (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8 C4 5 6.5 3.5 10 3.5 C13.5 3.5 16 5 16 8"/><rect x="3" y="8" width="14" height="2.5" rx="0"/><rect x="3" y="10.5" width="14" height="2.5" rx="0"/><path d="M4 13 C4 15.5 6.5 16.5 10 16.5 C13.5 16.5 16 15.5 16 13"/></svg>),
  "sandwich-pita":    (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 14 L10 4 L17 14 Z"/><path d="M5.5 14 C6 11 8 9.5 10 9.5 C12 9.5 14 11 14.5 14"/></svg>),
  "sandwich-pain":    (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="8" width="16" height="6" rx="3"/><path d="M2 11h16"/><path d="M5 8 C5 5.5 7 4.5 10 4.5 C13 4.5 15 5.5 15 8"/></svg>),
  "sandwich-combo":   (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="16" height="8" rx="2"/><path d="M2 10h16M2 12.5h16"/><path d="M5 7 C5 4.5 7.5 3.5 10 3.5 C12.5 3.5 15 4.5 15 7"/></svg>),
  "plat-varie":       (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="10" cy="13" rx="7.5" ry="2"/><path d="M2.5 13 C2.5 8.5 6 6 10 6 C14 6 17.5 8.5 17.5 13"/><line x1="10" y1="3" x2="10" y2="6"/></svg>),
  "entrees":          (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="5" height="5" rx="1"/><rect x="11" y="4" width="5" height="5" rx="1"/><rect x="4" y="11" width="5" height="5" rx="1"/><rect x="11" y="11" width="5" height="5" rx="1"/></svg>),
  "pizza-rouge":      (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3 L17 17 H3 Z"/><circle cx="10" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="8" cy="13.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="12" cy="13.5" r="0.8" fill="currentColor" stroke="none"/><path d="M6 17 L10 3 L14 17" strokeWidth="0.8" strokeDasharray="1 2"/></svg>),
  "pizza-tranche":    (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M10 10 L4 17 L16 17 Z"/><path d="M10 10 L3 5 A8 8 0 0 1 17 5 Z"/><circle cx="10" cy="14" r="0.9" fill="currentColor" stroke="none"/></svg>),
  "pizza-boisee":     (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3 L17 17 H3 Z"/><circle cx="10" cy="9" r="1.2" fill="currentColor" stroke="none"/><circle cx="7" cy="13" r="1" fill="currentColor" stroke="none"/><circle cx="13" cy="13" r="1" fill="currentColor" stroke="none"/></svg>),
  "pizza-maison":     (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="7"/><path d="M10 3 L17 10 M10 3 L3 10"/><path d="M7 13h6M7 10.5h6"/></svg>),
};

const HOME_CATS: HMCat[] = [
  {
    key: "tacos-gratine", label: "TACOS GRATINÉ",
    img: "/menu-tacos-gratine.png",
    extra: "Double Viande +150 DA",
    items: [
      { id: "tg-chaw", name: "Tacos Chawarma",      prices: [{ label:"L", value:500  },{ label:"XL", value:1000 }] },
      { id: "tg-poul", name: "Tacos Poulet",        prices: [{ label:"L", value:550  },{ label:"XL", value:1000 }] },
      { id: "tg-via",  name: "Tacos Viande Hachée", prices: [{ label:"L", value:500  },{ label:"XL", value:1000 }] },
      { id: "tg-merg", name: "Tacos Merguez",       prices: [{ label:"L", value:500  },{ label:"XL", value:1000 }] },
      { id: "tg-pan",  name: "Tacos Panaché",       prices: [{ label:"L", value:550  },{ label:"XL", value:1100 }] },
      { id: "tg-foie", name: "Tacos Foie",          prices: [{ label:"L", value:550  },{ label:"XL", value:1100 }] },
      { id: "tg-spe",  name: "Tacos Spécial",       prices: [{ label:"L", value:700  },{ label:"XL", value:1400 }] },
      { id: "tg-jiga", name: "Tacos Jiga",          prices: [{ label:"XL", value:2000}] },
    ],
  },
  {
    key: "tacos-classique", label: "TACOS CLASSIQUE",
    img: "/menu-tacos-classique.png",
    extra: "Double Viande +150 DA",
    items: [
      { id: "tc-chaw", name: "Tacos Chawarma",      prices: [{ label:"L", value:400 },{ label:"XL", value:800  },{ label:"XXL", value:1600 }] },
      { id: "tc-poul", name: "Tacos Poulet",        prices: [{ label:"L", value:400 },{ label:"XL", value:800  },{ label:"XXL", value:1600 }] },
      { id: "tc-via",  name: "Tacos Viande Hachée", prices: [{ label:"L", value:450 },{ label:"XL", value:900  },{ label:"XXL", value:1800 }] },
      { id: "tc-merg", name: "Tacos Merguez",       prices: [{ label:"L", value:450 },{ label:"XL", value:900  },{ label:"XXL", value:1800 }] },
      { id: "tc-pan",  name: "Tacos Panaché",       prices: [{ label:"L", value:500 },{ label:"XL", value:1000 },{ label:"XXL", value:2000 }] },
      { id: "tc-foie", name: "Tacos Foie",          prices: [{ label:"L", value:500 },{ label:"XL", value:1000 },{ label:"XXL", value:2000 }] },
      { id: "tc-spe",  name: "Tacos Spécial",       prices: [{ label:"L", value:600 },{ label:"XL", value:1200 },{ label:"XXL", value:2400 }] },
    ],
  },
  {
    key: "fajitas", label: "FAJITAS",
    img: "/menu-fajitas.png",
    items: [
      { id: "fj-chaw", name: "Fajitas Chawarma",     prices: [{ label:"L", value:500 },{ label:"XL", value:1000 }] },
      { id: "fj-poul", name: "Fajitas Poulet",       prices: [{ label:"L", value:500 },{ label:"XL", value:1000 }] },
      { id: "fj-via",  name: "Fajitas Viande Hachée",prices: [{ label:"L", value:500 },{ label:"XL", value:1000 }] },
      { id: "fj-merg", name: "Fajitas Merguez",      prices: [{ label:"L", value:500 },{ label:"XL", value:1000 }] },
      { id: "fj-pan",  name: "Fajitas Panaché",      prices: [{ label:"L", value:600 },{ label:"XL", value:1200 }] },
      { id: "fj-foie", name: "Fajitas Foie",         prices: [{ label:"L", value:550 },{ label:"XL", value:1100 }] },
      { id: "fj-spe",  name: "Fajitas Spécial",      prices: [{ label:"L", value:700 },{ label:"XL", value:1400 }] },
    ],
  },
  {
    key: "souffle", label: "SOUFFLÉE",
    img: "/menu-soufflee.png",
    items: [
      { id: "sf-chaw", name: "Soufflée Chawarma",     prices: [{ label:"STD", value:500 }] },
      { id: "sf-poul", name: "Soufflée Poulet",       prices: [{ label:"STD", value:550 }] },
      { id: "sf-via",  name: "Soufflée Viande Hachée",prices: [{ label:"STD", value:550 }] },
      { id: "sf-pan",  name: "Soufflée Panaché",      prices: [{ label:"STD", value:650 }] },
      { id: "sf-foie", name: "Soufflée Foie",         prices: [{ label:"STD", value:600 }] },
    ],
  },
  {
    key: "malfouf-makloub", label: "MALFOUF MAKLOUB",
    img: "/menu-malfouf.png",
    extra: "Double Viande +150 DA",
    items: [
      { id: "mm-chaw", name: "Malfouf Makloub Chawarma",      prices: [{ label:"STD", value:350 }] },
      { id: "mm-poul", name: "Malfouf Makloub Poulet",        prices: [{ label:"STD", value:350 }] },
      { id: "mm-via",  name: "Malfouf Makloub Viande Hachée", prices: [{ label:"STD", value:350 }] },
      { id: "mm-pan",  name: "Malfouf Makloub Panaché",       prices: [{ label:"STD", value:450 }] },
      { id: "mm-foie", name: "Malfouf Makloub Foie",          prices: [{ label:"STD", value:400 }] },
      { id: "mm-spe",  name: "Malfouf Makloub Spécial",       prices: [{ label:"STD", value:500 }] },
    ],
  },
  {
    key: "malfouf-tunisien", label: "MALFOUF TUNISIEN",
    img: "/menu-malfouf.png",
    extra: "Double Viande +150 DA",
    items: [
      { id: "mt-chaw", name: "Malfouf Tunisien Chawarma",      prices: [{ label:"STD", value:300 }] },
      { id: "mt-poul", name: "Malfouf Tunisien Poulet",        prices: [{ label:"STD", value:300 }] },
      { id: "mt-via",  name: "Malfouf Tunisien Viande Hachée", prices: [{ label:"STD", value:300 }] },
      { id: "mt-pan",  name: "Malfouf Tunisien Panaché",       prices: [{ label:"STD", value:400 }] },
      { id: "mt-foie", name: "Malfouf Tunisien Foie",          prices: [{ label:"STD", value:350 }] },
      { id: "mt-spe",  name: "Malfouf Tunisien Spécial",       prices: [{ label:"STD", value:450 }] },
    ],
  },
  {
    key: "poutine", label: "POUTINE",
    items: [
      { id: "pt-poul", name: "Poutine Poulet",     prices: [{ label:"STD", value:500 }], extra: "Poulet + Fritte + Fromage" },
      { id: "pt-kri",  name: "Poutine Krispy",     prices: [{ label:"STD", value:300 }], extra: "Krispy + Fritte + Fromage" },
      { id: "pt-via",  name: "Poutine Viande",     prices: [{ label:"STD", value:500 }], extra: "Viande + Fritte + Fromage" },
      { id: "pt-3fr",  name: "Poutine 3 Fromage",  prices: [{ label:"STD", value:600 }], extra: "2 Fromage + Fritte + Sauce Fromage" },
    ],
  },
  {
    key: "pizza-boisee", label: "PIZZA BOISÉE",
    img: "/menu-pizza-boisee.png",
    items: [
      { id: "pb-poul", name: "La Boisée Poulet",        prices: [{ label:"L", value:600 },{ label:"XL", value:1200 },{ label:"XXL", value:2400 }], extra: "Crème Fraîche + Fromage + Poulet Hacée + Sauce Gruyère" },
      { id: "pb-via",  name: "La Boisée Viande Hachée", prices: [{ label:"L", value:650 },{ label:"XL", value:1300 },{ label:"XXL", value:2600 }], extra: "Crème Fraîche + Fromage + Viande + Sauce Gruyère" },
      { id: "pb-merg", name: "La Boisée Merguez",       prices: [{ label:"L", value:650 },{ label:"XL", value:1300 },{ label:"XXL", value:2600 }], extra: "Crème Fraîche + Fromage + Merguez + Poivron" },
      { id: "pb-4fr",  name: "La Boisée 4 Fromages",   prices: [{ label:"L", value:800 },{ label:"XL", value:1600 },{ label:"XXL", value:3200 }], extra: "Crème Fraîche + Camembert + Fromage Bleu + Sauce Gruyère" },
      { id: "pb-fum",  name: "La Boisée Fumée",        prices: [{ label:"L", value:750 },{ label:"XL", value:1500 },{ label:"XXL", value:3000 }], extra: "Crème Fraîche + Fromage + Dinde Fumée + Sauce Gruyère" },
      { id: "pb-crev", name: "La Boisée Crevette",     prices: [{ label:"L", value:900 },{ label:"XL", value:1800 },{ label:"XXL", value:3600 }], extra: "Crème Fraîche + Fromage + Dinde Fumée + Sauce Gruyère" },
    ],
  },
  {
    key: "pizza-maison", label: "PIZZA MAISON",
    img: "/menu-pizza-maison.png",
    extra: "Suppléments L:250 / XL:350 / XXL:500 DA",
    items: [
      { id: "pm-pan",  name: "Pizza Panachée",        prices: [{ label:"L", value:600  },{ label:"XL", value:1200 },{ label:"XXL", value:2400 }], extra: "½ Boisée Poulet ½ Viande Hachée" },
      { id: "pm-3st",  name: "Pizza 3 Saisons Thone", prices: [{ label:"XL", value:1300 },{ label:"XXL", value:2600 }], extra: "⅓ Boisée Poulet ⅓ Viande Hachée ⅓ Thone" },
      { id: "pm-merg", name: "Pizza Merguez",         prices: [{ label:"XL", value:1300 },{ label:"XXL", value:2600 }] },
      { id: "pm-chef", name: "Pizza Chef",            prices: [{ label:"L", value:800  },{ label:"XL", value:1600 },{ label:"XXL", value:3200 }] },
      { id: "pm-3via", name: "Pizza 3 Viandes",       prices: [{ label:"L", value:800  },{ label:"XL", value:1600 },{ label:"XXL", value:3200 }], extra: "Poulet + Dindé + Hachée + Merguez + Sauce Gruyère" },
      { id: "pm-4sai", name: "Pizza 4 Saisons Royal", prices: [{ label:"L", value:750  },{ label:"XL", value:1500 },{ label:"XXL", value:3000 }], extra: "¼ Poulet ¼ Viande Hachée ¼ Thone ¼ Champignon" },
    ],
  },
  {
    key: "tacos-crispy", label: "TACOS CRISPY",
    extra: "Double Viande +150 DA",
    items: [
      { id: "tcr-chaw", name: "Tacos Chawarma",      prices: [{ label:"STD", value:500 }] },
      { id: "tcr-poul", name: "Tacos Poulet",        prices: [{ label:"STD", value:500 }] },
      { id: "tcr-via",  name: "Tacos Viande Hachée", prices: [{ label:"STD", value:550 }] },
      { id: "tcr-merg", name: "Tacos Merguez",       prices: [{ label:"STD", value:550 }] },
      { id: "tcr-pan",  name: "Tacos Panaché",       prices: [{ label:"STD", value:600 }] },
      { id: "tcr-foie", name: "Tacos Foie",          prices: [{ label:"STD", value:600 }] },
      { id: "tcr-spe",  name: "Tacos Spécial",       prices: [{ label:"STD", value:700 }] },
    ],
  },
  {
    key: "chapati", label: "CHAPATI",
    items: [
      { id: "ch-thon", name: "Chapati Thon",          prices: [{ label:"STD", value:300 }] },
      { id: "ch-chaw", name: "Chapati Chawarma",      prices: [{ label:"STD", value:300 }] },
      { id: "ch-poul", name: "Chapati Poulet",        prices: [{ label:"STD", value:300 }] },
      { id: "ch-esc",  name: "Chapati Escalope",      prices: [{ label:"STD", value:300 }] },
      { id: "ch-via",  name: "Chapati Viande Hachée", prices: [{ label:"STD", value:300 }] },
      { id: "ch-foie", name: "Chapati Foie",          prices: [{ label:"STD", value:350 }] },
      { id: "ch-pan",  name: "Chapati Panaché",       prices: [{ label:"STD", value:400 }] },
    ],
  },
  {
    key: "shawarma-arabi", label: "SHAWARMA ARABI",
    extra: "Les Fromages: Cheddar · Camembert · Gruyère · Mozzarella · Rouge · Bleu",
    items: [
      { id: "sa-chaw", name: "Shawarma العربي",      prices: [{ label:"STD", value:350 }] },
      { id: "sa-poul", name: "Poulet العربي",        prices: [{ label:"STD", value:350 }] },
      { id: "sa-via",  name: "Viande Hachée العربي", prices: [{ label:"STD", value:350 }] },
      { id: "sa-merg", name: "Merguez العربي",       prices: [{ label:"STD", value:350 }] },
      { id: "sa-pan",  name: "Panaché العربي",       prices: [{ label:"STD", value:450 }] },
      { id: "sa-foie", name: "Foie العربي",          prices: [{ label:"STD", value:450 }] },
      { id: "sa-spe",  name: "Spécial العربي",       prices: [{ label:"STD", value:600 }] },
    ],
  },
  {
    key: "matlou3", label: "MATLOU3",
    items: [
      { id: "ml-chaw", name: "Matlou3 Shawarma",      prices: [{ label:"STD", value:300 }] },
      { id: "ml-poul", name: "Matlou3 Poulet",        prices: [{ label:"STD", value:300 }] },
      { id: "ml-via",  name: "Matlou3 Viande Hachée", prices: [{ label:"STD", value:300 }] },
      { id: "ml-foie", name: "Matlou3 Foie",          prices: [{ label:"STD", value:350 }] },
      { id: "ml-pan",  name: "Matlou3 Panaché",       prices: [{ label:"STD", value:400 }] },
    ],
  },
  {
    key: "burger", label: "BURGER",
    items: [
      { id: "bg-miam",  name: "Miam Hamburger",      prices: [{ label:"STD", value:250 }], extra: "Viande Hachée Frais" },
      { id: "bg-big",   name: "Big Miam Hamburger",  prices: [{ label:"STD", value:300 }], extra: "Double Viande Hachée Frais + Double Fromage Slaize" },
      { id: "bg-cri",   name: "Hamburger Crispy",    prices: [{ label:"STD", value:300 }], extra: "Double Scalope Hachée + Fromage Slaize" },
      { id: "bg-king",  name: "King Hamburger",      prices: [{ label:"STD", value:400 }], extra: "Triple Viande Hachée Frais" },
    ],
  },
  {
    key: "sandwich-pita", label: "SANDWICH PITA PIT",
    items: [
      { id: "sp-chaw", name: "Sandwich Pita Pit Shawarma",      prices: [{ label:"STD", value:450 }] },
      { id: "sp-esc",  name: "Sandwich Pita Pit Escalope",      prices: [{ label:"STD", value:450 }] },
      { id: "sp-via",  name: "Sandwich Pita Pit Viande Hachée", prices: [{ label:"STD", value:450 }] },
      { id: "sp-poul", name: "Sandwich Pita Pit Poulet",        prices: [{ label:"STD", value:450 }] },
      { id: "sp-foie", name: "Sandwich Pita Foie",              prices: [{ label:"STD", value:500 }] },
      { id: "sp-pan",  name: "Sandwich Pita Pit Panaché",       prices: [{ label:"STD", value:500 }] },
      { id: "sp-spe",  name: "Sandwich Pita Pit Spécial",       prices: [{ label:"STD", value:600 }] },
    ],
  },
  {
    key: "sandwich-pain", label: "SANDWICH PAIN",
    items: [
      { id: "sn-chaw", name: "Sandwich Shawarma",      prices: [{ label:"STD", value:300 }] },
      { id: "sn-esc",  name: "Sandwich Escalope",      prices: [{ label:"STD", value:300 }] },
      { id: "sn-via",  name: "Sandwich Viande Hachée", prices: [{ label:"STD", value:300 }] },
      { id: "sn-poul", name: "Sandwich Poulet",        prices: [{ label:"STD", value:350 }] },
      { id: "sn-foie", name: "Sandwich Foie",          prices: [{ label:"STD", value:350 }] },
      { id: "sn-pan",  name: "Sandwich Panaché",       prices: [{ label:"STD", value:400 }] },
    ],
  },
  {
    key: "sandwich-combo", label: "SANDWICH COMBO",
    items: [
      { id: "sc-chaw", name: "Combo Shawarma",      prices: [{ label:"STD", value:300 }] },
      { id: "sc-esc",  name: "Combo Escalope",      prices: [{ label:"STD", value:300 }] },
      { id: "sc-via",  name: "Combo Viande Hachée", prices: [{ label:"STD", value:300 }] },
      { id: "sc-poul", name: "Combo Poulet",        prices: [{ label:"STD", value:350 }] },
      { id: "sc-foie", name: "Combo Foie",          prices: [{ label:"STD", value:400 }] },
      { id: "sc-pan",  name: "Combo Panaché",       prices: [{ label:"STD", value:400 }] },
    ],
  },
  {
    key: "plat-varie", label: "PLAT VARIÉ",
    extra: "Double Viande +300 DA",
    items: [
      { id: "pv-fri",  name: "Plat Frite",                    prices: [{ label:"STD", value:200  }] },
      { id: "pv-svi",  name: "Plat Sans Viande",              prices: [{ label:"STD", value:500  }] },
      { id: "pv-reg",  name: "Plat Régime",                   prices: [{ label:"STD", value:600  }] },
      { id: "pv-chaw", name: "Plat Varié Chawarma",           prices: [{ label:"STD", value:650  }] },
      { id: "pv-via",  name: "Plat Varié Viande Hachée",      prices: [{ label:"STD", value:650  }] },
      { id: "pv-mct",  name: "Plat Varié Machawi Chicketaouk",prices: [{ label:"STD", value:650  }] },
      { id: "pv-mkb",  name: "Plat Varié Machawi Kabab",      prices: [{ label:"STD", value:650  }] },
      { id: "pv-cri",  name: "Plat Varié Crispy",             prices: [{ label:"STD", value:700  }] },
      { id: "pv-sca",  name: "Plat Varié Scalope",            prices: [{ label:"STD", value:700  }] },
      { id: "pv-foi",  name: "Plat Varié Foie",               prices: [{ label:"STD", value:750  }] },
      { id: "pv-cob",  name: "Plat Varié Cordon Bleu",        prices: [{ label:"STD", value:650  }] },
      { id: "pv-kin",  name: "Plat Varié Kintaki",            prices: [{ label:"STD", value:750  }] },
      { id: "pv-spe",  name: "Plat Varié Spécial",            prices: [{ label:"STD", value:800  }] },
    ],
  },
  {
    key: "entrees", label: "NOS ENTRÉES",
    items: [
      { id: "en-bor", name: "Borek",             prices: [{ label:"STD", value:170 }] },
      { id: "en-kor", name: "Korni",             prices: [{ label:"STD", value:170 }] },
      { id: "en-mta", name: "Mini Tacos",        prices: [{ label:"STD", value:170 }] },
      { id: "en-msf", name: "Mini Soufflée",     prices: [{ label:"STD", value:70  }] },
      { id: "en-bfr", name: "Barquette de Frite",prices: [{ label:"STD", value:200 }] },
      { id: "en-kin", name: "Kintaki",           prices: [{ label:"STD", value:150 }] },
      { id: "en-cri", name: "Crispi",            prices: [{ label:"STD", value:150 }] },
    ],
  },
  {
    key: "pizza-rouge", label: "PIZZA SAUCE ROUGE",
    extra: "Suppléments L:150 / XL:250 / XXL:400 DA",
    items: [
      { id: "pr-mar",  name: "Pizza Margherita",    prices: [{ label:"L", value:300 },{ label:"XL", value:600  },{ label:"XXL", value:1200 }], extra: "Tomate + Olive + Fromage + Herbes" },
      { id: "pr-veg",  name: "Pizza Végétarienne",  prices: [{ label:"L", value:450 },{ label:"XL", value:900  },{ label:"XXL", value:1800 }], extra: "Tomate + Olive + Fromage + Herbes + Poivron + Maïs + Carottes + Champignon" },
      { id: "pr-ori",  name: "Pizza Orientale",     prices: [{ label:"L", value:500 },{ label:"XL", value:1000 },{ label:"XXL", value:2000 }], extra: "Tomate + Olive + Sauce Pizza + Fromage + Merguez + Poivron + Olive" },
      { id: "pr-pec",  name: "Pizza Pêcheur",       prices: [{ label:"L", value:500 },{ label:"XL", value:1000 },{ label:"XXL", value:2000 }], extra: "Tomate + Olive + Fromage + Thon + Herbers" },
      { id: "pr-chi",  name: "Pizza Chicken",       prices: [{ label:"L", value:500 },{ label:"XL", value:1000 },{ label:"XXL", value:2000 }], extra: "Tomate + Olive + Fromage + Poulet + Herbers" },
      { id: "pr-nos",  name: "Pizza Nostra",        prices: [{ label:"L", value:650 },{ label:"XL", value:1300 },{ label:"XXL", value:2600 }], extra: "Tomate + Olive + Fromage + Viande Hachée + Bordure + Fromage + Herbers" },
      { id: "pr-fro",  name: "Pizza Fromage",       prices: [{ label:"L", value:750 },{ label:"XL", value:1500 },{ label:"XXL", value:3000 }], extra: "Tomate + Olive + Fromage Rouge + Bordure + Fromage + Herbers" },
      { id: "pr-spe",  name: "Pizza Spéciale",      prices: [{ label:"L", value:700 },{ label:"XL", value:1400 },{ label:"XXL", value:2800 }], extra: "Tomate + Olive + Viande Hachée + Champignon + Poulet + Fromage + Herbers" },
      { id: "pr-mai",  name: "Pizza Maison",        prices: [{ label:"L", value:750 },{ label:"XL", value:1500 },{ label:"XXL", value:3000 }], extra: "Tomate + Olive + Viande Hachée + Champignon + Poulet + Fromage + Herbers" },
      { id: "pr-roy",  name: "Pizza Royale",        prices: [{ label:"L", value:900 },{ label:"XL", value:1800 },{ label:"XXL", value:3600 }], extra: "Tomate + Olive + Fromage + Crevette + Thone + Herbers" },
      { id: "pr-4sa",  name: "Pizza 4 Saisons",     prices: [{ label:"L", value:900 },{ label:"XL", value:1800 },{ label:"XXL", value:3600 }], extra: "Tomate + Olive + Thone + Champignon + Viande Hachée + Poulet + Herbers" },
    ],
  },
  {
    key: "pizza-tranche", label: "PIZZA TRANCHE",
    items: [
      { id: "pt-thon", name: "¼ Pizza Thon",        prices: [{ label:"¼", value:200 }] },
      { id: "pt-fro",  name: "¼ Pizza Fromage",     prices: [{ label:"¼", value:200 }] },
      { id: "pt-bre",  name: "¼ Pizza Bresaola",    prices: [{ label:"¼", value:200 }], extra: "لحم مجفف" },
      { id: "pt-veg",  name: "¼ Pizza Végétarien",  prices: [{ label:"¼", value:200 }] },
      { id: "pt-mex",  name: "¼ Pizza Mexican",     prices: [{ label:"¼", value:200 }], extra: "لحم مفروم" },
      { id: "pt-pep",  name: "¼ Pizza Pepperoni",   prices: [{ label:"¼", value:200 }], extra: "نقانق لحم رقيقة" },
      { id: "pt-roy",  name: "¼ Pizza Royal",       prices: [{ label:"¼", value:200 }], extra: "لحم مفروم + فطر" },
      { id: "pt-nap",  name: "¼ Pizza Napolitaine", prices: [{ label:"¼", value:200 }], extra: "جبن + طماطم" },
      { id: "pt-pou",  name: "¼ Pizza Poulet",      prices: [{ label:"¼", value:200 }] },
      { id: "pt-tra",  name: "Tranche Pizza",       prices: [{ label:"STD", value:50  }] },
    ],
  },
];

/* ─────────────────────────────────────────────────────────────────────────
   JUS NATUREL SECTION
   ───────────────────────────────────────────────────────────────────────── */
const JUS_ITEMS = [
  {
    id: "jus-orange", num: "01", name: "ORANGE", subtitle: "Fraîcheur Pure",
    color: "#ff8c00", shadow: "rgba(255,140,0,0.45)", bg: "rgba(255,140,0,0.06)",
    border: "rgba(255,140,0,0.35)",
    items: ["100% Pur Jus", "Pressé à froid"],
    price: 150, oldPrice: 200, discount: 25,
    img: "/juices/orange.png", blend: "normal",
  },
  {
    id: "jus-citron", num: "02", name: "CITRON", subtitle: "Acidité & Vitalité",
    color: "#d4e600", shadow: "rgba(212,230,0,0.40)", bg: "rgba(212,230,0,0.05)",
    border: "rgba(212,230,0,0.30)",
    items: ["Citron Frais", "Menthe & Miel"],
    price: 150, oldPrice: 180, discount: 17,
    img: "/juices/citron.png", blend: "normal",
  },
  {
    id: "jus-fraise", num: "03", name: "FRAISE", subtitle: "Douceur & Plaisir",
    color: "#ff2055", shadow: "rgba(255,32,85,0.45)", bg: "rgba(255,32,85,0.06)",
    border: "rgba(255,32,85,0.35)",
    items: ["Fraises Fraîches", "Lait ou Eau"],
    price: 200, oldPrice: 250, discount: 20,
    img: "/juices/fraise.png", blend: "normal",

  },
  {
    id: "jus-banane", num: "04", name: "BANANE", subtitle: "Énergie Naturelle",
    color: "#ffd000", shadow: "rgba(255,208,0,0.40)", bg: "rgba(255,208,0,0.05)",
    border: "rgba(255,208,0,0.30)",
    items: ["Banane Mûre", "Lait Entier"],
    price: 170, oldPrice: 200, discount: 15,
    img: "/juices/banane.png", blend: "normal",
  },
  {
    id: "jus-pomme", num: "05", name: "POMME", subtitle: "Légèreté & Santé",
    color: "#39ff14", shadow: "rgba(57,255,20,0.40)", bg: "rgba(57,255,20,0.05)",
    border: "rgba(57,255,20,0.28)",
    items: ["Pomme Verte", "Gingembre Frais"],
    price: 150, oldPrice: 180, discount: 17,
    img: "/juices/pomme.png", blend: "normal",
  },
  {
    id: "jus-cocktail", num: "06", name: "COCKTAIL", subtitle: "Mix de Saveurs",
    color: "#c84bff", shadow: "rgba(200,75,255,0.45)", bg: "rgba(200,75,255,0.06)",
    border: "rgba(200,75,255,0.35)",
    items: ["Fruits Mixtes", "Boost Vitaminé"],
    price: 220, oldPrice: 280, discount: 21,
    img: "/juices/cocktail.png", blend: "normal",
  },
];

/* Real juice image with background-removal blend mode */
function JuiceImage({
  img, color, name, blend,
}: {
  img: string; color: string; name: string; blend: string;
}) {
  return (
    <div className="relative flex items-center justify-center w-full" style={{ height: 160 }}>
      {/* Soft colour glow behind the glass */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 55% at 50% 60%, ${color}28 0%, transparent 75%)`,
          filter: "blur(18px)",
        }}
      />
      {/* Product image */}
      <img
        src={img}
        alt={`Jus ${name}`}
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "center bottom",
          mixBlendMode: blend as React.CSSProperties["mixBlendMode"],
          filter:
            blend === "multiply"
              ? "brightness(1.85) saturate(1.25) contrast(1.05)"
              : blend === "screen"
              ? "brightness(1.05) saturate(1.1)"
              : "drop-shadow(0 8px 18px rgba(0,0,0,0.55))",
          userSelect: "none",
        }}
      />
    </div>
  );
}

function JusNaturelSection() {
  const { addItem } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const activeIdxRef = useRef(0);
  activeIdxRef.current = activeIdx;
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAdd = useCallback((juice: typeof JUS_ITEMS[0]) => {
    addItem({ id: juice.id, name: `Jus ${juice.name}`, nameAr: "", price: juice.price, img: "", category: "jus" });
    setAddedId(juice.id);
    setTimeout(() => setAddedId(null), 900);
  }, [addItem]);

  /* Scroll to a specific card index */
  const scrollToIdx = useCallback((idx: number) => {
    const track = trackRef.current;
    if (!track) return;
    const cards = track.querySelectorAll<HTMLElement>("[data-jus-card]");
    const card = cards[idx];
    if (!card) return;
    track.scrollTo({ left: card.offsetLeft - 20, behavior: "smooth" });
    setActiveIdx(idx);
  }, []);

  const goNext = useCallback(() => {
    const next = (activeIdxRef.current + 1) % JUS_ITEMS.length;
    scrollToIdx(next);
  }, [scrollToIdx]);

  const goPrev = useCallback(() => {
    const prev = (activeIdxRef.current - 1 + JUS_ITEMS.length) % JUS_ITEMS.length;
    scrollToIdx(prev);
  }, [scrollToIdx]);

  /* Pause for a fixed duration then resume — clears any pending timer first */
  const pauseFor = useCallback((ms: number) => {
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    setPaused(true);
    pauseTimerRef.current = setTimeout(() => setPaused(false), ms);
  }, []);

  /* Cleanup any dangling pause timer on unmount */
  useEffect(() => () => { if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current); }, []);

  /* Auto-play every 3.5 s — paused on hover */
  useEffect(() => {
    if (paused) return;
    const id = setInterval(goNext, 3500);
    return () => clearInterval(id);
  }, [paused, goNext]);

  /* Scroll snap observer to update active dot */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const cards = Array.from(track.querySelectorAll<HTMLElement>("[data-jus-card]"));
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = cards.indexOf(e.target as HTMLElement);
            if (idx >= 0) setActiveIdx(idx);
          }
        });
      },
      { root: track, threshold: 0.55 },
    );
    cards.forEach((c) => obs.observe(c));
    return () => obs.disconnect();
  }, []);

  /* GSAP entrance */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".jus-card", {
        scrollTrigger: { trigger: sectionRef.current, start: "top 80%", once: true },
        y: 50, opacity: 0, duration: 0.7, stagger: 0.1, ease: "power3.out",
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="jus-section" className="relative z-20 bg-[#050505] overflow-hidden pb-20">

      {/* ── top separator */}
      <div className="max-w-3xl mx-auto px-5 pt-16 pb-0 flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#39ff14]/20" />
        <span className="font-mono text-[9px] uppercase tracking-[0.55em] text-white/20">Boissons Fraîches</span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#39ff14]/20" />
      </div>

      {/* ── Section heading + arrows */}
      <div className="max-w-3xl mx-auto px-5 pt-10 pb-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[9px] text-white/20 uppercase tracking-widest mb-2">Catégorie</p>
            <h2
              className="text-3xl sm:text-4xl font-black uppercase leading-none tracking-tight"
              style={{ color: "#39ff14", textShadow: "0 0 30px rgba(57,255,20,0.3)" }}
            >
              Jus Naturel
            </h2>
            <p className="mt-2 text-[11px] text-white/35 font-mono tracking-widest uppercase">
              🌿 Pressés Frais · Sans Additifs
            </p>
          </div>

          {/* Prev / Next arrows */}
          <div className="flex items-center gap-2 pb-1">
            {[{ fn: goPrev, d: "M15 18l-6-6 6-6" }, { fn: goNext, d: "M9 18l6-6-6-6" }].map(({ fn, d }, i) => (
              <button
                key={i}
                onClick={() => { pauseFor(6000); fn(); }}
                className="flex items-center justify-center rounded-full transition-all duration-200 active:scale-90"
                style={{
                  width: 38, height: 38,
                  background: "rgba(57,255,20,0.07)",
                  border: "1px solid rgba(57,255,20,0.25)",
                  color: "#39ff14",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(57,255,20,0.18)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 14px rgba(57,255,20,0.35)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(57,255,20,0.07)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={d} />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Horizontal scroll track */}
      <div
        ref={trackRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => { if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current); setPaused(true); }}
        onTouchEnd={() => pauseFor(4000)}
        className="flex gap-4 overflow-x-auto scrollbar-none px-5 pb-4 snap-x snap-mandatory"
        style={{ scrollPaddingLeft: "20px" }}
      >
        {/* Left edge spacer so first card aligns with page content */}
        <div className="flex-shrink-0 w-0" />

        {JUS_ITEMS.map((juice, i) => {
          const added = addedId === juice.id;
          return (
            <div
              key={juice.id}
              data-jus-card
              className="jus-card flex-shrink-0 snap-start flex flex-col"
              style={{
                width: 220,
                borderRadius: 20,
                background: `linear-gradient(160deg, ${juice.bg}, rgba(5,5,5,0.95) 60%)`,
                border: `1px solid ${juice.border}`,
                boxShadow: `0 0 32px ${juice.shadow}, inset 0 0 24px ${juice.bg}`,
                padding: "18px 16px 20px",
                position: "relative",
                isolation: "isolate",
              }}
            >
              {/* Corner glow */}
              <div
                className="absolute -top-6 -left-6 w-28 h-28 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, ${juice.shadow} 0%, transparent 65%)`, opacity: 0.6, zIndex: -1 }}
              />

              {/* ── Top row: number only */}
              <div className="flex items-center justify-end mb-4">
                <span className="font-mono text-[11px] font-bold" style={{ color: `${juice.color}80` }}>
                  {juice.num.padStart(2, "0")}
                </span>
              </div>

              {/* ── Juice photo */}
              <div className="flex justify-center items-center mb-3 w-full" style={{ height: 160 }}>
                <JuiceImage img={juice.img} color={juice.color} name={juice.name} blend={juice.blend} />
              </div>

              {/* ── Name & subtitle */}
              <div className="mb-3">
                <p
                  className="text-base font-black uppercase leading-tight tracking-wide"
                  style={{ color: juice.color, textShadow: `0 0 16px ${juice.shadow}` }}
                >
                  {juice.name}
                </p>
                <p className="text-[10px] text-white/40 font-mono mt-0.5">{juice.subtitle}</p>
              </div>

              {/* ── Items list */}
              <div
                className="rounded-xl px-3 py-2.5 mb-4 space-y-1.5"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                {juice.items.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: juice.color }} />
                    <span className="text-[11px] text-white/65">{item}</span>
                  </div>
                ))}
              </div>

              {/* ── Pricing + CTA */}
              <div className="mt-auto">
                <p className="text-[11px] font-mono text-white/30 line-through mb-0.5">
                  {juice.oldPrice} DA
                </p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-2xl font-black leading-none" style={{ color: juice.color }}>
                    {juice.price}
                    <span className="text-xs font-mono font-normal text-white/40 ml-1">DA</span>
                  </span>
                  <button
                    onClick={() => handleAdd(juice)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black transition-all duration-200 active:scale-95"
                    style={{
                      background: added ? juice.color : `${juice.color}22`,
                      border: `1px solid ${juice.border}`,
                      color: added ? "#000" : juice.color,
                      boxShadow: added ? `0 0 16px ${juice.shadow}` : "none",
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    {added ? "✓" : "أضف"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Right edge padding */}
        <div className="flex-shrink-0 w-4" />
      </div>

      {/* ── Dot pagination */}
      <div className="flex justify-center gap-1.5 mt-5">
        {JUS_ITEMS.map((j, i) => (
          <button
            key={j.id}
            onClick={() => {
              const track = trackRef.current;
              if (!track) return;
              const cards = track.querySelectorAll<HTMLElement>("[data-jus-card]");
              cards[i]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
            }}
            style={{
              width: i === activeIdx ? 20 : 6,
              height: 6,
              borderRadius: 3,
              background: i === activeIdx ? j.color : "rgba(255,255,255,0.15)",
              boxShadow: i === activeIdx ? `0 0 8px ${j.shadow}` : "none",
              transition: "all 0.3s ease",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          />
        ))}
      </div>

      {/* ── bottom label */}
      <div className="max-w-3xl mx-auto px-5 mt-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/5" />
        <span className="font-mono text-[9px] uppercase tracking-[0.55em] text-white/10">
          {String(activeIdx + 1).padStart(2, "0")} — {JUS_ITEMS[activeIdx].name}
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/5" />
      </div>

    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   MENU SECTION
   ───────────────────────────────────────────────────────────────────────── */
function HomeMenuSection() {
  const [activeKey, setActiveKey] = useState("tacos-gratine");
  const [addedKey, setAddedKey]   = useState<string | null>(null);
  const { addItem } = useCart();

  const cat = HOME_CATS.find((c) => c.key === activeKey)!;

  const handleAdd = useCallback((item: HMItem, price: HMPrice) => {
    const cartId = `${item.id}-${price.label}`;
    addItem({ id: cartId, name: `${item.name}${price.label !== "STD" ? ` (${price.label})` : ""}`, nameAr: "", price: price.value, img: "", category: "menu" });
    setAddedKey(cartId);
    setTimeout(() => setAddedKey(null), 900);
  }, [addItem]);

  return (
    <section id="menu-section" className="relative z-20 bg-[#050505]">

      {/* ── section label ── */}
      <div className="max-w-3xl mx-auto px-5 pt-16 pb-0 flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#39ff14]/20" />
        <span className="font-mono text-[9px] uppercase tracking-[0.55em] text-white/20">Notre Menu</span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#39ff14]/20" />
      </div>

      {/* ── tab bar ── */}
      <div className="sticky top-14 sm:top-[60px] z-40 bg-[#050505]/96 backdrop-blur-xl border-b border-white/5 mt-6">
        <div className="flex overflow-x-auto scrollbar-none max-w-3xl mx-auto">
          {HOME_CATS.map((c) => {
            const active = c.key === activeKey;
            return (
              <button
                key={c.key}
                onClick={() => setActiveKey(c.key)}
                className="relative flex-shrink-0 flex flex-col items-center gap-0.5 px-3.5 py-3 transition-all duration-200 whitespace-nowrap group"
              >
                <span
                  className="leading-none flex items-center justify-center transition-colors duration-200"
                  style={{ color: active ? "#39ff14" : "rgba(255,255,255,0.25)" }}
                >
                  {MENU_ICONS[c.key]}
                </span>
                <span
                  className="text-[9px] font-black uppercase tracking-[0.15em] transition-colors duration-200"
                  style={{ color: active ? "#39ff14" : "rgba(255,255,255,0.22)" }}
                >
                  {c.label.split(" ")[0]}
                </span>
                {active && (
                  <span
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                    style={{ background: "#39ff14", boxShadow: "0 0 8px #39ff14" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── category title ── */}
      <div className="max-w-3xl mx-auto px-5 pt-8 pb-5 flex items-center justify-between gap-6">
        <div className="min-w-0">
          <p className="font-mono text-[9px] text-white/20 uppercase tracking-widest mb-1">Catégorie</p>
          <h2
            className="text-3xl sm:text-4xl font-black uppercase leading-none tracking-tight mb-2"
            style={{ color: "#39ff14", textShadow: "0 0 30px rgba(57,255,20,0.3)" }}
          >
            {cat.label}
          </h2>
          {cat.extra && (
            <span className="inline-block text-[10px] font-mono px-2.5 py-1 border border-[#ff6a00]/30 text-[#ff6a00] bg-[#ff6a00]/5 whitespace-nowrap">
              + {cat.extra}
            </span>
          )}
        </div>
        {cat.img && (
          <img
            key={cat.key}
            src={cat.img}
            alt={cat.label}
            className="flex-shrink-0 object-contain"
            style={{
              height: "88px",
              width: "auto",
              filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.7))",
            }}
          />
        )}
      </div>

      {/* ── items ── */}
      <div className="max-w-3xl mx-auto px-5 pb-16 space-y-0">
        {cat.items.map((item, idx) => (
          <div
            key={item.id}
            className="group"
            style={{ borderTop: idx === 0 ? "1px solid rgba(255,255,255,0.05)" : undefined, borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            {/* item name */}
            <div className="flex items-baseline justify-between pt-4 pb-2 gap-3">
              <div>
                <span className="text-white font-bold text-sm sm:text-[15px] group-hover:text-white/90 transition-colors">
                  {item.name}
                </span>
                {item.extra && (
                  <span className="ml-2 text-[10px] font-mono text-white/25 italic">{item.extra}</span>
                )}
              </div>
              {item.prices.length === 1 && (
                <span className="text-[#39ff14] font-mono font-black text-sm flex-shrink-0">
                  {item.prices[0].value} <span className="text-white/30 text-[10px] font-normal">DA</span>
                </span>
              )}
            </div>

            {/* sizes */}
            <div className={`${item.prices.length === 1 ? "hidden" : "flex flex-wrap gap-2"} pb-4`}>
              {item.prices.length > 1 && item.prices.map((p) => {
                const k = `${item.id}-${p.label}`;
                const added = addedKey === k;
                return (
                  <button
                    key={p.label}
                    onClick={() => handleAdd(item, p)}
                    className="flex items-center gap-2 px-3 py-1.5 transition-all duration-200"
                    style={{
                      border: added ? "1px solid #39ff14" : "1px solid rgba(255,255,255,0.1)",
                      background: added ? "rgba(57,255,20,0.1)" : "rgba(255,255,255,0.03)",
                    }}
                  >
                    <span
                      className="text-[10px] font-black font-mono"
                      style={{ color: added ? "#39ff14" : "#ff6a00" }}
                    >
                      {p.label}
                    </span>
                    <span className="text-white/70 text-xs font-mono">{p.value} DA</span>
                    <span
                      className="text-xs font-black w-4 text-center"
                      style={{ color: added ? "#39ff14" : "rgba(255,255,255,0.4)" }}
                    >
                      {added ? "✓" : "+"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* single-price add button */}
            {item.prices.length === 1 && (() => {
              const p = item.prices[0];
              const k = `${item.id}-${p.label}`;
              const added = addedKey === k;
              return (
                <div className="pb-4">
                  <button
                    onClick={() => handleAdd(item, p)}
                    className="flex items-center gap-2 px-3 py-1.5 transition-all duration-200"
                    style={{
                      border: added ? "1px solid #39ff14" : "1px solid rgba(255,255,255,0.1)",
                      background: added ? "rgba(57,255,20,0.1)" : "rgba(255,255,255,0.03)",
                    }}
                  >
                    <span className="text-xs font-mono text-white/40">{added ? "✓ Added" : "+ Add to cart"}</span>
                  </button>
                </div>
              );
            })()}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   HERO SECTION
══════════════════════════════════════════════════════════════════════ */
function HeroSection({ active }: { active: boolean }) {
  const sectionRef   = useRef<HTMLElement>(null);
  const imageRef     = useRef<HTMLDivElement>(null);
  const topBarRef    = useRef<HTMLDivElement>(null);
  const bottomRef    = useRef<HTMLDivElement>(null);
  const scrollCueRef = useRef<HTMLDivElement>(null);

  const reducedMotion = typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 3D tilt on dish image — suppressed for reduced-motion */
  const onImageMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    const el = imageRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    gsap.to(el, { rotateY: x * 20, rotateX: -y * 15, duration: 0.45, ease: "power2.out", overwrite: "auto" });
  }, [reducedMotion]);
  const onImageLeave = useCallback(() => {
    if (reducedMotion) return;
    gsap.to(imageRef.current, { rotateY: 0, rotateX: 0, duration: 1.1, ease: "elastic.out(1, 0.4)", overwrite: "auto" });
  }, [reducedMotion]);

  useEffect(() => {
    if (!active) return;

    /* Scope all animations to the section element */
    const ctx = gsap.context(() => {

      if (reducedMotion) {
        /* Skip motion — just reveal immediately */
        gsap.set([topBarRef.current, ".hero-line-inner", imageRef.current,
          ".hero-sub", ".hero-cta", bottomRef.current], { opacity: 1, y: 0, scale: 1 });
        return;
      }

      /* Entrance timeline */
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(topBarRef.current,          { y: -20, opacity: 0, duration: 0.65 }, 0.05);
      tl.from(".hero-line-inner",         { y: "120%", duration: 0.9, stagger: 0.09 }, 0.15);
      tl.from(imageRef.current,           { scale: 0.85, opacity: 0, rotateY: 14, duration: 1.2, ease: "expo.out" }, 0.28);
      tl.from([".hero-sub", ".hero-cta"], { y: 26, opacity: 0, duration: 0.7, stagger: 0.1 }, 0.7);
      tl.from(bottomRef.current,          { y: 14, opacity: 0, duration: 0.55 }, 0.9);

      /* Scroll-cue bob loop */
      gsap.to(scrollCueRef.current, {
        y: 9, duration: 1.4, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 2,
      });

      /* Scroll pin + parallax exit (desktop only) */
      if (window.innerWidth >= 768) {
        const exitTl = gsap.timeline()
          .to(".hero-bg-img",      { scale: 1.1, opacity: 0, ease: "none" }, 0)
          .to(".hero-title-group", { y: -65, opacity: 0, ease: "none" }, 0)
          .to(imageRef.current,    { scale: 0.9, opacity: 0, ease: "none" }, 0)
          .to(bottomRef.current,   { y: 20, opacity: 0, ease: "none" }, 0);

        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: "top top",
          end: "+=85%",
          pin: true,
          pinSpacing: false,
          scrub: true,
          animation: exitTl,
        });
      }

    }, sectionRef);

    return () => ctx.revert();
  }, [active, reducedMotion]);

  return (
    <section ref={sectionRef} className="hero-section relative h-[100svh] w-full overflow-hidden">

      {/* ── Background ── */}
      <img
        src="/hero-main.png" alt="" aria-hidden
        className="hero-bg-img absolute inset-0 w-full h-full object-cover object-center"
        style={{ transform: "scale(1.06)", transformOrigin: "center center" }}
      />
      {/* Dark base */}
      <div className="absolute inset-0 bg-black/58 pointer-events-none" />
      {/* Bottom vignette (text legibility) */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 130% 80% at 50% 105%, rgba(10,10,10,0.98) 0%, rgba(10,10,10,0.5) 55%, transparent 80%)" }} />
      {/* Left vignette (title legibility) */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(95deg, rgba(10,10,10,0.75) 0%, rgba(10,10,10,0.35) 45%, transparent 65%)" }} />
      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,rgba(255,255,255,1) 0px,rgba(255,255,255,1) 1px,transparent 1px,transparent 4px)", backgroundSize: "100% 4px" }} />
      {/* Top-edge green gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, rgba(57,255,20,0.5) 30%, rgba(57,255,20,0.5) 70%, transparent)" }} />

      {/* ── Top bar ── */}
      <div ref={topBarRef} className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 sm:px-10 pt-[72px] pb-3 pointer-events-none">
        {/* Live status */}
        <div className="flex items-center gap-2.5">
          <span
            className="w-[7px] h-[7px] rounded-full flex-shrink-0"
            style={{ background: "#39ff14", boxShadow: "0 0 8px #39ff14, 0 0 18px rgba(57,255,20,0.4)", animation: "hero-dot-pulse 2.2s ease-in-out infinite" }}
          />
          <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.5em] text-white/40">
            Ouvert · Alger Centre
          </span>
        </div>

        {/* Scroll cue */}
        <div ref={scrollCueRef} className="hidden sm:flex flex-col items-center gap-1.5">
          <span className="font-mono text-[8px] uppercase tracking-[0.55em] text-white/20">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/28 to-transparent" />
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="absolute inset-0 flex items-center justify-between px-5 sm:px-10 md:px-14 pt-24 pb-20 z-10">

        {/* Left — title block */}
        <div className="hero-title-group flex flex-col justify-center flex-1 min-w-0 pt-44 sm:pt-20">

          {/* Eyebrow */}
          <div className="overflow-hidden mb-5 sm:mb-6">
            <div className="hero-line-inner flex items-center gap-3">
              <span className="w-5 h-px flex-shrink-0"
                style={{ background: "#39ff14", boxShadow: "0 0 6px #39ff14" }} />
              <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.6em] text-[#39ff14]/60">
                Est. 2024 · بسكرة مقابل هوتيل سلامي
              </span>
            </div>
          </div>

          {/* Headline — 3 lines, each clipped */}
          <h1 className="font-black uppercase leading-[0.9] tracking-tighter mb-6 sm:mb-8">
            {(["BORN", "IN THE", "STREETS."] as Array<"BORN"|"IN THE"|"STREETS.">).map((line, i) => (
              <div key={line} className="overflow-hidden">
                <div
                  className="hero-line-inner"
                  style={{
                    fontSize: "clamp(4rem, 9.5vw, 7.8rem)",
                    color: i === 2 ? "#39ff14" : "#ffffff",
                    textShadow: i === 2
                      ? "0 0 45px rgba(57,255,20,0.6), 0 0 90px rgba(57,255,20,0.2)"
                      : "0 4px 32px rgba(0,0,0,0.75)",
                  }}
                >
                  {line}
                </div>
              </div>
            ))}
          </h1>

          {/* Arabic subtitle */}
          <p className="hero-sub font-light tracking-wide text-white/38 mb-8 sm:mb-10"
            style={{ fontSize: "clamp(1rem, 1.7vw, 1.1rem)" }}>
            الذوق الأصيل — لا تسويات، لا اختصارات.
          </p>

          {/* CTA */}
          <div className="hero-cta mt-10 sm:mt-0">
            <button
              onClick={() => document.getElementById("menu-section")?.scrollIntoView({ behavior: "smooth" })}
              className="group relative flex items-center gap-3 px-10 py-4 sm:px-14 sm:py-5 font-black uppercase tracking-[0.3em] text-black overflow-hidden cursor-pointer"
              style={{
                background: "#39ff14",
                fontSize: "clamp(0.72rem, 1.1vw, 0.875rem)",
                clipPath: "polygon(12px 0%,100% 0%,calc(100% - 12px) 100%,0% 100%)",
              }}
            >
              <span className="relative z-10">THE MENU</span>
              <span className="relative z-10 text-[#0a0a0a]/55 font-mono text-xs tracking-widest">↓ القائمة</span>
              <span
                className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0"
                style={{ background: "#ff6a00" }}
              />
            </button>
          </div>
        </div>

        {/* Right — 3D floating dish (hidden on mobile) */}
        <div
          ref={imageRef}
          className="hero-img-frame hidden md:flex items-center justify-center relative flex-shrink-0 ml-8 lg:ml-14 cursor-pointer"
          style={{ transformStyle: "preserve-3d", willChange: "transform" }}
          onMouseMove={onImageMove}
          onMouseLeave={onImageLeave}
        >
          {/* Neon corner brackets — TL */}
          <div className="absolute -top-3 -left-3 w-8 h-8 pointer-events-none z-20">
            <div className="absolute top-0 left-0 w-full h-px" style={{ background: "#39ff14", boxShadow: "0 0 8px #39ff14" }} />
            <div className="absolute top-0 left-0 w-px h-full" style={{ background: "#39ff14", boxShadow: "0 0 8px #39ff14" }} />
          </div>
          {/* TR */}
          <div className="absolute -top-3 -right-3 w-8 h-8 pointer-events-none z-20">
            <div className="absolute top-0 right-0 w-full h-px" style={{ background: "#39ff14", boxShadow: "0 0 8px #39ff14" }} />
            <div className="absolute top-0 right-0 w-px h-full" style={{ background: "#39ff14", boxShadow: "0 0 8px #39ff14" }} />
          </div>
          {/* BL */}
          <div className="absolute -bottom-3 -left-3 w-8 h-8 pointer-events-none z-20">
            <div className="absolute bottom-0 left-0 w-full h-px" style={{ background: "#ff6a00", boxShadow: "0 0 8px #ff6a00" }} />
            <div className="absolute bottom-0 left-0 w-px h-full" style={{ background: "#ff6a00", boxShadow: "0 0 8px #ff6a00" }} />
          </div>
          {/* BR */}
          <div className="absolute -bottom-3 -right-3 w-8 h-8 pointer-events-none z-20">
            <div className="absolute bottom-0 right-0 w-full h-px" style={{ background: "#ff6a00", boxShadow: "0 0 8px #ff6a00" }} />
            <div className="absolute bottom-0 right-0 w-px h-full" style={{ background: "#ff6a00", boxShadow: "0 0 8px #ff6a00" }} />
          </div>

          {/* Radial glow */}
          <div className="absolute -inset-12 pointer-events-none z-0"
            style={{ background: "radial-gradient(ellipse 65% 60% at 50% 55%, rgba(57,255,20,0.13) 0%, transparent 70%)" }} />

          {/* Dish image */}
          <img
            src="/pita-hero.png"
            alt="Pita Pit 2 — Signature Wrap"
            className="relative z-10 object-contain"
            style={{
              height: "clamp(320px, 52vh, 560px)",
              width: "auto",
              filter: "drop-shadow(0 30px 70px rgba(0,0,0,0.95)) drop-shadow(0 0 30px rgba(57,255,20,0.1))",
            }}
          />

          {/* Orange badge */}
          <div
            className="absolute bottom-4 -right-1 z-20 px-3 py-1.5 font-black uppercase tracking-[0.22em] text-black text-[9px] sm:text-[10px]"
            style={{ background: "#ff6a00" }}
          >
            SIGNATURE
          </div>
        </div>
      </div>

      {/* ── Bottom info strip ── */}
      <div ref={bottomRef} className="absolute bottom-0 left-0 right-0 z-20 border-t border-white/[0.07]">
        <div className="flex items-center justify-between px-5 sm:px-10 py-3 gap-4">
          <div className="flex-1 overflow-hidden min-w-0">
            <div style={{ display: "flex", animation: "strip-rtl 18s linear infinite", width: "max-content" }}>
              {[...Array(3)].flatMap((_, rep) =>
                (["Tacos", "Fajitas", "Pizza Bwagy", "Soufflée", "Malfouf"] as const).map((item, i) => (
                  <React.Fragment key={`${rep}-${item}`}>
                    {(rep > 0 || i > 0) && <span className="w-1 h-1 rounded-full bg-white/14 mx-4 sm:mx-6 flex-shrink-0 self-center" />}
                    <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.38em] text-white/20 flex-shrink-0">
                      {item}
                    </span>
                  </React.Fragment>
                ))
              )}
            </div>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-[0.32em] text-white/20 flex-shrink-0 hidden sm:block">
            12:00 → 01:00
          </span>
        </div>
      </div>

      <style>{`
        @keyframes hero-dot-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        @keyframes strip-rtl {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SITE FOOTER
══════════════════════════════════════════════════════════════════════ */
function SiteFooter() {
  const col0 = useRef<HTMLDivElement>(null);
  const col1 = useRef<HTMLDivElement>(null);
  const col2 = useRef<HTMLDivElement>(null);
  const col3 = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cols = [col0.current, col1.current, col2.current, col3.current].filter(Boolean) as HTMLElement[];
    gsap.set(cols, { y: 48, opacity: 0 });
    const trig = ScrollTrigger.create({
      trigger: col0.current,
      start: "top 90%",
      once: true,
      onEnter: () =>
        gsap.to(cols, { y: 0, opacity: 1, duration: 1, stagger: 0.13, ease: "power3.out" }),
    });

    // bottom bar fade
    let barTrig: ReturnType<typeof ScrollTrigger.create> | undefined;
    if (barRef.current) {
      gsap.set(barRef.current, { opacity: 0 });
      barTrig = ScrollTrigger.create({
        trigger: barRef.current,
        start: "top 95%",
        once: true,
        onEnter: () => gsap.to(barRef.current, { opacity: 1, duration: 1.2, ease: "power2.out" }),
      });
    }

    return () => { trig.kill(); barTrig?.kill(); };
  }, []);

  const marqueeItems = [
    "PITA PIT 2", "STREET FOOD ELEVATED", "بسكرة مقابل هوتيل سلامي",
    "EST. 2024", "TASTE THE NIGHT", "FAIT MAISON", "نكهة الليل", "BISKRA",
  ];
  const track = [...marqueeItems, ...marqueeItems, ...marqueeItems];

  const menuItems = ["Tacos Gratiné", "Tacos Classique", "Fajitas", "Soufflée", "Malfouf", "Pizza Bwagy", "Boissons"];
  const socials = [
    {
      name: "Instagram",
      handle: "@2pitapit",
      href: "https://www.instagram.com/2pitapit/",
      path: "M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zM17.5 6.5h.01M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5z",
    },
    {
      name: "TikTok",
      handle: "@pita.pit266",
      href: "https://www.tiktok.com/@pita.pit266",
      path: "M9 12a4 4 0 104 4V4a5 5 0 005 5",
    },
    {
      name: "Facebook",
      handle: "Pita Pit 2",
      href: "https://web.facebook.com/Pita02Pit/",
      path: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z",
    },
  ];

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const goMenu   = () => document.getElementById("menu-section")?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      {/* ── Pre-footer CTA ──────────────────────────────────────────────── */}
      <section className="relative py-28 sm:py-44 px-4 z-20 bg-black overflow-hidden flex flex-col items-center justify-center">
        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 60%, rgba(57,255,20,0.07) 0%, transparent 70%)" }} />
        {/* Scanlines */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.022]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg,#fff 0px,#fff 1px,transparent 1px,transparent 4px)", backgroundSize: "100% 4px" }} />

        <LineReveal
          tag="h2"
          className="text-4xl sm:text-6xl md:text-8xl font-black uppercase text-center mb-14 z-10 relative"
          lines={[
            "Taste",
            <span key="tn" style={{ color: "#39ff14", textShadow: "0 0 40px rgba(57,255,20,0.6)" }}>the Night</span>,
          ]}
        />

        <MagneticBtn
          onClick={goMenu}
          className="cta-outer relative group px-12 py-4 sm:px-20 sm:py-5 bg-transparent border-2 border-[#39ff14] text-[#39ff14] font-black uppercase tracking-[0.22em] text-sm sm:text-base overflow-hidden z-10 cursor-pointer"
        >
          <div className="absolute inset-0 bg-[#39ff14] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] z-0" />
          <span className="relative z-10 group-hover:text-black transition-colors duration-200 delay-100">Order Now →</span>
        </MagneticBtn>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="relative bg-[#050505] overflow-hidden">

        {/* Top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent 0%, rgba(57,255,20,0.5) 25%, rgba(255,106,0,0.5) 75%, transparent 100%)" }} />

        {/* Background noise texture */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "256px 256px",
          }} />

        {/* ── Marquee ─────────────────────────────────────────── */}
        <div className="overflow-hidden border-b border-white/[0.045] py-[18px]">
          <div className="flex whitespace-nowrap" style={{ animation: "footer-marquee 44s linear infinite" }}>
            {track.map((item, i) => (
              <span key={i} className="flex-shrink-0 flex items-center">
                <span className="font-black uppercase text-[11px] sm:text-xs tracking-[0.5em] text-white/[0.11] px-8 sm:px-11">
                  {item}
                </span>
                <span
                  className="flex-shrink-0 w-[5px] h-[5px] rounded-full"
                  style={{
                    background: i % 2 === 0 ? "#39ff14" : "#ff6a00",
                    opacity: 0.5,
                    boxShadow: `0 0 7px ${i % 2 === 0 ? "#39ff14" : "#ff6a00"}`,
                  }}
                />
              </span>
            ))}
          </div>
        </div>

        {/* ── Main grid ───────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-16 pb-16 sm:pt-20 sm:pb-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-6">

          {/* Brand — 5 cols ── */}
          <div ref={col0} className="sm:col-span-2 lg:col-span-5">
            {/* Neon logotype */}
            <div className="mb-7">
              <p
                className="font-black uppercase leading-[0.9] tracking-tighter select-none"
                style={{
                  fontSize: "clamp(3.5rem, 8vw, 5.5rem)",
                  color: "#39ff14",
                  textShadow: "0 0 25px rgba(57,255,20,0.75), 0 0 55px rgba(57,255,20,0.4), 0 0 110px rgba(57,255,20,0.18)",
                  animation: "neon-flicker 9s ease-in-out infinite",
                }}
              >
                PITA<br />PIT 2
              </p>
              <p className="font-mono text-[9px] uppercase tracking-[0.55em] text-white/20 mt-3">
                Street Food Elevated&nbsp;·&nbsp;بسكرة مقابل هوتيل سلامي
              </p>
            </div>

            <p className="text-sm text-white/35 leading-[1.85] max-w-[290px] mb-10">
              Né dans les ruelles d'Alger, Pita Pit 2 réinvente le street food
              avec des ingrédients frais, une flamme vive, et une nuit qui ne
              finit jamais.
            </p>

            {/* Contact details */}
            <div className="space-y-4">
              {(
                [
                  {
                    d: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                    label: "حي العالية · مقابل اتال سلامي",
                  },
                  {
                    d: "M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10zm1-10.41V7h-2v5.59l3.71 3.7 1.41-1.41L13 11.59z",
                    label: "Lun – Sam  ·  12:00 → 01:00",
                  },
                  {
                    d: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 012 1.18 2 2 0 014 .99h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z",
                    label: "0697 747 974  ·  0799 232 810",
                  },
                ] as { d: string; label: string }[]
              ).map(({ d, label }) => (
                <div key={label} className="flex items-start gap-3">
                  <svg
                    width="14" height="14" viewBox="0 0 24 24"
                    fill="none" stroke="#39ff14" strokeWidth="1.6"
                    strokeLinecap="round" strokeLinejoin="round"
                    className="flex-shrink-0 mt-0.5 opacity-55"
                  >
                    <path d={d} />
                  </svg>
                  <span className="font-mono text-[11px] text-white/32 tracking-wide leading-relaxed">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Spacer */}
          <div className="hidden lg:block lg:col-span-1" />

          {/* Menu — 3 cols ── */}
          <div ref={col1} className="lg:col-span-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.55em] text-[#ff6a00]/55 mb-8">Menu</p>
            <ul className="space-y-[13px]">
              {menuItems.map((item) => (
                <li key={item}>
                  <button
                    onClick={goMenu}
                    className="group flex items-center gap-3.5 cursor-pointer w-full text-left"
                  >
                    <span className="h-px bg-white/10 group-hover:bg-[#ff6a00] transition-all duration-300 flex-shrink-0"
                      style={{ width: "12px" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.width = "22px"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.width = "12px"; }}
                    />
                    <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/28 group-hover:text-white/70 transition-colors duration-200">
                      {item}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            {/* Divider */}
            <div className="mt-10 pt-10 border-t border-white/[0.05]">
              <p className="font-mono text-[9px] uppercase tracking-[0.55em] text-[#ff6a00]/55 mb-4">Horaires</p>
              <div className="space-y-1.5">
                {[
                  ["Lundi – Samedi", "12:00 – 01:00"],
                  ["Dimanche", "Fermé"],
                ].map(([day, time]) => (
                  <div key={day} className="flex justify-between items-center">
                    <span className="font-mono text-[10px] text-white/25 uppercase tracking-[0.15em]">{day}</span>
                    <span
                      className="font-mono text-[10px] tracking-wide"
                      style={{ color: time === "Fermé" ? "rgba(255,255,255,0.18)" : "#39ff14", opacity: time === "Fermé" ? 1 : 0.65 }}
                    >
                      {time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Social / CTA — 3 cols ── */}
          <div ref={col2} className="lg:col-span-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.55em] text-[#ff6a00]/55 mb-8">Suivre</p>

            <div className="space-y-5 mb-10">
              {socials.map(({ name, handle, href, path }) => (
                <a key={name} href={href} target="_blank" rel="noopener noreferrer" aria-label={`Suivre sur ${name}`} className="group flex items-center gap-4 cursor-pointer">
                  <div
                    className="w-9 h-9 border flex-shrink-0 flex items-center justify-center transition-all duration-300"
                    style={{ borderColor: "rgba(255,255,255,0.07)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,106,0,0.45)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; }}
                  >
                    <svg
                      width="15" height="15" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round"
                      className="text-white/28 group-hover:text-[#ff6a00] transition-colors duration-300"
                    >
                      <path d={path} />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/38 group-hover:text-white/80 transition-colors duration-200">{name}</div>
                    <div className="font-mono text-[9px] text-white/18 group-hover:text-[#ff6a00]/60 transition-colors duration-200 mt-0.5">{handle}</div>
                  </div>
                </a>
              ))}
            </div>

            {/* Commander CTA */}
            <button
              onClick={goMenu}
              className="group relative w-full py-4 border overflow-hidden cursor-pointer transition-colors duration-300"
              style={{ borderColor: "rgba(57,255,20,0.22)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(57,255,20,0.65)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(57,255,20,0.22)"; }}
            >
              <div
                className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500"
                style={{ background: "linear-gradient(135deg, #39ff14 0%, #6dff3a 100%)" }}
              />
              <span className="relative z-10 font-black uppercase tracking-[0.32em] text-[10px] text-[#39ff14] group-hover:text-black transition-colors duration-200">
                Commander →
              </span>
            </button>

            {/* QR-code placeholder */}
            <div className="mt-8 flex items-center gap-3 p-3 border border-white/[0.045]">
              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center" style={{ background: "rgba(57,255,20,0.06)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#39ff14" strokeWidth="1.4" strokeLinecap="round" opacity="0.45">
                  <rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/>
                  <path d="M14 3h1v2M21 14h-2M14 21v-1M16 16h5v5h-2v-3h-3M16 16v-2M21 11v1"/>
                </svg>
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/22 leading-relaxed">
                  Scan pour commander<br />
                  <span style={{ color: "#39ff14", opacity: 0.45 }}>pitapit2.dz</span>
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* ── Bottom bar ──────────────────────────────────────── */}
        <div ref={barRef} className="border-t border-white/[0.05]">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <p className="font-mono text-[9px] uppercase tracking-[0.38em] text-white/18">
              © 2024 – {new Date().getFullYear()} Pita Pit 2. Tous droits réservés.
            </p>
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.32em] text-white/18">
              <span>Crafted in</span>
              <span className="text-sm leading-none">🇩🇿</span>
              <span>Algiers</span>
            </div>
            <button
              onClick={scrollTop}
              className="group flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.38em] text-white/18 hover:text-[#39ff14] transition-colors duration-300 cursor-pointer"
            >
              <span>Back to top</span>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>
          </div>
        </div>

        <style>{`
          @keyframes footer-marquee {
            from { transform: translateX(0); }
            to   { transform: translateX(-33.333%); }
          }
          @keyframes neon-flicker {
            0%, 18%, 22%, 25%, 53%, 57%, 100% {
              text-shadow: 0 0 25px rgba(57,255,20,0.75), 0 0 55px rgba(57,255,20,0.4), 0 0 110px rgba(57,255,20,0.18);
            }
            20%, 24%, 55% {
              text-shadow: 0 0 10px rgba(57,255,20,0.3);
              opacity: 0.92;
            }
          }
          @media (prefers-reduced-motion: reduce) {
            .footer-marquee-track { animation: none !important; }
            .neon-logo { animation: none !important; }
          }
        `}</style>
      </footer>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   HOME
══════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const containerRef  = useRef<HTMLDivElement>(null);
  const introRef      = useRef<HTMLDivElement>(null);
  const introVideoRef = useRef<HTMLVideoElement>(null);
  const [introGone, setIntroGone] = useState(false);


  /* ── INTRO VIDEO ───────────────────────────────────────────────────── */
  const dismissIntro = useCallback(() => {
    const intro = introRef.current;
    if (!intro) { setIntroGone(true); return; }
    gsap.to(intro, {
      opacity: 0, duration: 0.6, ease: "power2.in",
      onComplete: () => setIntroGone(true),
    });
  }, []);

  /* ── MAIN SCROLL ANIMATIONS ─────────────────────────────────────────── */
  useEffect(() => {
    if (!introGone) return;
    const mobile = isMobile();

    const lenis = new Lenis({
      duration: mobile ? 0.9 : 1.3,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: mobile ? 2.2 : 1,
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {

      /* Fire parallax */
      if (!mobile) {
        gsap.to(".parallax-img", {
          scrollTrigger: { trigger: ".fire-section", start: "top bottom", end: "bottom top", scrub: true },
          y: "22%", ease: "none",
        });
      }

      /* Food cards 3D rotate-in */
      gsap.utils.toArray<HTMLElement>(".food-card").forEach((el, i) => {
        gsap.from(el, {
          scrollTrigger: { trigger: ".food-section", start: "top 68%" },
          rotateX: mobile ? 0 : 58, y: mobile ? 55 : 95, opacity: 0,
          transformOrigin: "50% 100% -80px", duration: 1, delay: i * 0.16, ease: "power3.out",
        });
      });

      /* Wrap image depth emerge */
      gsap.from(".wrap-reveal", {
        scrollTrigger: { trigger: ".wrap-reveal", start: "top 80%" },
        scale: 0.85, opacity: 0, duration: 1.7, ease: "expo.out",
      });

      /* CTA glow pulse — deferred until element scrolls into view */
      ScrollTrigger.create({
        trigger: ".cta-outer",
        start: "top 90%",
        once: true,
        onEnter: () => {
          gsap.to(".cta-outer", {
            boxShadow: "0 0 55px rgba(57,255,20,0.5), 0 0 110px rgba(57,255,20,0.15)",
            duration: 1.9, repeat: -1, yoyo: true, ease: "sine.inOut",
          });
        },
      });

      /* Stats bars */
      gsap.utils.toArray<HTMLElement>(".stat-bar-fill").forEach((el) => {
        gsap.from(el, {
          scrollTrigger: { trigger: ".stats-section", start: "top 72%" },
          scaleX: 0, transformOrigin: "left", duration: 1.8,
          ease: "power3.out", delay: 0.2,
        });
      });

    }, containerRef);

    return () => { ctx.revert(); lenis.destroy(); };
  }, [introGone]);

  return (
    <>
      <Nav />
      <Cart />
      {/* Film Grain */}
      <div className="grain-overlay" aria-hidden="true" />

      {/* ══ INTRO VIDEO ══════════════════════════════════════════════════ */}
      {!introGone && (
        <div ref={introRef} className="fixed inset-0 z-[1000] bg-black">
          <video
            ref={introVideoRef}
            autoPlay
            muted
            playsInline
            onEnded={dismissIntro}
            className="w-full h-full object-cover"
          >
            <source src="https://res.cloudinary.com/dbfwcmtt8/video/upload/q_auto,f_auto/0523_xqvdyj.mp4" type="video/mp4" />
            <source src="https://res.cloudinary.com/dbfwcmtt8/video/upload/q_auto/0523_xqvdyj.webm" type="video/webm" />
          </video>
          {/* skip button */}
          <button
            onClick={dismissIntro}
            className="absolute bottom-8 right-6 font-mono text-[10px] tracking-[0.4em] uppercase text-white/30 hover:text-white/70 transition-colors duration-200 cursor-pointer"
          >
            Skip ›
          </button>
        </div>
      )}

      {/* ══ MAIN ═════════════════════════════════════════════════════════ */}
      <div ref={containerRef} className="bg-[#0a0a0a] text-white min-h-screen overflow-x-hidden"
        style={{ fontFamily: "'Space Grotesk','Inter',sans-serif", perspective: "1400px" }}>

        {/* 1 ── HERO ──────────────────────────────────────────────────── */}
        <HeroSection active={introGone} />

        {/* 3 ── VIBE ─────────────────────────────────────────────────────── */}
        <section className="relative w-full flex items-center justify-center py-16 sm:py-20 px-5 z-20 bg-[#0a0a0a]" style={{ perspective: "1400px" }}>
          <div className="max-w-5xl w-full">
            <LineReveal tag="h2"
              className="text-[2.3rem] sm:text-5xl md:text-[6.5rem] font-black leading-[1.04] uppercase tracking-tighter"
              lines={[
                <span>We don&rsquo;t just</span>,
                <span>make&nbsp;<span style={{ color: "#39ff14", textShadow: "0 0 35px rgba(57,255,20,0.5)" }}>wraps.</span></span>,
                <span>We&nbsp;<span style={{ color: "#ff6a00", textShadow: "0 0 30px rgba(255,7,58,0.5)" }}>ignite</span>&nbsp;them.</span>,
              ]}
            />
            <LineReveal tag="div"
              className="mt-10 border-l-4 border-[#39ff14] pl-5 max-w-lg"
              staggerDelay={0.04}
              lines={[
                <p className="text-sm sm:text-base md:text-lg text-white/50 leading-relaxed">
                  Michelin-star precision meets the raw, unapologetic pulse of the night market. This is the evolution of street food.
                </p>,
              ]}
            />
          </div>
        </section>

        {/* 3.5 ── MENU LIST ───────────────────────────────────────────────── */}
        <div id="menu-section">
          <HomeMenuSection />
        </div>

        {/* 4 ── JUS NATUREL ───────────────────────────────────────────────── */}
        <JusNaturelSection />

        {/* 5.5 ── PITA HERO FULL BLEED ──────────────────────────────────── */}
        <section className="relative h-[80vh] sm:h-[100vh] w-full overflow-hidden z-20 bg-[#050505]">
          <img src="/pita-hero.png" alt="Pita Pit 2 signature wrap"
            className="absolute inset-0 w-full h-full object-cover object-center"
            style={{ filter: "saturate(1.1) brightness(0.75)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]" />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#050505]/50" />
          {/* Neon logo overlay */}
          <div className="absolute inset-0 flex flex-col items-start justify-center px-6 sm:px-16 md:px-24">
            <div className="max-w-xs sm:max-w-md">
              <img src="/logo-neon-rain.png" alt="Pita Pit 2"
                className="w-full max-w-[320px] sm:max-w-[440px] h-auto object-contain mb-6"
                style={{ mixBlendMode: "screen", filter: "drop-shadow(0 0 30px rgba(57,255,20,0.5))" }}
              />
              <LineReveal tag="p"
                className="text-sm sm:text-lg md:text-xl text-white/70 leading-relaxed font-light"
                staggerDelay={0.05}
                lines={[
                  "Hand-crafted. Fire-kissed.",
                  <span style={{ color: "#39ff14" }}>Legendarily yours.</span>,
                ]}
              />
            </div>
          </div>
        </section>

        {/* 6 ── FIRE ─────────────────────────────────────────────────────── */}
        <section className="fire-section relative h-[88vh] sm:h-[108vh] w-full overflow-hidden z-20 bg-[#0a0a0a]">
          <div className="absolute inset-0 h-[120%] -top-[10%]">
            <img src={meatImg} alt="" className="parallax-img w-full h-full object-cover opacity-48" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]" />
          </div>
          <div className="absolute inset-0 flex items-center justify-end px-5 sm:px-16 md:px-28" style={{ perspective: "1200px" }}>
            <div className="max-w-[260px] sm:max-w-md text-right">
              <LineReveal tag="h3"
                className="text-4xl sm:text-6xl md:text-8xl font-black uppercase"
                lines={[
                  "Born in",
                  <span style={{ color: "#ff6a00", textShadow: "0 0 45px rgba(255,7,58,0.65)" }}>Fire</span>,
                ]}
              />
              <LineReveal tag="p"
                className="mt-4 text-sm sm:text-lg text-white/55 leading-relaxed font-light"
                staggerDelay={0.04}
                lines={["Sizzling spits, open flames,", "and the intoxicating scent", "of spice on the grill."]}
              />
            </div>
          </div>
        </section>

        {/* 7 ── STATS ─────────────────────────────────────────────────────── */}
        <section className="stats-section relative py-16 sm:py-24 px-5 z-20 bg-[#050505] border-y border-white/6">
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
            {[
              { value: 2024, suffix: "", label: "Founded", bar: 100 },
              { value: 500,  suffix: "+", label: "Wraps per day", bar: 85 },
              { value: 1,    suffix: "",  label: "Legendary taste", bar: 100 },
            ].map((s, i) => (
              <div key={i} className="space-y-3">
                <div className="text-5xl sm:text-6xl md:text-7xl font-black text-white" style={{ fontVariantNumeric: "tabular-nums" }}>
                  <StatNumber target={s.value} suffix={s.suffix} />
                </div>
                <div className="text-xs sm:text-sm uppercase tracking-[0.3em] text-white/40 font-mono">{s.label}</div>
                <div className="h-px w-full bg-white/8 relative overflow-hidden">
                  <div className="stat-bar-fill absolute inset-y-0 left-0 bg-[#39ff14]" style={{ width: `${s.bar}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 11 ── MASTERPIECE CARDS ─────────────────────────────────────────── */}
        <section className="food-section relative py-20 sm:py-32 px-4 z-20 bg-[#050505]" style={{ perspective: "1600px" }}>
          <div className="max-w-7xl mx-auto text-center mb-14 sm:mb-20">
            <LineReveal tag="h2"
              className="text-4xl sm:text-6xl md:text-8xl font-black uppercase tracking-tighter"
              lines={["The", <span style={{ color: "#ff6a00", textShadow: "0 0 45px rgba(255,7,58,0.4)" }}>Masterpiece</span>]}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-7xl mx-auto">
            <Card3D title="The Foundation" desc="Hand-stretched, impossibly soft pita, charred just right." index={0} />
            <Card3D title="The Payload"    desc="Heavily spiced, perfectly caramelized shawarma carved fresh." index={1} />
            <Card3D title="The Spark"      desc="Neon-bright garlic toum and pickled wild cucumbers." index={2} />
          </div>
          <div className="wrap-reveal mt-16 sm:mt-24 w-full h-[48vw] min-h-[200px] max-h-[58vh] relative max-w-7xl mx-auto overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#ff6a00]/8 to-[#39ff14]/8 blur-3xl" />
            <img src={wrapImg} alt="loaded wrap" className="w-full h-full object-cover relative z-10" />
          </div>
        </section>

        {/* A ── ABOUT ────────────────────────────────────────────────────── */}
        <section className="relative py-24 sm:py-36 px-5 z-20 bg-[#0a0a0a] overflow-hidden">
          {/* background accent */}
          <div className="absolute top-0 left-0 w-[60vw] h-px bg-gradient-to-r from-transparent via-[#39ff14]/30 to-transparent" />
          <div className="absolute bottom-0 right-0 w-[60vw] h-px bg-gradient-to-l from-transparent via-[#ff6a00]/20 to-transparent" />
          <div className="absolute top-1/2 -translate-y-1/2 -left-40 w-[500px] h-[500px] rounded-full bg-[#39ff14]/3 blur-[120px] pointer-events-none" />

          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
            {/* Left */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.45em] text-[#39ff14]/70 mb-4">قصتنا — Notre Histoire</p>
              <LineReveal tag="h2"
                className="text-4xl sm:text-5xl md:text-7xl font-black uppercase leading-[1.0] tracking-tighter mb-8"
                lines={[
                  "Born",
                  <span>from&nbsp;<span style={{ color: "#ff6a00", textShadow: "0 0 35px rgba(255,106,0,0.55)" }}>Passion.</span></span>,
                  <span>Forged&nbsp;<span style={{ color: "#39ff14", textShadow: "0 0 35px rgba(57,255,20,0.5)" }}>in Fire.</span></span>,
                ]}
              />
              <LineReveal tag="div"
                className="space-y-4 border-l-2 border-[#39ff14]/40 pl-5"
                staggerDelay={0.04}
                lines={[
                  <p className="text-sm sm:text-base text-white/50 leading-relaxed">
                    Pita Pit 2 est né en 2024 d'une vraie passion pour la street food authentique — aucun compromis sur les ingrédients, aucun raccourci sur la qualité.
                  </p>,
                  <p className="text-sm sm:text-base text-white/50 leading-relaxed mt-3">
                    Chaque pièce qui sort de notre cuisine est préparée avec soin : pâte fraîche, viande grillée au feu de bois, et sauces secrètes développées après des centaines d'essais.
                  </p>,
                  <p className="text-sm sm:text-base text-white/50 leading-relaxed mt-3">
                    Nous ne sommes pas qu'un restaurant — nous sommes une expérience qui n'arrive qu'une fois par nuit.
                  </p>,
                ]}
              />
            </div>

            {/* Right — 4 value cards */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { icon: <Flame size={22} strokeWidth={1.5} />, title: "La Flamme", en: "Open Flame", desc: "Viande grillée sur feu véritable, chaque jour" },
                { icon: <Leaf size={22} strokeWidth={1.5} />, title: "Le Frais", en: "Fresh Daily", desc: "Ingrédients frais chaque matin, sans exception" },
                { icon: <Zap size={22} strokeWidth={1.5} />, title: "La Vitesse", en: "Fast & Hot", desc: "Votre commande prête avant que vous le réalisiez" },
                { icon: <ShieldCheck size={22} strokeWidth={1.5} />, title: "La Qualité", en: "No Shortcuts", desc: "Aucun compromis — la qualité est une ligne rouge" },
              ].map((v, i) => (
                <div key={i}
                  className="group relative bg-[#0d0d0d] border border-white/6 p-5 sm:p-6 overflow-hidden hover:border-[#39ff14]/30 transition-colors duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#39ff14]/0 to-[#39ff14]/0 group-hover:from-[#39ff14]/4 transition-all duration-500" />
                  <div className="text-[#39ff14]/80 mb-3">{v.icon}</div>
                  <div className="font-black text-base sm:text-lg text-white mb-0.5">{v.title}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-[#39ff14]/60 mb-2">{v.en}</div>
                  <p className="text-xs sm:text-sm text-white/40 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* B ── GALLERY ──────────────────────────────────────────────────── */}
        <section className="relative py-16 sm:py-24 z-20 bg-[#050505] overflow-hidden">
          <div className="px-5 mb-10 sm:mb-14">
            <p className="font-mono text-[10px] uppercase tracking-[0.45em] text-[#ff6a00]/70 mb-3">المعرض — Galerie</p>
            <LineReveal tag="h2"
              className="text-3xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter"
              lines={[
                "The",
                <span style={{ color: "#39ff14", textShadow: "0 0 40px rgba(57,255,20,0.45)" }}>Visual</span>,
                "Experience",
              ]}
            />
          </div>

          {/* mosaic grid */}
          <div className="px-4 sm:px-6 grid grid-cols-12 grid-rows-2 gap-2 sm:gap-3 h-[70vw] sm:h-[55vw] max-h-[640px]">
            {/* big left */}
            <div className="col-span-5 row-span-2 relative overflow-hidden group gallery-item">
              <img src="/hero-main.png" alt="Pita Pit 2" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#39ff14]">Pita Pit 2</span>
              </div>
            </div>
            {/* top mid */}
            <div className="col-span-4 row-span-1 relative overflow-hidden group gallery-item">
              <img src={wrapImg} alt="Wrap" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#39ff14]">The Wrap</span>
              </div>
            </div>
            {/* top right */}
            <div className="col-span-3 row-span-1 relative overflow-hidden group gallery-item">
              <img src={meatImg} alt="Grilled meat" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ objectPosition: "center 30%" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#ff6a00]">Grilled</span>
              </div>
            </div>
            {/* bottom mid+right */}
            <div className="col-span-7 row-span-1 relative overflow-hidden group gallery-item">
              <img src="/pita-hero.png" alt="Pita hero" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#39ff14]">Signature Pita</span>
              </div>
            </div>
          </div>
        </section>

        {/* 12 ── FOOTER ─────────────────────────────────────────────────── */}
        <SiteFooter />

      </div>
    </>
  );
}
