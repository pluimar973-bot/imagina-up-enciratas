// Genera gastabot-celular.html: toda la app en un solo archivo (CSS y JS dentro) para abrirla en el celular.
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const r = (f) => fs.readFileSync(path.join(root, f), "utf8");
let html = r("sidepanel.html");
const scripts = ["stores.js", "menus.js", "@imgs", "catalogo.js", "locales.js", "restaurantes.js", "near.js", "visual.js", "icons.js", "art.js", "photos.js", "llm.js", "engine.js", "catalog.js", "places.js", "osm.js", "link.js", "db.js", "sidepanel.js"];
html = html.replace(/\s*<link rel="(manifest|icon|apple-touch-icon)"[^>]*>/g, "")
  .replace(/<link rel="stylesheet" href="sidepanel.css" \/>/, () => "<style>\n" + r("sidepanel.css") + "\n</style>")
  .replace(/\s*<script src="[^"]+"><\/script>/g, "");
// Fotos del catálogo incrustadas (el HTML único no tiene carpeta img/)
const imgDir = path.join(root, "img", "c");
const IMGS = {};
for (const f of fs.existsSync(imgDir) ? fs.readdirSync(imgDir) : []) if (/\.jpg$/i.test(f)) IMGS[f] = "data:image/jpeg;base64," + fs.readFileSync(path.join(imgDir, f)).toString("base64");
const read = (f) => (f === "@imgs" ? "window.GASTABOT_IMGS = " + JSON.stringify(IMGS) + ";" : r(f));
const js = scripts.map((f) => `/* ${f} */\n` + read(f).replace(/<\/script/gi, "<\\/script")).join("\n");
html = html.replace("</body>", () => "<script>\n" + js + "\n</script>\n</body>");
fs.writeFileSync(path.join(root, "gastabot-celular.html"), html);
console.log("gastabot-celular.html", (html.length / 1024).toFixed(0) + " KB");
