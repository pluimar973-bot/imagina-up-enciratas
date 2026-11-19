// Genera supabase/functions/gastabot-offer-scan/index.dashboard.ts (UN SOLO ARCHIVO para pegar en el panel de Supabase).
const fs = require("fs"), path = require("path"), dir = path.join(__dirname, "../supabase/functions/gastabot-offer-scan");
const lib = fs.readFileSync(path.join(dir, "lib.mjs"), "utf8").replace(/^export /gm, "");
const idx = fs.readFileSync(path.join(dir, "index.ts"), "utf8").replace(/^import .*lib\.mjs";\n/m, "");
fs.writeFileSync(path.join(dir, "index.dashboard.ts"), "// Versión de UN SOLO ARCHIVO para pegar en el editor del panel de Supabase (equivale a index.ts + lib.mjs). Generada con scripts/build-scan.js.\n" + lib + "\n" + idx);
console.log("ok", fs.statSync(path.join(dir, "index.dashboard.ts")).size, "bytes");
