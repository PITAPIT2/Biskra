import React, { createContext, useContext, useReducer, useMemo } from "react";

export interface CartItem {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  qty: number;
  img: string;
  category: string;
  badge?: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

type Action =
  | { type: "ADD"; item: Omit<CartItem, "qty"> }
  | { type: "INC"; id: string }
  | { type: "DEC"; id: string }
  | { type: "REMOVE"; id: string }
  | { type: "CLEAR" }
  | { type: "OPEN" }
  | { type: "CLOSE" };

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case "ADD": {
      const exists = state.items.find((i) => i.id === action.item.id);
      return {
        ...state,
        isOpen: true,
        items: exists
          ? state.items.map((i) => i.id === action.item.id ? { ...i, qty: i.qty + 1 } : i)
          : [...state.items, { ...action.item, qty: 1 }],
      };
    }
    case "INC":
      return { ...state, items: state.items.map((i) => i.id === action.id ? { ...i, qty: i.qty + 1 } : i) };
    case "DEC":
      return {
        ...state,
        items: state.items
          .map((i) => i.id === action.id ? { ...i, qty: i.qty - 1 } : i)
          .filter((i) => i.qty > 0),
      };
    case "REMOVE":
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };
    case "CLEAR":
      return { ...state, items: [] };
    case "OPEN":
      return { ...state, isOpen: true };
    case "CLOSE":
      return { ...state, isOpen: false };
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, "qty">) => void;
  incQty: (id: string) => void;
  decQty: (id: string) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  itemCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [], isOpen: false });

  const value = useMemo<CartContextValue>(() => ({
    items:      state.items,
    isOpen:     state.isOpen,
    addItem:    (item) => dispatch({ type: "ADD", item }),
    incQty:     (id)   => dispatch({ type: "INC", id }),
    decQty:     (id)   => dispatch({ type: "DEC", id }),
    removeItem: (id)   => dispatch({ type: "REMOVE", id }),
    clearCart:  ()     => dispatch({ type: "CLEAR" }),
    openCart:   ()     => dispatch({ type: "OPEN" }),
    closeCart:  ()     => dispatch({ type: "CLOSE" }),
    itemCount:  state.items.reduce((s, i) => s + i.qty, 0),
    subtotal:   state.items.reduce((s, i) => s + i.price * i.qty, 0),
  }), [state]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}
