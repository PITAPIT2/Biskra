import { Router } from "express";
import fs from "fs";
import path from "path";
import { requireAdmin } from "../middleware/auth";

const router = Router();
const dataDir = path.resolve(process.cwd(), "data");
const ORDERS_FILE = path.join(dataDir, "orders.json");

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  location: string;
  items: { id: string; name: string; price: number; qty: number }[];
  subtotal: number;
  status: "pending" | "confirmed" | "done" | "cancelled";
  createdAt: string;
  note?: string;
}

function readOrders(): Order[] {
  try { return JSON.parse(fs.readFileSync(ORDERS_FILE, "utf-8")); }
  catch { return []; }
}

function saveOrders(orders: Order[]) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

/* POST /api/orders — create order (public) */
router.post("/", (req, res) => {
  const { customerName, phone, location, items, subtotal, note } = req.body as Partial<Order>;
  if (!customerName || !phone || !location || !Array.isArray(items) || subtotal === undefined) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const order: Order = {
    id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    customerName,
    phone,
    location,
    items,
    subtotal,
    note,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  const orders = readOrders();
  orders.unshift(order);
  saveOrders(orders);
  res.status(201).json(order);
});

/* GET /api/orders — list orders (admin) */
router.get("/", requireAdmin, (_req, res) => {
  res.json(readOrders());
});

/* PUT /api/orders/:id — update status (admin) */
router.put("/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body as { status?: Order["status"] };
  const allowed = ["pending", "confirmed", "done", "cancelled"];
  if (!status || !allowed.includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }
  const orders = readOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) { res.status(404).json({ error: "Order not found" }); return; }
  orders[idx].status = status;
  saveOrders(orders);
  res.json(orders[idx]);
});

/* DELETE /api/orders/:id — remove order (admin) */
router.delete("/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const orders = readOrders();
  const next = orders.filter((o) => o.id !== id);
  if (next.length === orders.length) { res.status(404).json({ error: "Not found" }); return; }
  saveOrders(next);
  res.json({ ok: true });
});

export default router;
