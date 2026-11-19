// Ficha de producto: nivel de calidad, opciones parecidas y mini catálogo (sin dependencias; navegador y Node).
// IMPORTANTE: el catálogo no trae materiales ni especificaciones reales. El «nivel de calidad» se CALCULA con datos
// que sí hay: posición del precio dentro de su categoría, si la tienda está confirmada, si el precio es de lista
// publicado, calificación y ofertas. Si capturas un producto con `quality` (0 básico, 1 estándar, 2 premium)
// o `specs` (lista de textos), la ficha usa eso en lugar del cálculo.
(function (root) {
  const E = root.GastaEngine || require("./engine.js");
  const V = root.GastaVisual || require("./visual.js");
  const norm = E.norm;
  const LEVELS = ["Básico", "Estándar", "Premium"];
  const HINTS = ["Opción económica de su tipo", "Calidad estándar para su precio", "Gama alta de su tipo"];
  const money = (n) => "$" + Math.round(n).toLocaleString("es-MX");
  const keyOf = (s, i) => s.id + "|" + i.name;
  const STOP = new Set(["de", "con", "y", "la", "el", "en", "para", "sin", "una", "un", "los", "las", "del", "combo", "solo", "sola"]);
  const words = (s) => norm(s).split(/[^a-z0-9ñ]+/).filter((w) => w.length > 2 && !STOP.has(w));

  // Contexto: precios por categoría de un conjunto de tiendas (se calcula una vez por apertura de ficha)
  function makeCtx(pool) {
    const tables = {};
    for (const s of pool) for (const i of E.itemsOf(s)) (tables[i.cat] = tables[i.cat] || []).push(E.est(i));
    for (const c of Object.keys(tables)) tables[c].sort((a, b) => a - b);
    return { pool, tables };
  }
  function percentile(v, x) {
    if (!v || v.length < 2) return 0.5;
    let below = 0, eq = 0;
    for (const y of v) { if (y < x) below++; else if (y === x) eq++; }
    return (below + eq / 2) / v.length;
  }

  // Devuelve { level 0-2, label, hint, pct, score, reasons:[{k:"ok"|"info"|"warn", t}], specs:[] }
  function qualityInfo(store, item, ctx, catLabel) {
    const v = ctx.tables[item.cat] || [], est = E.est(item), pct = percentile(v, est);
    const reasons = [];
    let level = pct < 0.34 ? 0 : pct < 0.67 ? 1 : 2;
    const cl = (catLabel || item.cat || "su categoría").toLowerCase();
    if (item.quality === 0 || item.quality === 1 || item.quality === 2) {
      level = item.quality; reasons.push({ k: "ok", t: "Nivel indicado al capturar el producto" });
    } else if (v.length >= 4) {
      const lo = v[0], hi = v[v.length - 1];
      reasons.push({ k: "info", t: `Precio en el tramo ${["bajo", "medio", "alto"][level]} de ${cl} (${money(lo)} a ${money(hi)}, ${v.length} opciones)` });
    } else {
      level = 1; reasons.push({ k: "warn", t: `Hay pocas opciones de ${cl} para comparar; el nivel es aproximado` });
    }
    reasons.push(store.verified ? { k: "ok", t: "Tienda confirmada en fuentes públicas" } : { k: "warn", t: "Tienda por confirmar (aparece en una sola fuente)" });
    reasons.push(item.exact
      ? { k: "ok", t: "Precio de lista publicado" + (item.capturedAt ? ` (${item.capturedAt})` : "") }
      : { k: "warn", t: `Precio estimado por rango (${money(item.min)} a ${money(item.max)})` });
    if (store.rating) reasons.push({ k: "ok", t: `Calificación de la tienda ★${store.rating}` });
    if (store.promo) reasons.push({ k: "ok", t: `Oferta vigente: ${store.promo}` });
    if (store.needsReview) reasons.push({ k: "warn", t: "Falta confirmar qué vende esta tienda" });
    const score = pct * 0.7 + (store.verified ? 0.1 : 0) + (store.rating ? (store.rating - 3) / 10 : 0) + (item.exact ? 0.05 : 0) - (store.needsReview ? 0.2 : 0);
    return { level, label: LEVELS[level], hint: HINTS[level], pct, score, reasons, specs: Array.isArray(item.specs) ? item.specs : [] };
  }

  // Variedad de la misma tienda: los otros tipos del mismo producto (p. ej. Tacones / Botines / Sandalias en Liverpool)
  // Con `grp` (catálogo genérico expandido) son los tipos del mismo producto; sin `grp` (menús con productos concretos)
  // son los otros productos de la misma categoría en la tienda, hasta 8 cerca del precio del actual.
  function variants(store, item) {
    const all = E.itemsOf(store);
    if (item.grp) return all.filter((i) => i.grp === item.grp).map((i) => ({ item: i, est: E.est(i), cur: i.name === item.name }));
    const same = all.filter((i) => i.cat === item.cat).map((i) => ({ item: i, est: E.est(i), cur: i.name === item.name })).sort((a, b) => a.est - b.est);
    if (same.length <= 8) return same;
    const k = Math.max(0, Math.min(same.length - 8, same.findIndex((x) => x.cur) - 3));
    return same.slice(k, k + 8);
  }
  // Opciones parecidas: mismo TIPO de producto primero (un tacón se compara con tacones), luego categoría; precio cercano.
  // Las variantes de la misma tienda no entran aquí: se muestran aparte como «Variedad en la tienda».
  function similar(store, item, ctx, n = 6) {
    const bt = new Set((item.tags || []).map(norm)), bw = new Set(words(item.name)), be = E.est(item), bType = V.typeOf(store, item);
    const rows = [];
    for (const s of ctx.pool) for (const i of E.itemsOf(s)) {
      if (i.cat !== item.cat || (s.id === store.id && i.name === item.name)) continue;
      if (s.id === store.id && item.grp && i.grp === item.grp) continue;
      if (s.id !== store.id && V.sameBrand(s, store) && i.name === item.name) continue; // el mismo producto en otra plaza no es una «opción parecida»
      const tg = (i.tags || []).map(norm), tOv = tg.filter((t) => bt.has(t)).length;
      const wOv = words(i.name).filter((w) => bw.has(w)).length;
      const est = E.est(i), near = Math.abs(Math.log(Math.max(est, 1) / Math.max(be, 1)));
      const sameType = V.typeOf(s, i) === bType;
      const score = (sameType ? 6 : 0) + tOv * 2 + wOv * 1.5 + (i.kind && i.kind === item.kind ? 1 : 0) + (s.id !== store.id ? 0.5 : 0) - near;
      rows.push({ store: s, item: i, est, delta: est - be, score });
    }
    rows.sort((a, b) => b.score - a.score || a.est - b.est);
    // no más de 2 del mismo nombre de producto para que no sean todas «Playera»
    const out = [], seen = {};
    for (const r of rows) { const k = norm(r.item.name); if ((seen[k] = (seen[k] || 0) + 1) <= 2) out.push(r); if (out.length >= n) break; }
    return out;
  }

  // Mini catálogo de la categoría. filter: all | cheap | quality | store
  function catalog(cat, ctx, { filter = "all", storeId = null, skip = null } = {}) {
    let rows = [];
    const cur = storeId && ctx.pool.find((s) => s.id === storeId);
    for (const s of ctx.pool) for (const i of E.itemsOf(s)) if (i.cat === cat && !(skip && keyOf(s, i) === skip)) rows.push({ store: s, item: i, est: E.est(i) });
    if (filter === "store" && storeId) rows = rows.filter((r) => r.store.id === storeId);
    if (filter === "other" && cur) rows = rows.filter((r) => !V.sameBrand(r.store, cur));
    for (const r of rows) r.q = qualityInfo(r.store, r.item, ctx);
    if (filter === "cheap") rows.sort((a, b) => a.est - b.est);
    else if (filter === "quality") rows.sort((a, b) => b.q.score - a.q.score || a.est - b.est);
    else rows.sort((a, b) => (b.store.verified | 0) - (a.store.verified | 0) || a.est - b.est);
    return rows;
  }

  const api = { LEVELS, makeCtx, qualityInfo, similar, variants, catalog, keyOf, percentile };
  root.GastaCatalog = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
