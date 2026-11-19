// Copia los archivos de la app a ./www para empaquetarla como app de Android (Capacitor).
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, ".."), out = path.join(root, "www");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const files = ["index.html", "sidepanel.css", "sidepanel.js", "stores.js", "menus.js", "catalogo.js", "locales.js", "restaurantes.js", "near.js", "visual.js", "icons.js", "art.js", "photos.js", "llm.js", "engine.js", "catalog.js", "places.js", "osm.js", "link.js", "db.js", "pwa.js", "sw.js", "manifest.webmanifest"];
for (const f of files) fs.copyFileSync(path.join(root, f), path.join(out, f));
fs.cpSync(path.join(root, "img"), path.join(out, "img"), { recursive: true });
fs.cpSync(path.join(root, "icons"), path.join(out, "icons"), { recursive: true });
console.log("www listo:", fs.readdirSync(out).length, "elementos");
