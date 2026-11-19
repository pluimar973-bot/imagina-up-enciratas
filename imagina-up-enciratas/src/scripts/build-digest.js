// Genera supabase/functions/gastabot-digest/catalog.json (catálogo compacto de la app) y la versión de UN SOLO ARCHIVO para el panel.
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, ".."), dir = path.join(root, "supabase/functions/gastabot-digest");
globalThis.GASTABOT_DATA = require(path.join(root, "stores.js")); require(path.join(root, "menus.js")); require(path.join(root, "visual.js"));
const E = require(path.join(root, "engine.js"));
const cat = globalThis.GASTABOT_DATA.STORES.map((s) => ({ id: s.id, plaza: s.plaza, name: s.name, cats: s.cats, site: s.site || null, verified: !!s.verified,
  items: E.itemsOf(s).map((i) => ({ name: i.name, cat: i.cat, min: i.min, max: i.max, ...(i.exact ? { exact: true } : {}) })) }));
fs.writeFileSync(path.join(dir, "catalog.json"), JSON.stringify(cat));
const lib = fs.readFileSync(path.join(dir, "lib.mjs"), "utf8").replace(/^export /gm, "");
let idx = fs.readFileSync(path.join(dir, "index.ts"), "utf8").replace(/^import .*lib\.mjs";\n/m, "").replace(/^import CATALOG .*\n/m, "const CATALOG = " + JSON.stringify(cat) + ";\n");
fs.writeFileSync(path.join(dir, "index.dashboard.ts"), "// Versión de UN SOLO ARCHIVO para pegar en el editor del panel de Supabase (equivale a index.ts + lib.mjs + catalog.json). Generada con scripts/build-digest.js.\n" + lib + "\n" + idx);
console.log("tiendas:", cat.length, "| catalog.json", (fs.statSync(path.join(dir, "catalog.json")).size / 1024).toFixed(0) + " KB");
