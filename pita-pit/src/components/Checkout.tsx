import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CartItem } from "../context/CartContext";

interface CheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  items: CartItem[];
  subtotal: number;
}

interface FormState {
  name: string;
  phone: string;
  location: string;
}

type Step = "form" | "success";

export default function Checkout({ isOpen, onClose, onSuccess, items, subtotal }: CheckoutProps) {
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState<FormState>({ name: "", phone: "", location: "" });
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const e: Partial<FormState> = {};
    if (!form.name.trim()) e.name = "الاسم مطلوب";
    if (!form.phone.trim()) e.phone = "رقم الهاتف مطلوب";
    else if (!/^[0-9+\s\-]{8,15}$/.test(form.phone.trim())) e.phone = "رقم هاتف غير صحيح";
    if (!form.location.trim()) e.location = "العنوان مطلوب";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const [submitError, setSubmitError] = useState("");

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setLoading(true);
    setSubmitError("");
    try {
      const { getDb, collection, addDoc, serverTimestamp } = await import("../lib/firebase");
      const db = getDb();
      await addDoc(collection(db, "orders"), {
        customerName: form.name,
        phone: form.phone,
        location: form.location,
        items: items.map(({ id, name, price, qty }) => ({ id, name, price, qty })),
        subtotal,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setLoading(false);
      setStep("success");
      setTimeout(() => {
        onSuccess();
        setStep("form");
        setForm({ name: "", phone: "", location: "" });
      }, 2800);
    } catch (err) {
      console.error("Order submission failed:", err);
      setSubmitError("حدث خطأ أثناء إرسال الطلب. حاول مجدداً.");
      setLoading(false);
    }
  }, [form, items, subtotal, onSuccess]);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="checkout"
          className="fixed inset-0 z-[970] flex flex-col bg-[#050505]"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/8 flex-shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                aria-label="Back"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-white">إتمام الطلب</h2>
                <p className="text-[10px] font-mono text-white/30 mt-0.5">Checkout</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">المجموع</p>
              <p className="text-lg font-black font-mono" style={{ color: "#39ff14" }}>{subtotal} DA</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            <AnimatePresence mode="wait">
              {step === "success" ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center h-full px-6 py-16 text-center min-h-[400px]"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 15, delay: 0.1 }}
                    className="w-20 h-20 flex items-center justify-center mb-6 rounded-full"
                    style={{ background: "rgba(57,255,20,0.1)", border: "2px solid #39ff14", boxShadow: "0 0 30px rgba(57,255,20,0.25)" }}
                  >
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <path d="M6 16l7 7 14-14" stroke="#39ff14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.div>
                  <h3 className="text-2xl font-black text-white mb-2">تم استلام طلبك!</h3>
                  <p className="text-white/40 text-sm font-mono mb-1">سنتواصل معك على رقم</p>
                  <p className="text-white font-mono font-bold mb-4">{form.phone}</p>
                  <p className="text-white/25 text-xs font-mono uppercase tracking-widest">شكراً لك · Merci</p>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-6 py-8 space-y-8">

                  {/* Order summary */}
                  <div>
                    <p className="text-[9px] font-mono uppercase tracking-[0.45em] text-white/25 mb-3">ملخص الطلب</p>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs">
                          <span className="text-white/60 flex-1 truncate pr-3">{item.name}</span>
                          <span className="text-white/40 font-mono flex-shrink-0">×{item.qty}</span>
                          <span className="text-white/70 font-mono flex-shrink-0 ml-3">{item.price * item.qty} DA</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/6 flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">الإجمالي</span>
                      <span className="font-black font-mono text-white">{subtotal} DA</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/6" />
                    <span className="text-[9px] font-mono uppercase tracking-[0.45em] text-white/20">بيانات التوصيل</span>
                    <div className="flex-1 h-px bg-white/6" />
                  </div>

                  {/* Form fields */}
                  <div className="space-y-5">
                    {/* Name */}
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2">
                        الاسم الكامل
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder="مثال: أحمد بن علي"
                        dir="rtl"
                        className="w-full bg-white/4 border px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none transition-all duration-200 font-mono"
                        style={{
                          borderColor: errors.name ? "#ff6a00" : "rgba(255,255,255,0.1)",
                        }}
                        onFocus={(e) => (e.target.style.borderColor = "#39ff14")}
                        onBlur={(e) => (e.target.style.borderColor = errors.name ? "#ff6a00" : "rgba(255,255,255,0.1)")}
                      />
                      {errors.name && (
                        <p className="mt-1.5 text-[10px] font-mono" style={{ color: "#ff6a00" }}>{errors.name}</p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2">
                        رقم الهاتف
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        placeholder="05XX XX XX XX"
                        dir="ltr"
                        className="w-full bg-white/4 border px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none transition-all duration-200 font-mono tracking-wider"
                        style={{
                          borderColor: errors.phone ? "#ff6a00" : "rgba(255,255,255,0.1)",
                        }}
                        onFocus={(e) => (e.target.style.borderColor = "#39ff14")}
                        onBlur={(e) => (e.target.style.borderColor = errors.phone ? "#ff6a00" : "rgba(255,255,255,0.1)")}
                      />
                      {errors.phone && (
                        <p className="mt-1.5 text-[10px] font-mono" style={{ color: "#ff6a00" }}>{errors.phone}</p>
                      )}
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2">
                        العنوان / الموقع
                      </label>
                      <textarea
                        value={form.location}
                        onChange={(e) => handleChange("location", e.target.value)}
                        placeholder="الحي، الشارع، رقم البناية..."
                        dir="rtl"
                        rows={3}
                        className="w-full bg-white/4 border px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none transition-all duration-200 font-mono resize-none"
                        style={{
                          borderColor: errors.location ? "#ff6a00" : "rgba(255,255,255,0.1)",
                        }}
                        onFocus={(e) => (e.target.style.borderColor = "#39ff14")}
                        onBlur={(e) => (e.target.style.borderColor = errors.location ? "#ff6a00" : "rgba(255,255,255,0.1)")}
                      />
                      {errors.location && (
                        <p className="mt-1.5 text-[10px] font-mono" style={{ color: "#ff6a00" }}>{errors.location}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer CTA */}
          {step === "form" && (
            <div className="px-6 py-5 border-t border-white/8 flex-shrink-0 space-y-3">
              {submitError && (
                <p className="text-center text-xs font-mono" style={{ color: "#ff6a00" }}>{submitError}</p>
              )}
              <motion.button
                onClick={handleSubmit}
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 font-black uppercase tracking-[0.2em] text-sm transition-all duration-300 relative overflow-hidden"
                style={{
                  background: loading ? "rgba(57,255,20,0.15)" : "#39ff14",
                  color: loading ? "#39ff14" : "#000",
                  border: "2px solid #39ff14",
                  boxShadow: loading ? "none" : "0 0 20px rgba(57,255,20,0.3)",
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 4"/>
                    </svg>
                    جاري الإرسال...
                  </span>
                ) : (
                  "تأكيد الطلب"
                )}
              </motion.button>
              <p className="text-center text-[9px] font-mono text-white/18 uppercase tracking-widest">
                سيتم التواصل معك لتأكيد التوصيل
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
