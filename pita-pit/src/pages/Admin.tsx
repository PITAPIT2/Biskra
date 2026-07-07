import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  getDb,
  collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy,
  type Unsubscribe,
} from "../lib/firebase";
import {
  setMasterKey, clearMasterKey, getBinId,
  createBin, readBin, updateBin,
  isAdminAuthed, setAdminAuthed, clearAdminAuthed,
} from "../lib/jsonbin";
import { SEED_DATA, type SeedJuice, type SeedCategory, type SeedItem } from "../lib/seed";

/* ─── Types ────────────────────────────────────────────────────────────── */
type OrderStatus = "pending" | "confirmed" | "done" | "cancelled";
interface OrderItem { id: string; name: string; price: number; qty: number; }
interface Order {
  id: string; customerName: string; phone: string; location: string;
  items: OrderItem[]; subtotal: number; status: OrderStatus;
  createdAt: { seconds?: number; toDate?: () => Date } | string | null;
}
type Tab = "orders" | "jus" | "menu";

/* ─── Tiny helpers ─────────────────────────────────────────────────────── */
const G = "#39ff14";
const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: "#f59e0b", confirmed: "#3b82f6", done: "#22c55e", cancelled: "#6b7280",
};
const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "En attente", confirmed: "Confirmée", done: "Terminée", cancelled: "Annulée",
};

function timeAgo(raw: Order["createdAt"]): string {
  let d: Date | null = null;
  if (!raw) return "";
  if (typeof raw === "string") d = new Date(raw);
  else if (typeof raw === "object" && "seconds" in raw && raw.seconds) d = new Date(raw.seconds * 1000);
  else if (typeof raw === "object" && "toDate" in raw && raw.toDate) d = raw.toDate();
  if (!d) return "";
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}

const btn = (color = G, fill = false) => ({
  padding: "5px 12px", borderRadius: 8, cursor: "pointer", fontSize: 11,
  fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.05em",
  border: `1px solid ${color}`,
  background: fill ? color : "transparent",
  color: fill ? "#000" : color,
  transition: "all .15s",
});

/* ─── Notification sound (Web Audio API) ──────────────────────────────── */
function playOrderAlert() {
  try {
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.8, ctx.currentTime);
    master.connect(ctx.destination);

    // Three rising tones — punchy alert feel
    const tones = [
      { freq: 520, start: 0,    dur: 0.18 },
      { freq: 660, start: 0.18, dur: 0.18 },
      { freq: 880, start: 0.36, dur: 0.32 },
    ];
    tones.forEach(({ freq, start, dur }) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.connect(gain);
      gain.connect(master);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    });

    // Low thump underneath
    const thump = ctx.createOscillator();
    const thumpGain = ctx.createGain();
    thump.type = "sine";
    thump.frequency.setValueAtTime(110, ctx.currentTime);
    thump.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.25);
    thumpGain.gain.setValueAtTime(1, ctx.currentTime);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    thump.connect(thumpGain);
    thumpGain.connect(master);
    thump.start(ctx.currentTime);
    thump.stop(ctx.currentTime + 0.25);

    setTimeout(() => ctx.close(), 1200);
  } catch { /* browser blocked autoplay — ignore */ }
}

/* ─── Mini toast ───────────────────────────────────────────────────────── */
function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: ok ? "rgba(57,255,20,0.12)" : "rgba(239,68,68,0.12)",
      border: `1px solid ${ok ? G : "#ef4444"}`,
      color: ok ? G : "#ef4444", padding: "10px 18px", borderRadius: 12,
      fontSize: 13, fontFamily: "monospace", fontWeight: 700,
      boxShadow: `0 0 20px ${ok ? "rgba(57,255,20,0.2)" : "rgba(239,68,68,0.2)"}`,
    }}>{msg}</div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ADMIN PAGE
═══════════════════════════════════════════════════════════════════════ */
export default function Admin() {
  /* ── auth ── */
  const [authed, setAuthed]   = useState(isAdminAuthed());
  const [keyInput, setKeyInput] = useState("");
  const [loginErr, setLoginErr] = useState("");

  /* ── global ── */
  const [tab, setTab] = useState<Tab>("orders");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── orders ── */
  const [orders, setOrders]       = useState<Order[]>([]);
  const unsubRef                  = useRef<Unsubscribe | null>(null);
  const knownIdsRef               = useRef<Set<string> | null>(null); // null = first load

  /* ── menu ── */
  const [juices, setJuices]           = useState<SeedJuice[]>([]);
  const [categories, setCategories]   = useState<SeedCategory[]>([]);
  const [menuLoaded, setMenuLoaded]   = useState(false);
  const [binId, setBinIdState]        = useState(getBinId());
  const [saving, setSaving]           = useState(false);

  /* ── juice edit ── */
  const [editJid, setEditJid]   = useState<string | null>(null);
  const [editJDraft, setEditJDraft] = useState<Partial<SeedJuice>>({});

  /* ── menu edit ── */
  const [selCat, setSelCat]         = useState(0);
  const [editIid, setEditIid]       = useState<string | null>(null);
  const [editIDraft, setEditIDraft] = useState<Partial<SeedItem>>({});


  /* ─── Login ──────────────────────────────────────────────────────── */
  const doLogin = async () => {
    const k = keyInput.trim();
    if (!k) { setLoginErr("Entrez le mot de passe"); return; }

    const finishLogin = () => {
      const jbKey = (import.meta.env.VITE_JSONBIN_KEY as string | undefined) || "";
      if (jbKey) setMasterKey(jbKey);
      setAdminAuthed();
      setAuthed(true);
      setLoginErr("");
    };

    const verifyClientSide = () => k === "pitapit22030";

    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "x-admin-token": k },
      });
      if (!res.ok) { setLoginErr("Mot de passe incorrect"); return; }
      finishLogin();
    } catch {
      // No API server (e.g. GitHub Pages) — verify client-side
      if (await verifyClientSide()) {
        finishLogin();
      } else {
        setLoginErr("Mot de passe incorrect");
      }
    }
  };

  /* ─── Orders subscription ────────────────────────────────────────── */
  const subscribeOrders = useCallback(() => {
    const db = getDb();
    if (!db) return;
    unsubRef.current?.();
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    unsubRef.current = onSnapshot(q, (snap) => {
      const incoming = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));

      // First snapshot → just record known IDs, no sound
      if (knownIdsRef.current === null) {
        knownIdsRef.current = new Set(incoming.map((o) => o.id));
      } else {
        // Detect genuinely new orders (not seen before)
        const hasNew = incoming.some((o) => !knownIdsRef.current!.has(o.id));
        if (hasNew) {
          playOrderAlert();
          incoming.forEach((o) => knownIdsRef.current!.add(o.id));
        }
      }

      setOrders(incoming);
    }, () => { /* ignore permission errors */ });
  }, []);

  useEffect(() => {
    if (authed) subscribeOrders();
    return () => { unsubRef.current?.(); };
  }, [authed, subscribeOrders]);

  /* ─── Load menu from JSONBIN ─────────────────────────────────────── */
  const loadMenu = useCallback(async () => {
    try {
      const data = await readBin() as { juices?: SeedJuice[]; categories?: SeedCategory[] } | null;
      if (data?.juices) { setJuices(data.juices); setCategories(data.categories ?? []); }
      else { setJuices([]); setCategories([]); }
      setMenuLoaded(true);
    } catch { setMenuLoaded(true); }
  }, []);

  useEffect(() => { if (authed && binId) loadMenu(); }, [authed, binId, loadMenu]);

  /* ─── Save menu to JSONBIN ───────────────────────────────────────── */
  const saveMenu = async (nextJuices = juices, nextCats = categories) => {
    setSaving(true);
    try {
      await updateBin({ juices: nextJuices, categories: nextCats });
      showToast("Sauvegardé ✓");
    } catch (e) { showToast(String(e), false); }
    finally { setSaving(false); }
  };

  /* ─── Init JSONBIN ───────────────────────────────────────────────── */
  const initJsonbin = async () => {
    setSaving(true);
    try {
      const id = await createBin(SEED_DATA);
      setBinIdState(id);
      setJuices(SEED_DATA.juices);
      setCategories(SEED_DATA.categories);
      setMenuLoaded(true);
      showToast(`Bin créé: ${id}`);
    } catch (e) { showToast(String(e), false); }
    finally { setSaving(false); }
  };

  /* ─── Order actions ──────────────────────────────────────────────── */
  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const db = getDb();
    if (!db) return;
    try { await updateDoc(doc(db, "orders", orderId), { status }); }
    catch (e) { showToast(String(e), false); }
  };
  const deleteOrder = async (orderId: string) => {
    const db = getDb();
    if (!db) return;
    try { await deleteDoc(doc(db, "orders", orderId)); }
    catch (e) { showToast(String(e), false); }
  };

  /* ─── Juice actions ──────────────────────────────────────────────── */
  const startEditJuice = (j: SeedJuice) => { setEditJid(j.id); setEditJDraft({ ...j }); };
  const cancelEditJuice = () => { setEditJid(null); setEditJDraft({}); };
  const saveJuice = async () => {
    const next = juices.map((j) => j.id === editJid ? { ...j, ...editJDraft } as SeedJuice : j);
    setJuices(next); cancelEditJuice(); await saveMenu(next, categories);
  };
  const deleteJuice = async (id: string) => {
    const next = juices.filter((j) => j.id !== id);
    setJuices(next); await saveMenu(next, categories);
  };
  const addJuice = async () => {
    const num = String(juices.length + 1).padStart(2, "0");
    const nj: SeedJuice = {
      id: `jus-new-${Date.now()}`, num, name: "NOUVEAU", subtitle: "Sous-titre",
      color: G, shadow: "rgba(57,255,20,0.4)", bg: "rgba(57,255,20,0.05)", border: "rgba(57,255,20,0.28)",
      items: ["Ingrédient 1"], price: 150, oldPrice: 200, img: "/juices/orange.png", blend: "normal",
    };
    const next = [...juices, nj]; setJuices(next);
    startEditJuice(nj); await saveMenu(next, categories);
  };

  /* ─── Menu item actions ──────────────────────────────────────────── */
  const startEditItem = (item: SeedItem) => { setEditIid(item.id); setEditIDraft({ ...item, prices: [...item.prices] }); };
  const cancelEditItem = () => { setEditIid(null); setEditIDraft({}); };
  const saveItem = async () => {
    const next = categories.map((c, ci) =>
      ci !== selCat ? c : { ...c, items: c.items.map((it) => it.id === editIid ? { ...it, ...editIDraft } as SeedItem : it) }
    );
    setCategories(next); cancelEditItem(); await saveMenu(juices, next);
  };
  const deleteItem = async (itemId: string) => {
    const next = categories.map((c, ci) =>
      ci !== selCat ? c : { ...c, items: c.items.filter((it) => it.id !== itemId) }
    );
    setCategories(next); await saveMenu(juices, next);
  };
  const addItem = async () => {
    const cat = categories[selCat];
    if (!cat) return;
    const ni: SeedItem = { id: `item-${Date.now()}`, name: "Nouveau plat", prices: [{ label: "STD", value: 0 }] };
    const next = categories.map((c, ci) => ci !== selCat ? c : { ...c, items: [...c.items, ni] });
    setCategories(next); startEditItem(ni); await saveMenu(juices, next);
  };

  /* ── Colours ── */
  const C = { bg: "#0d0d0d", card: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.08)", text: "rgba(255,255,255,0.9)", muted: "rgba(255,255,255,0.4)" };

  /* ═══ LOGIN SCREEN ════════════════════════════════════════════════ */
  if (!authed) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace" }}>
      <div style={{ width: 340, padding: 32, background: C.card, border: `1px solid ${C.border}`, borderRadius: 20 }}>
        <p style={{ color: C.muted, fontSize: 10, letterSpacing: "0.4em", textTransform: "uppercase", marginBottom: 8 }}>Pita Pit</p>
        <h1 style={{ color: G, fontSize: 24, fontWeight: 900, letterSpacing: "0.05em", marginBottom: 4 }}>ADMIN</h1>
        <p style={{ color: C.muted, fontSize: 11, marginBottom: 28 }}>Entrez le mot de passe pour accéder</p>
        <input
          type="password" value={keyInput} onChange={(e) => setKeyInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doLogin()}
          placeholder="••••••••••••" autoFocus
          style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.05)", border: `1px solid ${loginErr ? "#ef4444" : C.border}`, borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 13, outline: "none", marginBottom: 6 }}
        />
        {loginErr && <p style={{ color: "#ef4444", fontSize: 11, marginBottom: 10 }}>{loginErr}</p>}
        <button onClick={doLogin} style={{ ...btn(G, true), width: "100%", padding: "11px 0", fontSize: 13, borderRadius: 10, marginTop: 8 }}>
          Connexion →
        </button>
      </div>
    </div>
  );

  /* ═══ DASHBOARD ═══════════════════════════════════════════════════ */
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "orders", label: "Commandes", icon: "📋" },
    { id: "jus",    label: "Jus Cards",  icon: "🍹" },
    { id: "menu",   label: "Menu",       icon: "🍽️" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "monospace" }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.bg, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: G, fontWeight: 900, fontSize: 16, letterSpacing: "0.08em" }}>PITA PIT</span>
          <span style={{ color: C.muted, fontSize: 11 }}>Admin Dashboard</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {saving && <span style={{ color: G, fontSize: 11 }}>Sauvegarde...</span>}
          <button onClick={() => { clearMasterKey(); clearAdminAuthed(); setAuthed(false); }} style={{ ...btn("#ef4444"), fontSize: 11 }}>
            Déconnexion
          </button>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display: "flex", gap: 4, padding: "12px 20px", borderBottom: `1px solid ${C.border}`, overflowX: "auto" }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ ...btn(tab === t.id ? G : C.muted, tab === t.id), whiteSpace: "nowrap", padding: "6px 16px", fontSize: 12, display: "flex", alignItems: "center", gap: 6, position: "relative" }}>
            {t.icon} {t.label}
            {t.id === "orders" && pendingCount > 0 && (
              <span style={{ background: "#ef4444", color: "#fff", borderRadius: 99, fontSize: 10, padding: "1px 6px", fontWeight: 900 }}>{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ padding: "20px 20px 60px" }}>

        {/* ════ ORDERS ════════════════════════════════════════════ */}
        {tab === "orders" && (
          <div>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12, marginBottom: 20 }}>
              {([
                { label: "Total",      val: orders.length,                                      color: G },
                { label: "En attente", val: orders.filter(o=>o.status==="pending").length,   color: "#f59e0b" },
                { label: "Confirmées", val: orders.filter(o=>o.status==="confirmed").length, color: "#3b82f6" },
                { label: "Terminées",  val: orders.filter(o=>o.status==="done").length,      color: "#22c55e" },
              ] as const).map((s) => (
                <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
                  <p style={{ color: C.muted, fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 4 }}>{s.label}</p>
                  <p style={{ color: s.color, fontSize: 26, fontWeight: 900 }}>{s.val}</p>
                </div>
              ))}
            </div>

            {/* Orders list */}
            {orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: C.muted }}>Aucune commande pour le moment</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {orders.map((o) => (
                  <div key={o.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ background: `${STATUS_COLOR[o.status]}22`, color: STATUS_COLOR[o.status], border: `1px solid ${STATUS_COLOR[o.status]}66`, borderRadius: 99, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                          {STATUS_LABEL[o.status]}
                        </span>
                        <span style={{ color: G, fontWeight: 900 }}>{o.customerName}</span>
                        <span style={{ color: C.muted, fontSize: 11 }}>{o.phone}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: C.muted, fontSize: 11 }}>{timeAgo(o.createdAt)}</span>
                        <span style={{ color: G, fontWeight: 900 }}>{o.subtotal} DA</span>
                      </div>
                    </div>
                    <p style={{ color: C.muted, fontSize: 11, marginBottom: 8 }}>📍 {o.location}</p>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginBottom: 10 }}>
                      {o.items.map((it) => `${it.name} ×${it.qty}`).join(" · ")}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {o.status === "pending"   && <button style={btn("#3b82f6",true)} onClick={() => updateOrderStatus(o.id, "confirmed")}>✓ Confirmer</button>}
                      {o.status === "confirmed" && <button style={btn("#22c55e",true)} onClick={() => updateOrderStatus(o.id, "done")}>✓ Terminée</button>}
                      {o.status !== "cancelled" && o.status !== "done" && (
                        <button style={btn("#6b7280")} onClick={() => updateOrderStatus(o.id, "cancelled")}>✕ Annuler</button>
                      )}
                      <button style={btn("#ef4444")} onClick={() => deleteOrder(o.id)}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════ JUS ═══════════════════════════════════════════════ */}
        {tab === "jus" && (
          <div>
            {/* Status bar */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <span style={{ fontSize: 11, color: C.muted }}>
                JSONBIN: {binId ? <span style={{ color: G }}>● Initialisé ({binId.slice(0, 8)}…)</span> : <span style={{ color: "#f59e0b" }}>● Non initialisé</span>}
              </span>
              {!binId && (
                <button disabled={saving} onClick={initJsonbin} style={btn(G, true)}>
                  {saving ? "…" : "Initialiser JSONBIN"}
                </button>
              )}
              {binId && <button disabled={saving} onClick={() => saveMenu()} style={btn(G)}>{saving ? "…" : "Sauvegarder"}</button>}
              {binId && <button onClick={addJuice} style={btn("#3b82f6")}>+ Nouveau Jus</button>}
            </div>

            {!menuLoaded && binId && <p style={{ color: C.muted }}>Chargement…</p>}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
              {juices.map((j) => (
                <div key={j.id} style={{ background: `linear-gradient(160deg,${j.bg},rgba(5,5,5,0.95))`, border: `1px solid ${j.border}`, borderRadius: 16, padding: 16, position: "relative" }}>
                  {editJid === j.id ? (
                    /* ── Edit form ── */
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {(["name","subtitle","price","oldPrice"] as const).map((field) => (
                        <div key={field}>
                          <label style={{ color: C.muted, fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase" }}>{field}</label>
                          <input
                            value={String(editJDraft[field] ?? "")}
                            onChange={(e) => setEditJDraft((d) => ({ ...d, [field]: field==="price"||field==="oldPrice" ? Number(e.target.value) : e.target.value }))}
                            type={field==="price"||field==="oldPrice" ? "number" : "text"}
                            style={{ width: "100%", boxSizing: "border-box", background: "rgba(0,0,0,0.3)", border: `1px solid ${j.color}44`, borderRadius: 6, padding: "5px 8px", color: "#fff", fontSize: 12, outline: "none" }}
                          />
                        </div>
                      ))}
                      <div>
                        <label style={{ color: C.muted, fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase" }}>Ingrédients (une ligne par ingrédient)</label>
                        <textarea
                          value={(editJDraft.items ?? j.items).join("\n")}
                          onChange={(e) => setEditJDraft((d) => ({ ...d, items: e.target.value.split("\n").filter(Boolean) }))}
                          rows={3}
                          style={{ width: "100%", boxSizing: "border-box", background: "rgba(0,0,0,0.3)", border: `1px solid ${j.color}44`, borderRadius: 6, padding: "5px 8px", color: "#fff", fontSize: 12, outline: "none", resize: "vertical" }}
                        />
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={saveJuice}   style={btn(G, true)}>💾 Sauvegarder</button>
                        <button onClick={cancelEditJuice} style={btn(C.muted)}>✕</button>
                      </div>
                    </div>
                  ) : (
                    /* ── Display ── */
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div>
                          <p style={{ color: j.color, fontWeight: 900, fontSize: 16, letterSpacing: "0.06em" }}>{j.name}</p>
                          <p style={{ color: C.muted, fontSize: 11 }}>{j.subtitle}</p>
                        </div>
                        <span style={{ color: j.color, fontSize: 18, fontWeight: 900 }}>{j.price}<span style={{ fontSize: 11, color: C.muted }}> DA</span></span>
                      </div>
                      <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>{j.items.join(" · ")}</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => startEditJuice(j)} style={btn(j.color)}>✏️ Modifier</button>
                        <button onClick={() => deleteJuice(j.id)} style={btn("#ef4444")}>🗑</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {menuLoaded && juices.length === 0 && binId && (
                <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: C.muted }}>
                  Aucun jus. Cliquez sur «Nouveau Jus» pour commencer.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════ MENU ══════════════════════════════════════════════ */}
        {tab === "menu" && (
          <div>
            {/* Status bar */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 14 }}>
              {!binId && (
                <>
                  <span style={{ color: "#f59e0b", fontSize: 11 }}>● JSONBIN non initialisé — allez dans l'onglet Jus</span>
                  <button onClick={() => setTab("jus")} style={btn(G)}>→ Initialiser</button>
                </>
              )}
              {binId && <button disabled={saving} onClick={() => saveMenu()} style={btn(G)}>{saving ? "…" : "Sauvegarder"}</button>}
              {binId && categories[selCat] && <button onClick={addItem} style={btn("#3b82f6")}>+ Ajouter un plat</button>}
            </div>

            {/* Category tabs */}
            {categories.length > 0 && (
              <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 16 }}>
                {categories.map((c, ci) => (
                  <button key={c.key} onClick={() => { setSelCat(ci); cancelEditItem(); }}
                    style={{ ...btn(ci === selCat ? G : C.muted, ci === selCat), whiteSpace: "nowrap", padding: "4px 12px", fontSize: 11 }}>
                    {c.label}
                  </button>
                ))}
              </div>
            )}

            {/* Items table */}
            {categories[selCat] && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
                {categories[selCat].items.map((item, ii) => (
                  <div key={item.id} style={{ borderBottom: ii < categories[selCat].items.length - 1 ? `1px solid ${C.border}` : "none", padding: "10px 16px" }}>
                    {editIid === item.id ? (
                      /* ── Item edit ── */
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-start" }}>
                        <div style={{ flex: "1 1 160px" }}>
                          <label style={{ color: C.muted, fontSize: 10 }}>NOM</label>
                          <input value={editIDraft.name ?? ""} onChange={(e) => setEditIDraft((d) => ({ ...d, name: e.target.value }))}
                            style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.05)", border: `1px solid ${G}44`, borderRadius: 6, padding: "5px 8px", color: "#fff", fontSize: 12, outline: "none" }} />
                        </div>
                        {(editIDraft.prices ?? item.prices).map((p, pi) => (
                          <div key={pi} style={{ width: 90 }}>
                            <label style={{ color: C.muted, fontSize: 10 }}>{p.label} (DA)</label>
                            <input type="number" value={p.value}
                              onChange={(e) => setEditIDraft((d) => {
                                const prices = [...(d.prices ?? item.prices)];
                                prices[pi] = { ...prices[pi], value: Number(e.target.value) };
                                return { ...d, prices };
                              })}
                              style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.05)", border: `1px solid ${G}44`, borderRadius: 6, padding: "5px 8px", color: "#fff", fontSize: 12, outline: "none" }} />
                          </div>
                        ))}
                        <div style={{ display: "flex", gap: 6, alignSelf: "flex-end" }}>
                          <button onClick={saveItem} style={btn(G, true)}>💾</button>
                          <button onClick={cancelEditItem} style={btn(C.muted)}>✕</button>
                        </div>
                      </div>
                    ) : (
                      /* ── Item display ── */
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ flex: 1, minWidth: 120, fontSize: 13 }}>{item.name}</span>
                        <span style={{ color: C.muted, fontSize: 11 }}>
                          {item.prices.map((p) => `${p.label}: ${p.value} DA`).join(" · ")}
                        </span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => startEditItem(item)} style={btn(G)}>✏️</button>
                          <button onClick={() => deleteItem(item.id)} style={btn("#ef4444")}>🗑</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {categories[selCat].items.length === 0 && (
                  <p style={{ padding: 24, textAlign: "center", color: C.muted }}>Aucun plat dans cette catégorie</p>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
    </div>
  );
}
