import { Router } from "express";
import { getBinId, createBin, readBin, updateBin } from "../lib/jsonbin";
import { requireAdmin } from "../middleware/auth";

const router = Router();

/* ── seed data ─────────────────────────────────────────────────────────── */
const SEED_JUICES = [
  { id:"jus-orange",   num:"01", name:"ORANGE",   subtitle:"Fraîcheur Pure",     color:"#ff8c00", shadow:"rgba(255,140,0,0.45)",  bg:"rgba(255,140,0,0.06)",  border:"rgba(255,140,0,0.35)",  items:["100% Pur Jus","Pressé à froid"],       price:150, oldPrice:200, img:"/juices/orange.png",   blend:"normal" },
  { id:"jus-citron",   num:"02", name:"CITRON",   subtitle:"Acidité & Vitalité", color:"#d4e600", shadow:"rgba(212,230,0,0.40)",  bg:"rgba(212,230,0,0.05)",  border:"rgba(212,230,0,0.30)",  items:["Citron Frais","Menthe & Miel"],         price:150, oldPrice:180, img:"/juices/citron.png",   blend:"normal" },
  { id:"jus-fraise",   num:"03", name:"FRAISE",   subtitle:"Douceur & Plaisir",  color:"#ff2055", shadow:"rgba(255,32,85,0.45)",  bg:"rgba(255,32,85,0.06)",  border:"rgba(255,32,85,0.35)",  items:["Fraises Fraîches","Lait ou Eau"],       price:200, oldPrice:250, img:"/juices/fraise.png",   blend:"normal" },
  { id:"jus-banane",   num:"04", name:"BANANE",   subtitle:"Énergie Naturelle",  color:"#ffd000", shadow:"rgba(255,208,0,0.40)", bg:"rgba(255,208,0,0.05)",  border:"rgba(255,208,0,0.30)",  items:["Banane Mûre","Lait Entier"],           price:170, oldPrice:200, img:"/juices/banane.png",   blend:"normal" },
  { id:"jus-pomme",    num:"05", name:"POMME",    subtitle:"Légèreté & Santé",   color:"#39ff14", shadow:"rgba(57,255,20,0.40)",  bg:"rgba(57,255,20,0.05)",  border:"rgba(57,255,20,0.28)",  items:["Pomme Verte","Gingembre Frais"],        price:150, oldPrice:180, img:"/juices/pomme.png",    blend:"normal" },
  { id:"jus-cocktail", num:"06", name:"COCKTAIL", subtitle:"Mix de Saveurs",     color:"#ff6b35", shadow:"rgba(255,107,53,0.45)", bg:"rgba(255,107,53,0.06)", border:"rgba(255,107,53,0.35)", items:["Fruits de Saison","Sirop Maison"],      price:200, oldPrice:250, img:"/juices/cocktail.png", blend:"normal" },
];

const SEED_CATEGORIES = [
  { key:"tacos-gratine", label:"TACOS GRATINÉ", img:"/menu-tacos-gratine.png", extra:"Double Viande +150 DA", items:[
    { id:"tg-chaw", name:"Tacos Chawarma",      prices:[{label:"L",value:500},{label:"XL",value:1000}] },
    { id:"tg-poul", name:"Tacos Poulet",        prices:[{label:"L",value:550},{label:"XL",value:1000}] },
    { id:"tg-via",  name:"Tacos Viande Hachée", prices:[{label:"L",value:500},{label:"XL",value:1000}] },
    { id:"tg-merg", name:"Tacos Merguez",       prices:[{label:"L",value:500},{label:"XL",value:1000}] },
    { id:"tg-pan",  name:"Tacos Panaché",       prices:[{label:"L",value:550},{label:"XL",value:1100}] },
    { id:"tg-foie", name:"Tacos Foie",          prices:[{label:"L",value:550},{label:"XL",value:1100}] },
    { id:"tg-spe",  name:"Tacos Spécial",       prices:[{label:"L",value:700},{label:"XL",value:1400}] },
    { id:"tg-jiga", name:"Tacos Jiga",          prices:[{label:"XL",value:2000}] },
  ]},
  { key:"tacos-classique", label:"TACOS CLASSIQUE", img:"/menu-tacos-classique.png", extra:"Double Viande +150 DA", items:[
    { id:"tc-chaw", name:"Tacos Chawarma",      prices:[{label:"L",value:400},{label:"XL",value:800},{label:"XXL",value:1600}] },
    { id:"tc-poul", name:"Tacos Poulet",        prices:[{label:"L",value:400},{label:"XL",value:800},{label:"XXL",value:1600}] },
    { id:"tc-via",  name:"Tacos Viande Hachée", prices:[{label:"L",value:450},{label:"XL",value:900},{label:"XXL",value:1800}] },
    { id:"tc-merg", name:"Tacos Merguez",       prices:[{label:"L",value:450},{label:"XL",value:900},{label:"XXL",value:1800}] },
    { id:"tc-pan",  name:"Tacos Panaché",       prices:[{label:"L",value:500},{label:"XL",value:1000},{label:"XXL",value:2000}] },
    { id:"tc-foie", name:"Tacos Foie",          prices:[{label:"L",value:500},{label:"XL",value:1000},{label:"XXL",value:2000}] },
    { id:"tc-spe",  name:"Tacos Spécial",       prices:[{label:"L",value:600},{label:"XL",value:1200},{label:"XXL",value:2400}] },
  ]},
  { key:"fajitas", label:"FAJITAS", img:"/menu-fajitas.png", items:[
    { id:"fj-chaw", name:"Fajitas Chawarma",      prices:[{label:"L",value:500},{label:"XL",value:1000}] },
    { id:"fj-poul", name:"Fajitas Poulet",        prices:[{label:"L",value:500},{label:"XL",value:1000}] },
    { id:"fj-via",  name:"Fajitas Viande Hachée", prices:[{label:"L",value:500},{label:"XL",value:1000}] },
    { id:"fj-merg", name:"Fajitas Merguez",       prices:[{label:"L",value:500},{label:"XL",value:1000}] },
    { id:"fj-pan",  name:"Fajitas Panaché",       prices:[{label:"L",value:600},{label:"XL",value:1200}] },
    { id:"fj-foie", name:"Fajitas Foie",          prices:[{label:"L",value:550},{label:"XL",value:1100}] },
    { id:"fj-spe",  name:"Fajitas Spécial",       prices:[{label:"L",value:700},{label:"XL",value:1400}] },
  ]},
  { key:"souffle", label:"SOUFFLÉE", img:"/menu-soufflee.png", items:[
    { id:"sf-chaw", name:"Soufflée Chawarma",      prices:[{label:"STD",value:500}] },
    { id:"sf-poul", name:"Soufflée Poulet",        prices:[{label:"STD",value:550}] },
    { id:"sf-via",  name:"Soufflée Viande Hachée", prices:[{label:"STD",value:550}] },
    { id:"sf-pan",  name:"Soufflée Panaché",       prices:[{label:"STD",value:650}] },
    { id:"sf-foie", name:"Soufflée Foie",          prices:[{label:"STD",value:600}] },
  ]},
  { key:"malfouf-makloub", label:"MALFOUF MAKLOUB", img:"/menu-malfouf.png", extra:"Double Viande +150 DA", items:[
    { id:"mm-chaw", name:"Malfouf Makloub Chawarma",      prices:[{label:"STD",value:350}] },
    { id:"mm-poul", name:"Malfouf Makloub Poulet",        prices:[{label:"STD",value:350}] },
    { id:"mm-via",  name:"Malfouf Makloub Viande Hachée", prices:[{label:"STD",value:350}] },
    { id:"mm-pan",  name:"Malfouf Makloub Panaché",       prices:[{label:"STD",value:450}] },
    { id:"mm-foie", name:"Malfouf Makloub Foie",          prices:[{label:"STD",value:400}] },
    { id:"mm-spe",  name:"Malfouf Makloub Spécial",       prices:[{label:"STD",value:500}] },
  ]},
  { key:"malfouf-tunisien", label:"MALFOUF TUNISIEN", img:"/menu-malfouf.png", extra:"Double Viande +150 DA", items:[
    { id:"mt-chaw", name:"Malfouf Tunisien Chawarma",      prices:[{label:"STD",value:300}] },
    { id:"mt-poul", name:"Malfouf Tunisien Poulet",        prices:[{label:"STD",value:300}] },
    { id:"mt-via",  name:"Malfouf Tunisien Viande Hachée", prices:[{label:"STD",value:300}] },
    { id:"mt-pan",  name:"Malfouf Tunisien Panaché",       prices:[{label:"STD",value:400}] },
    { id:"mt-foie", name:"Malfouf Tunisien Foie",          prices:[{label:"STD",value:350}] },
    { id:"mt-spe",  name:"Malfouf Tunisien Spécial",       prices:[{label:"STD",value:450}] },
  ]},
  { key:"poutine", label:"POUTINE", items:[
    { id:"pt-poul", name:"Poutine Poulet",    prices:[{label:"STD",value:500}], extra:"Poulet + Fritte + Fromage" },
    { id:"pt-kri",  name:"Poutine Krispy",    prices:[{label:"STD",value:300}], extra:"Krispy + Fritte + Fromage" },
    { id:"pt-via",  name:"Poutine Viande",    prices:[{label:"STD",value:500}], extra:"Viande + Fritte + Fromage" },
    { id:"pt-3fr",  name:"Poutine 3 Fromage", prices:[{label:"STD",value:600}], extra:"2 Fromage + Fritte + Sauce Fromage" },
  ]},
  { key:"pizza-boisee", label:"PIZZA BOISÉE", img:"/menu-pizza-boisee.png", items:[
    { id:"pb-poul", name:"La Boisée Poulet",        prices:[{label:"L",value:600},{label:"XL",value:1200},{label:"XXL",value:2400}] },
    { id:"pb-via",  name:"La Boisée Viande Hachée", prices:[{label:"L",value:650},{label:"XL",value:1300},{label:"XXL",value:2600}] },
    { id:"pb-merg", name:"La Boisée Merguez",       prices:[{label:"L",value:650},{label:"XL",value:1300},{label:"XXL",value:2600}] },
    { id:"pb-4fr",  name:"La Boisée 4 Fromages",   prices:[{label:"L",value:800},{label:"XL",value:1600},{label:"XXL",value:3200}] },
    { id:"pb-fum",  name:"La Boisée Fumée",         prices:[{label:"L",value:750},{label:"XL",value:1500},{label:"XXL",value:3000}] },
    { id:"pb-crev", name:"La Boisée Crevette",      prices:[{label:"L",value:900},{label:"XL",value:1800},{label:"XXL",value:3600}] },
  ]},
  { key:"pizza-maison", label:"PIZZA MAISON", img:"/menu-pizza-maison.png", extra:"Suppléments L:250 / XL:350 / XXL:500 DA", items:[
    { id:"pm-pan",  name:"Pizza Panachée",         prices:[{label:"L",value:600},{label:"XL",value:1200},{label:"XXL",value:2400}] },
    { id:"pm-3st",  name:"Pizza 3 Saisons Thone",  prices:[{label:"XL",value:1300},{label:"XXL",value:2600}] },
    { id:"pm-merg", name:"Pizza Merguez",          prices:[{label:"XL",value:1300},{label:"XXL",value:2600}] },
    { id:"pm-chef", name:"Pizza Chef",             prices:[{label:"L",value:800},{label:"XL",value:1600},{label:"XXL",value:3200}] },
    { id:"pm-3via", name:"Pizza 3 Viandes",        prices:[{label:"L",value:800},{label:"XL",value:1600},{label:"XXL",value:3200}] },
    { id:"pm-4sai", name:"Pizza 4 Saisons Royal",  prices:[{label:"L",value:750},{label:"XL",value:1500},{label:"XXL",value:3000}] },
  ]},
  { key:"tacos-crispy", label:"TACOS CRISPY", extra:"Double Viande +150 DA", items:[
    { id:"tcr-chaw", name:"Tacos Chawarma",      prices:[{label:"STD",value:500}] },
    { id:"tcr-poul", name:"Tacos Poulet",        prices:[{label:"STD",value:500}] },
    { id:"tcr-via",  name:"Tacos Viande Hachée", prices:[{label:"STD",value:550}] },
    { id:"tcr-merg", name:"Tacos Merguez",       prices:[{label:"STD",value:550}] },
    { id:"tcr-pan",  name:"Tacos Panaché",       prices:[{label:"STD",value:600}] },
    { id:"tcr-foie", name:"Tacos Foie",          prices:[{label:"STD",value:600}] },
    { id:"tcr-spe",  name:"Tacos Spécial",       prices:[{label:"STD",value:700}] },
  ]},
  { key:"chapati", label:"CHAPATI", items:[
    { id:"ch-thon", name:"Chapati Thon",          prices:[{label:"STD",value:300}] },
    { id:"ch-chaw", name:"Chapati Chawarma",      prices:[{label:"STD",value:300}] },
    { id:"ch-poul", name:"Chapati Poulet",        prices:[{label:"STD",value:300}] },
    { id:"ch-esc",  name:"Chapati Escalope",      prices:[{label:"STD",value:300}] },
    { id:"ch-via",  name:"Chapati Viande Hachée", prices:[{label:"STD",value:300}] },
    { id:"ch-foie", name:"Chapati Foie",          prices:[{label:"STD",value:350}] },
    { id:"ch-pan",  name:"Chapati Panaché",       prices:[{label:"STD",value:400}] },
  ]},
  { key:"shawarma-arabi", label:"SHAWARMA ARABI", extra:"Les Fromages: Cheddar · Camembert · Gruyère · Mozzarella · Rouge · Bleu", items:[
    { id:"sa-chaw", name:"Shawarma العربي",      prices:[{label:"STD",value:350}] },
    { id:"sa-poul", name:"Poulet العربي",        prices:[{label:"STD",value:350}] },
    { id:"sa-via",  name:"Viande Hachée العربي", prices:[{label:"STD",value:350}] },
    { id:"sa-merg", name:"Merguez العربي",       prices:[{label:"STD",value:350}] },
    { id:"sa-pan",  name:"Panaché العربي",       prices:[{label:"STD",value:450}] },
    { id:"sa-foie", name:"Foie العربي",          prices:[{label:"STD",value:450}] },
    { id:"sa-spe",  name:"Spécial العربي",       prices:[{label:"STD",value:600}] },
  ]},
  { key:"matlou3", label:"MATLOU3", items:[
    { id:"ml-chaw", name:"Matlou3 Shawarma",      prices:[{label:"STD",value:300}] },
    { id:"ml-poul", name:"Matlou3 Poulet",        prices:[{label:"STD",value:300}] },
    { id:"ml-via",  name:"Matlou3 Viande Hachée", prices:[{label:"STD",value:300}] },
    { id:"ml-foie", name:"Matlou3 Foie",          prices:[{label:"STD",value:350}] },
    { id:"ml-pan",  name:"Matlou3 Panaché",       prices:[{label:"STD",value:400}] },
  ]},
  { key:"burger", label:"BURGER", items:[
    { id:"bg-miam", name:"Miam Hamburger",     prices:[{label:"STD",value:250}], extra:"Viande Hachée Frais" },
    { id:"bg-big",  name:"Big Miam Hamburger", prices:[{label:"STD",value:300}], extra:"Double Viande + Double Fromage" },
    { id:"bg-cri",  name:"Hamburger Crispy",   prices:[{label:"STD",value:300}], extra:"Double Scalope + Fromage" },
    { id:"bg-king", name:"King Hamburger",     prices:[{label:"STD",value:400}], extra:"Triple Viande Hachée Frais" },
  ]},
  { key:"sandwich-pita", label:"SANDWICH PITA PIT", items:[
    { id:"sp-chaw", name:"Sandwich Pita Pit Shawarma",      prices:[{label:"STD",value:450}] },
    { id:"sp-esc",  name:"Sandwich Pita Pit Escalope",      prices:[{label:"STD",value:450}] },
    { id:"sp-via",  name:"Sandwich Pita Pit Viande Hachée", prices:[{label:"STD",value:450}] },
    { id:"sp-poul", name:"Sandwich Pita Pit Poulet",        prices:[{label:"STD",value:450}] },
    { id:"sp-foie", name:"Sandwich Pita Foie",              prices:[{label:"STD",value:500}] },
    { id:"sp-pan",  name:"Sandwich Pita Pit Panaché",       prices:[{label:"STD",value:500}] },
    { id:"sp-spe",  name:"Sandwich Pita Pit Spécial",       prices:[{label:"STD",value:600}] },
  ]},
  { key:"sandwich-pain", label:"SANDWICH PAIN", items:[
    { id:"sn-chaw", name:"Sandwich Shawarma",      prices:[{label:"STD",value:300}] },
    { id:"sn-esc",  name:"Sandwich Escalope",      prices:[{label:"STD",value:300}] },
    { id:"sn-via",  name:"Sandwich Viande Hachée", prices:[{label:"STD",value:300}] },
    { id:"sn-poul", name:"Sandwich Poulet",        prices:[{label:"STD",value:350}] },
    { id:"sn-foie", name:"Sandwich Foie",          prices:[{label:"STD",value:350}] },
    { id:"sn-pan",  name:"Sandwich Panaché",       prices:[{label:"STD",value:400}] },
  ]},
  { key:"sandwich-combo", label:"SANDWICH COMBO", items:[
    { id:"sc-chaw", name:"Combo Shawarma",      prices:[{label:"STD",value:300}] },
    { id:"sc-esc",  name:"Combo Escalope",      prices:[{label:"STD",value:300}] },
    { id:"sc-via",  name:"Combo Viande Hachée", prices:[{label:"STD",value:300}] },
    { id:"sc-poul", name:"Combo Poulet",        prices:[{label:"STD",value:350}] },
    { id:"sc-foie", name:"Combo Foie",          prices:[{label:"STD",value:400}] },
    { id:"sc-pan",  name:"Combo Panaché",       prices:[{label:"STD",value:400}] },
  ]},
  { key:"plat-varie", label:"PLAT VARIÉ", extra:"Double Viande +300 DA", items:[
    { id:"pv-fri",  name:"Plat Frite",                     prices:[{label:"STD",value:200}] },
    { id:"pv-svi",  name:"Plat Sans Viande",               prices:[{label:"STD",value:500}] },
    { id:"pv-reg",  name:"Plat Régime",                    prices:[{label:"STD",value:600}] },
    { id:"pv-chaw", name:"Plat Varié Chawarma",            prices:[{label:"STD",value:650}] },
    { id:"pv-via",  name:"Plat Varié Viande Hachée",       prices:[{label:"STD",value:650}] },
    { id:"pv-mct",  name:"Plat Varié Machawi Chicketaouk", prices:[{label:"STD",value:650}] },
    { id:"pv-mkb",  name:"Plat Varié Machawi Kabab",       prices:[{label:"STD",value:650}] },
    { id:"pv-cri",  name:"Plat Varié Crispy",              prices:[{label:"STD",value:700}] },
    { id:"pv-sca",  name:"Plat Varié Scalope",             prices:[{label:"STD",value:700}] },
    { id:"pv-foi",  name:"Plat Varié Foie",                prices:[{label:"STD",value:750}] },
    { id:"pv-cob",  name:"Plat Varié Cordon Bleu",         prices:[{label:"STD",value:650}] },
    { id:"pv-kin",  name:"Plat Varié Kintaki",             prices:[{label:"STD",value:750}] },
    { id:"pv-spe",  name:"Plat Varié Spécial",             prices:[{label:"STD",value:800}] },
  ]},
  { key:"entrees", label:"NOS ENTRÉES", items:[
    { id:"en-bor", name:"Borek",              prices:[{label:"STD",value:170}] },
    { id:"en-kor", name:"Korni",              prices:[{label:"STD",value:170}] },
    { id:"en-mta", name:"Mini Tacos",         prices:[{label:"STD",value:170}] },
    { id:"en-msf", name:"Mini Soufflée",      prices:[{label:"STD",value:70}] },
    { id:"en-bfr", name:"Barquette de Frite", prices:[{label:"STD",value:200}] },
    { id:"en-kin", name:"Kintaki",            prices:[{label:"STD",value:150}] },
    { id:"en-cri", name:"Crispi",             prices:[{label:"STD",value:150}] },
  ]},
  { key:"pizza-rouge", label:"PIZZA SAUCE ROUGE", extra:"Suppléments L:150 / XL:250 / XXL:400 DA", items:[
    { id:"pr-mar",  name:"Pizza Margherita",   prices:[{label:"L",value:300},{label:"XL",value:600},{label:"XXL",value:1200}] },
    { id:"pr-veg",  name:"Pizza Végétarienne", prices:[{label:"L",value:450},{label:"XL",value:900},{label:"XXL",value:1800}] },
    { id:"pr-ori",  name:"Pizza Orientale",    prices:[{label:"L",value:500},{label:"XL",value:1000},{label:"XXL",value:2000}] },
    { id:"pr-pec",  name:"Pizza Pêcheur",      prices:[{label:"L",value:500},{label:"XL",value:1000},{label:"XXL",value:2000}] },
    { id:"pr-chi",  name:"Pizza Chicken",      prices:[{label:"L",value:500},{label:"XL",value:1000},{label:"XXL",value:2000}] },
    { id:"pr-nos",  name:"Pizza Nostra",       prices:[{label:"L",value:650},{label:"XL",value:1300},{label:"XXL",value:2600}] },
    { id:"pr-fro",  name:"Pizza Fromage",      prices:[{label:"L",value:750},{label:"XL",value:1500},{label:"XXL",value:3000}] },
    { id:"pr-spe",  name:"Pizza Spéciale",     prices:[{label:"L",value:700},{label:"XL",value:1400},{label:"XXL",value:2800}] },
    { id:"pr-mai",  name:"Pizza Maison",       prices:[{label:"L",value:750},{label:"XL",value:1500},{label:"XXL",value:3000}] },
    { id:"pr-roy",  name:"Pizza Royale",       prices:[{label:"L",value:900},{label:"XL",value:1800},{label:"XXL",value:3600}] },
    { id:"pr-4sa",  name:"Pizza 4 Saisons",    prices:[{label:"L",value:900},{label:"XL",value:1800},{label:"XXL",value:3600}] },
  ]},
  { key:"pizza-tranche", label:"PIZZA TRANCHE", items:[
    { id:"pt-thon", name:"¼ Pizza Thon",        prices:[{label:"¼",value:200}] },
    { id:"pt-fro",  name:"¼ Pizza Fromage",     prices:[{label:"¼",value:200}] },
    { id:"pt-bre",  name:"¼ Pizza Bresaola",    prices:[{label:"¼",value:200}] },
    { id:"pt-veg",  name:"¼ Pizza Végétarien",  prices:[{label:"¼",value:200}] },
    { id:"pt-mex",  name:"¼ Pizza Mexican",     prices:[{label:"¼",value:200}] },
    { id:"pt-pep",  name:"¼ Pizza Pepperoni",   prices:[{label:"¼",value:200}] },
    { id:"pt-roy",  name:"¼ Pizza Royal",       prices:[{label:"¼",value:200}] },
    { id:"pt-nap",  name:"¼ Pizza Napolitaine", prices:[{label:"¼",value:200}] },
    { id:"pt-pou",  name:"¼ Pizza Poulet",      prices:[{label:"¼",value:200}] },
    { id:"pt-tra",  name:"Tranche Pizza",       prices:[{label:"STD",value:50}] },
  ]},
];

export const SEED_DATA = { juices: SEED_JUICES, categories: SEED_CATEGORIES };

/* ── helpers ─────────────────────────────────────────────────────────────*/
let cached: unknown = null;

async function getMenuData() {
  if (cached) return cached;
  const binId = getBinId();
  if (!binId) return { ...SEED_DATA, initialized: false };
  try {
    cached = await readBin();
    return cached;
  } catch {
    return { ...SEED_DATA, initialized: false };
  }
}

function invalidate() { cached = null; }

/* ── routes ──────────────────────────────────────────────────────────────*/

/* GET /api/menu — public */
router.get("/", async (_req, res) => {
  try {
    const data = await getMenuData();
    res.json({ ...(data as object), initialized: !!getBinId() });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/* POST /api/menu/init — create JSONBIN bin with seed (admin) */
router.post("/init", requireAdmin, async (_req, res) => {
  try {
    if (getBinId()) {
      res.status(409).json({ error: "Already initialized", binId: getBinId() });
      return;
    }
    const binId = await createBin(SEED_DATA);
    invalidate();
    res.json({ ok: true, binId });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/* PUT /api/menu — update full menu data (admin) */
router.put("/", requireAdmin, async (req, res) => {
  try {
    await updateBin(req.body);
    invalidate();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
