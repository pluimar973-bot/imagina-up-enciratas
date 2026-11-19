// Fotos de referencia desde Wikimedia Commons (licencias libres) con respaldo en ilustración.
// v1.1: la foto SOLO se acepta si su título/descripción coincide con el tipo exacto del producto
//       (un tacón no puede traer un tenis). Si ninguna coincide, se queda la ilustración.
// - Cada tipo (p. ej. «tacones», «skate@vans») guarda un conjunto de hasta 10 fotos aceptadas (30 días en el dispositivo).
// - Cada producto toma una foto distinta del conjunto según su «semilla» (tienda + nombre), así no se repite la misma en todo.
// - Si la tienda es una marca reconocible (Vans, Crocs, Starbucks…) se busca primero la foto de la marca; si no hay, la del tipo.
// - Para fijar la foto exacta de un producto: PINNED["idTienda|Nombre"] = { u: "https://…jpg", a: "autor", l: "licencia", link: "página" }
(function (root) {
  const KEY = "gb_photos_v3", TTL = 30 * 864e5, MISS_TTL = 864e5, MAXPOOL = 14;
  const PINNED = {};
  const hash = (s) => { let h = 5381; for (const c of String(s)) h = ((h * 33) ^ c.charCodeAt(0)) >>> 0; return h; };

  let cache = {};
  const load = () => { try { cache = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { cache = {}; } };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch {} };
  load();
  try { localStorage.removeItem("gb_photos_v1"); localStorage.removeItem("gb_photos_v2"); } catch {} // cachés anteriores (fotos de Wikimedia sin filtrar)

  // v1.2: ya NO se buscan fotos abiertas en Wikimedia (mezclaba productos y a veces traía imágenes inadecuadas).
  // v2.3: con clave GRATUITA de Pexels se usa Pexels (mejor calidad); sin clave se usa Wikimedia Commons (licencias libres, con crédito),
  // filtrando por título/descripción. Si ninguna coincide se queda la ilustración. También se puede capturar el producto con su `img`.
  let pexelsKey = "";
  const config = (o) => { pexelsKey = String((o && o.pexelsKey) || "").trim(); };
  const enabled = () => true; // sin clave de Pexels se usa Wikimedia Commons

  const BAD = /sexy|erotic|seduct|topless|nude|naked|bikini|lingerie|underwear|thong|bra\b|breast|fetish|porn|adult|nsfw|logo|icon|map\b|diagram|flag|chart|poster|drawing|illustration|vector|screenshot|cover|stamp|coin|sculpture|painting|museum|postcard|advert|menu\b|sign\b|statue|museo|ruins|manga|anime|cartoon|toy ?story|baby doll|mannequin|fashion ?show|runway|catwalk|model\b|nude|naked|bikini|lingerie|underwear/i;
  const strip = (h) => String(h || "").replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#?\w+;/g, " ").replace(/\s+/g, " ").trim();

  // Una consulta: Pexels si hay clave; si no, Wikimedia Commons (sin clave, licencias libres, con crédito).
  const stripTitle = (t) => strip(String(t || "").replace(/^File:/i, "").replace(/\.(jpe?g|png|webp)$/i, "").replace(/[_]+/g, " "));
  async function queryPexels(q) {
    const r = await fetch("https://api.pexels.com/v1/search?" + new URLSearchParams({ query: q, per_page: "40", size: "medium" }), { headers: { Authorization: pexelsKey } });
    if (r.status === 401 || r.status === 403) throw new Error("Clave de Pexels no válida");
    if (!r.ok) throw new Error("HTTP " + r.status);
    const out = [];
    for (const p of (await r.json()).photos || []) {
      const alt = strip(p.alt); if (!alt || !p.src) continue; // sin descripción no se puede comprobar que coincida: se descarta
      out.push({ u: p.src.large || p.src.medium, a: strip(p.photographer).slice(0, 80), l: "Pexels", t: alt.slice(0, 140), d: alt, link: p.url });
    }
    return out;
  }
  async function queryCommons(q) {
    const params = new URLSearchParams({ action: "query", format: "json", origin: "*", generator: "search", gsrnamespace: "6", gsrsearch: q + " filetype:bitmap", gsrlimit: "30", prop: "imageinfo", iiprop: "url|mime|extmetadata", iiurlwidth: "480", iiextmetadatafilter: "Artist|LicenseShortName|ImageDescription" });
    const r = await fetch("https://commons.wikimedia.org/w/api.php?" + params);
    if (!r.ok) throw new Error("HTTP " + r.status);
    const out = [], pages = Object.values(((await r.json()).query || {}).pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
    for (const p of pages) {
      const ii = p.imageinfo && p.imageinfo[0]; if (!ii || !/^image\/(jpeg|png|webp)$/.test(ii.mime || "") || !ii.thumburl) continue;
      const m = ii.extmetadata || {}, lic = strip((m.LicenseShortName || {}).value);
      if (!/^(CC|Public domain|PD)/i.test(lic)) continue; // sólo licencias libres
      const t = stripTitle(p.title), d = strip((m.ImageDescription || {}).value).slice(0, 200);
      out.push({ u: ii.thumburl, a: strip((m.Artist || {}).value).slice(0, 80), l: lic + " · Wikimedia Commons", t: t.slice(0, 140), d: t + " " + d, link: ii.descriptionshorturl || "" });
    }
    return out;
  }
  const query = (q) => (pexelsKey ? queryPexels(q) : queryCommons(q));
  const ok = (r, step) => { const hay = r.t + " " + r.d; return !BAD.test(r.t) && (!step.must || step.must.test(hay)) && !(step.not && step.not.test(hay)); };

  // Conjunto de fotos aceptadas para un perfil (tipo + marca opcional)
  async function buildPool(prof) {
    const out = [], seen = new Set();
    for (const step of prof.steps) {
      if (out.length >= 6) break;
      let raw; try { raw = await query(step.q); } catch (e) { if (out.length) break; throw e; }
      for (const r of raw) if (ok(r, step) && !seen.has(r.t)) { seen.add(r.t); out.push({ u: r.u, a: r.a, l: r.l, t: r.t, link: r.link, brand: !!step.brand, q: step.q }); }
    }
    return out.slice(0, MAXPOOL);
  }

  // Cola con 3 descargas a la vez
  const pending = new Map(); let active = 0; const queue = [];
  function enqueue(id, task, done) {
    if (pending.has(id)) return pending.get(id);
    const p = new Promise((res) => { queue.push({ id, task, done, res }); pump(); });
    pending.set(id, p); return p;
  }
  function pump() {
    while (active < 3 && queue.length) {
      const { id, task, done, res } = queue.shift(); active++;
      task().then((r) => { done(r); res(r); })
        .catch(() => res(null)) // sin red: no se guarda, se reintenta después
        .finally(() => { active--; pending.delete(id); pump(); });
    }
  }
  function pool(prof) {
    if (!prof) return Promise.resolve([]);
    if (typeof navigator !== "undefined" && navigator.onLine === false) return Promise.resolve([]); // sin red: ilustración, sin guardar «sin resultados»
    const key = (pexelsKey ? "p|" : "w|") + prof.id, c = cache[key];
    if (c && Date.now() - c.ts < (c.r && c.r.length ? TTL : MISS_TTL)) return Promise.resolve(c.r || []);
    return enqueue(key, () => buildPool(prof), (r) => { cache[key] = { r, ts: Date.now() }; save(); }).then((r) => r || []);
  }
  // Orden para un producto: primero fotos de la marca (si hay), luego las del tipo, girando según la semilla
  function ordered(list, seed) {
    const b = list.filter((p) => p.brand), o = list.filter((p) => !p.brand);
    const rot = (a) => (a.length ? a.slice((hash(seed) % a.length)).concat(a.slice(0, hash(seed) % a.length)) : a);
    return rot(b).concat(rot(o));
  }
  const pick = (list, seed) => (PINNED[seed] ? Object.assign({ pinned: true }, PINNED[seed]) : ordered(list, seed)[0] || null);
  function gallery(prof, n = 4, seed = "") {
    return pool(prof).then((list) => {
      const own = PINNED[seed] ? [Object.assign({ pinned: true }, PINNED[seed])] : [];
      return own.concat(ordered(list, seed)).slice(0, n);
    });
  }

  function scan(rootEl) {
    (rootEl || document).querySelectorAll("img.ph[data-p]:not([data-d])").forEach((img) => {
      img.dataset.d = "1";
      const prof = root.GastaVisual && root.GastaVisual.profileById(img.dataset.p); if (!prof) return;
      pool(prof).then((list) => {
        const r = pick(list, img.dataset.s || prof.id); if (!r || !img.isConnected) return;
        img.referrerPolicy = "no-referrer";
        img.onload = () => { const t = img.closest(".thumb"); t && t.classList.add("has-photo"); };
        img.onerror = () => img.remove();
        img.alt = r.t || ""; img.src = r.u;
      });
    });
  }
  let raf = 0;
  function watch() {
    new MutationObserver(() => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; scan(document); }); }).observe(document.body, { childList: true, subtree: true });
    scan(document);
  }
  // Créditos: una fila por foto, sin repetir archivos
  const credits = () => {
    const out = [], seen = new Set();
    for (const [k, v] of Object.entries(cache)) for (const r of [].concat(v && v.r ? v.r : [])) if (r && r.a !== undefined && !seen.has(r.t)) { seen.add(r.t); out.push({ q: k.slice(2), ...r }); }
    return out;
  };
  const api = { pool, pick, gallery, scan, watch, credits, PINNED, hash, ok, buildPool, config, enabled };
  root.GastaPhotos = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
