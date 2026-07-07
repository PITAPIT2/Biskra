import React, { createContext, useContext, useState, useEffect } from "react";
import { readBin, getBinId } from "../lib/jsonbin";

/* ── shared types (used by Home.tsx and Admin) ──────────────────────────── */
export interface JuiceItem {
  id: string; num: string; name: string; subtitle: string;
  color: string; shadow: string; bg: string; border: string;
  items: string[]; price: number; oldPrice: number;
  img: string; blend: string;
}
export interface MenuPrice    { label: string; value: number; }
export interface MenuItem     { id: string; name: string; prices: MenuPrice[]; extra?: string; }
export interface MenuCategory { key: string; label: string; img?: string; extra?: string; items: MenuItem[]; }
export interface MenuData     { juices: JuiceItem[]; categories: MenuCategory[]; initialized: boolean; }

const MenuContext = createContext<MenuData>({ juices: [], categories: [], initialized: false });

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<MenuData>({ juices: [], categories: [], initialized: false });

  useEffect(() => {
    const binId = getBinId();
    if (!binId) return; // No bin yet → Home.tsx uses its own hardcoded defaults
    readBin()
      .then((d) => {
        const m = d as MenuData | null;
        if (m?.juices?.length) setData({ ...m, initialized: true });
      })
      .catch(() => { /* silent — Home.tsx hardcoded fallback still active */ });
  }, []);

  return <MenuContext.Provider value={data}>{children}</MenuContext.Provider>;
}

export const useMenu = () => useContext(MenuContext);
