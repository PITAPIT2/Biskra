import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.post("/admin/verify", (req, res) => {
  const token = (req.headers["x-admin-token"] as string | undefined) || "";
  if (!token || token !== process.env.ADMIN_TOKEN) {
    res.status(401).json({ ok: false });
    return;
  }
  res.json({ ok: true });
});

export default router;
