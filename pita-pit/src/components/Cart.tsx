import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "../context/CartContext";
import Checkout from "./Checkout";

export default function Cart() {
  const { items, isOpen, closeCart, incQty, decQty, removeItem, clearCart, subtotal, itemCount } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const handleOrderSuccess = () => {
    clearCart();
    setCheckoutOpen(false);
    closeCart();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-[950] bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={closeCart}
            />

            {/* Drawer */}
            <motion.aside
              key="drawer"
              className="fixed top-0 right-0 h-full z-[960] flex flex-col bg-[#0a0a0a] border-l border-white/8 w-full max-w-[420px]"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              data-testid="cart-drawer"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
                <div>
                  <h2 className="text-base font-black uppercase tracking-widest text-white">طلبيتك</h2>
                  <p className="text-[10px] font-mono text-white/35 tracking-widest mt-0.5">
                    {itemCount} {itemCount === 1 ? "صنف" : "أصناف"}
                  </p>
                </div>
                <button
                  onClick={closeCart}
                  className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                  aria-label="Close cart"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </button>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <AnimatePresence initial={false}>
                  {items.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center justify-center h-full py-24 px-6 text-center"
                    >
                      <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center mb-4">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-white/20">
                          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.5"/>
                          <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                      </div>
                      <p className="text-white/30 text-sm font-mono uppercase tracking-widest">السلة فارغة</p>
                      <p className="text-white/18 text-xs mt-1 font-mono">أضف شيئاً من القائمة</p>
                    </motion.div>
                  ) : (
                    items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 250 }}
                        className="flex items-center gap-4 px-6 py-4 border-b border-white/5 group"
                      >
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-white truncate">{item.name}</p>
                          <p className="text-xs text-[#39ff14] font-mono mt-1">
                            {item.price} DA × {item.qty} ={" "}
                            <span className="text-white/80">{item.price * item.qty} DA</span>
                          </p>
                        </div>

                        {/* Qty controls */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => decQty(item.id)}
                            className="w-7 h-7 border border-white/15 text-white/60 hover:border-[#ff6a00]/60 hover:text-[#ff6a00] transition-colors flex items-center justify-center text-sm font-mono"
                            aria-label="Decrease"
                          >−</button>
                          <span className="w-6 text-center text-xs font-mono text-white">{item.qty}</span>
                          <button
                            onClick={() => incQty(item.id)}
                            className="w-7 h-7 border border-white/15 text-white/60 hover:border-[#39ff14]/60 hover:text-[#39ff14] transition-colors flex items-center justify-center text-sm font-mono"
                            aria-label="Increase"
                          >+</button>
                        </div>

                        {/* Delete */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-white/20 hover:text-[#ff6a00] transition-colors duration-200"
                          aria-label="Remove item"
                        >
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                            <path d="M2 2l9 9M11 2l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              {/* Drink upsell banner */}
              {items.length > 0 && !items.some((i) => i.id.startsWith("bo-")) && (
                <div className="mx-4 mb-3 mt-2 flex items-center gap-3 rounded-xl border border-[#39ff14]/20 bg-[#39ff14]/5 px-4 py-3">
                  <svg className="flex-shrink-0 w-6 h-6 text-[#39ff14]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {/* straw */}
                    <line x1="15" y1="2" x2="12" y2="8"/>
                    {/* lid rim */}
                    <path d="M6 8h12"/>
                    {/* cup trapezoid */}
                    <path d="M7 8l2 13h6l2-13"/>
                    {/* base line */}
                    <path d="M9.5 21h5"/>
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-[#39ff14] tracking-wide">مخصكش مشروب ؟</p>
                    <p className="text-[9px] font-mono text-white/30 mt-0.5">Pas de boisson dans votre commande</p>
                  </div>
                  <button
                    onClick={() => {
                      closeCart();
                      setTimeout(() => {
                        document.getElementById("menu-section")?.scrollIntoView({ behavior: "smooth" });
                        setTimeout(() => window.dispatchEvent(new CustomEvent("goto-boissons")), 400);
                      }, 300);
                    }}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-black rounded-lg"
                    style={{ background: "#39ff14", boxShadow: "0 0 10px rgba(57,255,20,0.3)" }}
                  >
                    AJOUTER →
                  </button>
                </div>
              )}

              {/* Footer */}
              {items.length > 0 && (
                <div className="border-t border-white/8 px-6 py-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-widest font-mono text-white/40">المجموع</span>
                    <span className="text-xl font-black text-white font-mono">{subtotal} DA</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-white/25">
                    <span>التوصيل</span>
                    <span>يُحسب عند التأكيد</span>
                  </div>

                  <motion.button
                    onClick={() => setCheckoutOpen(true)}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-4 font-black uppercase tracking-[0.2em] text-sm transition-all"
                    style={{
                      background: "#39ff14",
                      color: "#000",
                      border: "2px solid #39ff14",
                      boxShadow: "0 0 18px rgba(57,255,20,0.28)",
                    }}
                  >
                    إتمام الطلب →
                  </motion.button>

                  <button
                    onClick={closeCart}
                    className="w-full text-[10px] font-mono uppercase tracking-widest text-white/25 hover:text-[#39ff14] transition-colors py-1"
                  >
                    ← متابعة التسوق
                  </button>
                </div>
              )}

              {/* Checkout panel — slides over drawer */}
              <Checkout
                isOpen={checkoutOpen}
                onClose={() => setCheckoutOpen(false)}
                onSuccess={handleOrderSuccess}
                items={items}
                subtotal={subtotal}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
