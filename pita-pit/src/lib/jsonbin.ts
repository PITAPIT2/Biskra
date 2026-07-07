const BASE = "https://api.jsonbin.io/v3";
const KEY_SS   = "pita_jb_key";
const BIN_LS   = "pita_jb_bin_id";
const AUTH_SS  = "pita_admin_authed";

/* ── admin auth (separate from JSONBIN key) ────────────────────────────── */
export const isAdminAuthed   = () => sessionStorage.getItem(AUTH_SS) === "1";
export const setAdminAuthed  = () => sessionStorage.setItem(AUTH_SS, "1");
export const clearAdminAuthed = () => sessionStorage.removeItem(AUTH_SS);

/* ── key / bin storage ──────────────────────────────────────────────────── */
const JSONBIN_MASTER_KEY = "$2a$10$nZorufoyZlsIpmj.VPyTqeO5gPskcU0qXgiLof/g9Zr7EfOIICyQ.";

export const getMasterKey  = () =>
  sessionStorage.getItem(KEY_SS) ||
  (import.meta.env.VITE_JSONBIN_KEY as string | undefined) ||
  JSONBIN_MASTER_KEY;
export const setMasterKey  = (k: string) => sessionStorage.setItem(KEY_SS, k);
export const clearMasterKey = () => sessionStorage.removeItem(KEY_SS);

export const getBinId = (): string =>
  (import.meta.env.VITE_JSONBIN_BIN_ID as string | undefined) ||
  localStorage.getItem(BIN_LS) ||
  "";
export const setBinId = (id: string) => localStorage.setItem(BIN_LS, id);

/* ── CRUD ──────────────────────────────────────────────────────────────── */
function headers(extra: Record<string, string> = {}): Record<string, string> {
  const key = getMasterKey();
  return { "Content-Type": "application/json", ...(key ? { "X-Master-Key": key } : {}), ...extra };
}

async function checkResponse(res: Response) {
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`JSONBIN ${res.status}: ${txt}`);
  }
  return res;
}

export async function createBin(data: unknown): Promise<string> {
  const res = await checkResponse(
    await fetch(`${BASE}/b`, {
      method: "POST",
      headers: { ...headers(), "X-Bin-Name": "pita-pit-menu", "X-Bin-Private": "false" },
      body: JSON.stringify(data),
    }),
  );
  const json = (await res.json()) as { metadata: { id: string } };
  setBinId(json.metadata.id);
  return json.metadata.id;
}

export async function readBin(): Promise<unknown | null> {
  const binId = getBinId();
  if (!binId) return null;
  const h = headers({ "X-Bin-Meta": "false" });
  delete (h as Record<string, string>)["Content-Type"];
  const res = await checkResponse(await fetch(`${BASE}/b/${binId}/latest`, { headers: h }));
  return res.json();
}

export async function updateBin(data: unknown): Promise<void> {
  const binId = getBinId();
  if (!binId) throw new Error("Bin non initialisé. Cliquez sur « Initialiser ».");
  await checkResponse(
    await fetch(`${BASE}/b/${binId}`, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify(data),
    }),
  );
}
