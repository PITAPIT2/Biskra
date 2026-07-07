import fs from "fs";
import path from "path";

const JSONBIN_API = "https://api.jsonbin.io/v3";
const dataDir = path.resolve(process.cwd(), "data");
const META_FILE = path.join(dataDir, "meta.json");

function readMeta(): { binId?: string } {
  try { return JSON.parse(fs.readFileSync(META_FILE, "utf-8")); }
  catch { return {}; }
}

function saveMeta(d: object) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(META_FILE, JSON.stringify(d, null, 2));
}

export const getBinId = (): string | undefined =>
  process.env.JSONBIN_BIN_ID || readMeta().binId;

function masterKey(): string {
  const k = process.env.JSONBIN_KEY;
  if (!k) throw new Error("JSONBIN_KEY not configured");
  return k;
}

export async function createBin(data: unknown): Promise<string> {
  const res = await fetch(`${JSONBIN_API}/b`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": masterKey(),
      "X-Bin-Name": "pita-pit-menu",
      "X-Bin-Private": "false",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`JSONBIN create error: ${await res.text()}`);
  const json = await res.json() as { metadata: { id: string } };
  const binId = json.metadata.id;
  saveMeta({ binId });
  return binId;
}

export async function readBin(): Promise<unknown> {
  const binId = getBinId();
  if (!binId) return null;
  const res = await fetch(`${JSONBIN_API}/b/${binId}/latest`, {
    headers: { "X-Master-Key": masterKey(), "X-Bin-Meta": "false" },
  });
  if (!res.ok) throw new Error(`JSONBIN read error: ${await res.text()}`);
  return res.json();
}

export async function updateBin(data: unknown): Promise<void> {
  const binId = getBinId();
  if (!binId) throw new Error("Bin not initialised. Call /api/menu/init first.");
  const res = await fetch(`${JSONBIN_API}/b/${binId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-Master-Key": masterKey() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`JSONBIN update error: ${await res.text()}`);
}
