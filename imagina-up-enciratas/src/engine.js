// Motor v0.2 (sin dependencias; navegador y Node).
// Funciones: presupuesto -> lista filtrada, combo de compras, comparador de producto, modo ruta.
// Es un planificador por reglas (determinista), NO un LLM. Un LLM puede añadirse encima en v0.3.
(function (root) {
  const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  function parseBudget(text) {
    const t = norm(text).replace(/,/g, "");
    let m = t.match(/(\d+(?:\.\d+)?)\s*(mil|k)\b/);
    if (m) return Math.round(parseFloat(m[1]) * 1000);
    m = t.match(/\$?\s*(\d{2,6})/);
    return m ? parseInt(m[1], 10) : null;
  }
  function detectPlaza(text, PLAZAS) {
    const t = norm(text).replace(/centros? comercial(es)?/g, "cc");
    const has = (a) => new RegExp("(^|[^a-z0-9])" + norm(a).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![a-z0-9])").test(t);
    for (const [id, p] of Object.entries(PLAZAS)) if (p.aliases.some(has)) return id;
    return null;
  }
  function detectCats(text, CATEGORIES) {
    const t = norm(text), found = [];
    for (const [cat, words] of Object.entries(CATEGORIES)) if (words.some((w) => t.includes(norm(w)))) found.push(cat);
    return found;
  }

  // Cada tienda expone "items" (producto con rango). Si no tiene (p. ej. viene de Google), se genera uno por categoría.
  function itemsOf(s) {
    if (s.items && s.items.length) return s.items;
    const min = s.min ?? 100, max = s.max ?? Math.max(min, 500);
    return (s.cats || []).map((c) => ({ name: "Compra típica", cat: c, min, max, tags: [], estimated: true }));
  }
  const est = (i) => Math.round(i.min + (i.max - i.min) * 0.35); // gasto "probable": tercio bajo del rango
  const quality = (s) => (s.verified ? 0.2 : 0) + (s.promo ? 0.3 : 0) + ((s.rating || 0) / 10) - (s.needsReview ? 0.4 : 0);

  function candidates(cat, pool, budget) {
    const out = [];
    for (const s of pool) for (const i of itemsOf(s)) if (i.cat === cat && i.min <= budget) out.push({ store: s, item: i, est: Math.min(est(i), budget) });
    return out.sort((a, b) => (quality(b.store) + (b.item.exact ? 0.3 : 0)) - (quality(a.store) + (a.item.exact ? 0.3 : 0)) || a.est - b.est);
  }

  function extraFor(left, cats, pool) {
    if (cats.includes("cafe")) return null;
    const c = candidates("cafe", pool, left).filter((x) => x.item.min <= left)[0];
    return c ? { cat: "cafe", ...c, est: Math.min(c.est, left) } : null;
  }
  // Recalcula gasto probable si el usuario cambia una opción (precio exacto = min==max)
  function reprice(budget, picks) {
    const sumMin = picks.reduce((a, p) => a + p.item.min, 0), over = sumMin > budget;
    const share = picks.length ? Math.max(0, (budget - sumMin) / picks.length) : 0;
    const out = picks.map((p) => ({ ...p, est: over ? p.item.min : Math.round(p.item.min + Math.min((p.item.max - p.item.min) * 0.35, share)) }));
    const total = out.reduce((a, p) => a + p.est, 0);
    return { picks: out, total, left: budget - total, over, sumMin };
  }

  // Elige hasta n opciones con precios realmente distintos (barata, media, premium); la mejor de cada nivel.
  function spread(list, n) {
    const byB = new Map();
    for (const x of list) { const b = Math.round(Math.log(Math.max(x.est, 1)) / Math.log(1.2)); if (!byB.has(b)) byB.set(b, x); }
    const arr = [...byB.values()].sort((a, b) => a.est - b.est);
    if (arr.length <= n) return arr;
    const out = []; for (let k = 0; k < n; k++) out.push(arr[Math.round((k * (arr.length - 1)) / (n - 1))]);
    return [...new Set(out)];
  }

  // Siempre n opciones distintas: primero repartidas por precio, luego se rellena con lo que quede
  function takeN(list, n, already = []) {
    const key = (x) => x.store.id + "|" + x.item.name;
    const out = already.slice(), seen = new Set(out.map(key));
    for (const x of spread(list, n - out.length)) if (out.length < n && !seen.has(key(x))) { out.push(x); seen.add(key(x)); }
    for (const x of list) if (out.length < n && !seen.has(key(x))) { out.push(x); seen.add(key(x)); }
    return out;
  }

  // Varias tiendas y varios niveles de precio por categoría (hasta 3 productos por tienda) para no quedarse solo con la más barata
  function diverse(list, n) {
    const by = new Map();
    for (const x of list) { if (!by.has(x.store.id)) by.set(x.store.id, []); by.get(x.store.id).push(x); }
    const flat = [];
    for (const arr of by.values()) flat.push(...spread(arr, 3));
    return flat.sort((a, b) => (quality(b.store) + (b.item.exact ? 0.3 : 0)) - (quality(a.store) + (a.item.exact ? 0.3 : 0)) || a.est - b.est).slice(0, n);
  }

  // ---- Combo: una compra por categoría pedida, aprovechando el presupuesto sin pasarse ----
  function planCombo(budget, cats, pool) {
    const lists = cats.slice(0, 4).map((c) => ({ cat: c, c: diverse(candidates(c, pool, budget), 9) }));
    const missing = lists.filter((l) => !l.c.length).map((l) => l.cat);
    const active = lists.filter((l) => l.c.length);
    let best = null;
    // 1) Elegir la combinación cuyos PRECIOS MÍNIMOS sumen lo más cerca del presupuesto (sin pasarse)
    (function rec(i, acc, sum) {
      if (i === active.length) {
        const stores = new Set(acc.map((x) => x.store.id)).size;
        const q = acc.reduce((a, x) => a + quality(x.store), 0);
        if (!best || sum > best.sum || (sum === best.sum && (stores < best.stores || (stores === best.stores && q > best.q)))) best = { picks: acc.slice(), sum, stores, q };
        return;
      }
      for (const c of active[i].c) if (sum + c.item.min <= budget) { acc.push({ cat: active[i].cat, ...c }); rec(i + 1, acc, sum + c.item.min); acc.pop(); }
    })(0, [], 0);
    if (!best) return { picks: [], total: 0, left: budget, missing: missing.concat(active.map((l) => l.cat)), tight: false, extra: null, alts: {} };
    // 2) Repartir lo que sobra entre las compras (hasta el tercio bajo del rango) -> gasto probable
    const share = (budget - best.sum) / best.picks.length;
    const picks = best.picks.map((p) => ({ ...p, est: Math.round(p.item.min + Math.min((p.item.max - p.item.min) * 0.35, share)) }));
    const tight = false;
    const total = picks.reduce((a, p) => a + p.est, 0);
    const left = budget - total;
    const extra = extraFor(left, cats, pool);
    // 5 alternativas por categoría (la elegida va primero) para poder cambiarlas desde la interfaz
    const alts = {};
    for (const l of active) {
      const pick = picks.find((p) => p.cat === l.cat);
      const rest = candidates(l.cat, pool, budget).filter((c) => !(c.store.id === pick.store.id && c.item.name === pick.item.name));
      const far = rest.filter((c) => Math.abs(c.est - pick.est) / Math.max(pick.est, 1) > 0.15);
      alts[l.cat] = takeN(far, 5, [pick]);
      if (alts[l.cat].length < 5) alts[l.cat] = takeN(rest, 5, alts[l.cat]);
    }
    return { picks, total, left, missing, tight, extra, alts };
  }

  // ---- Modo ruta: compras primero, comida/café al final. Sin mapa interno aún (usa store.zone si existe) ----
  function route(picks, extra) {
    const food = new Set(["comida", "cafe", "postres"]);
    const all = picks.concat(extra ? [extra] : []);
    const ordered = all.slice().sort((a, b) => (food.has(a.cat) - food.has(b.cat)) || ((a.store.zone ?? 99) - (b.store.zone ?? 99)));
    return ordered.map((p, i) => `${i + 1}. ${p.store.name}: ${p.item.name}`);
  }

  // ---- Comparador: "quiero una sudadera negra" -> todas las sudaderas; primero las que coinciden con más palabras ----
  function matchedTags(text, pool) {
    const words = norm(text).split(/[^a-z0-9ñ]+/).filter((w) => w && !/^\d+$/.test(w)); // el monto no es una etiqueta
    const found = new Set();
    for (const s of pool) for (const i of itemsOf(s)) for (const g of i.tags || []) {
      const t = norm(g);
      if (words.some((w) => w === t || w === t + "s" || w === t + "es")) found.add(t);
    }
    return [...found];
  }
  function compare(tags, pool, budget, cat) {
    const rows = [];
    for (const s of pool) for (const i of itemsOf(s)) {
      const tg = (i.tags || []).map(norm), hit = tags.filter((x) => tg.includes(x)).length || (cat && i.cat === cat ? 1 : 0);
      if (hit) rows.push({ store: s, item: i, est: est(i), hit });
    }
    rows.sort((a, b) => b.hit - a.hit || a.est - b.est || quality(b.store) - quality(a.store));
    const shown = budget ? rows.filter((r) => r.item.min <= budget) : rows;
    const cheapest = shown.reduce((m, r) => (!m || r.est < m.est ? r : m), null);
    const rated = shown.filter((r) => r.store.rating);
    const bestRated = rated.length ? rated.reduce((a, b) => (b.store.rating > a.store.rating ? b : a)) : null;
    const top = shown.length ? shown[0].hit : 0;
    const exact = shown.filter((r) => r.hit > 1 || r.item.exact).slice(0, 2);
    const rest = shown.filter((r) => !exact.includes(r));
    const picks = takeN(rest, 5, exact).sort((a, b) => (b.hit - a.hit) || a.est - b.est);
    return { rows: shown, picks, hidden: rows.length - shown.length, cheapest, bestRated, bestMatch: top > 1 ? shown[0] : null };
  }

  // ---- Detector de presupuesto: oculta tiendas donde nada entra ----
  function affordable(pool, budget) {
    const ok = pool.filter((s) => itemsOf(s).some((i) => i.min <= budget));
    return { stores: ok.sort((a, b) => quality(b) - quality(a)), hidden: pool.length - ok.length };
  }

  // Conversación básica: saludos, gracias, despedidas, «quién eres», etc.
  function smalltalk(text) {
    const t = norm(text).replace(/[¡!¿?.,;:]/g, " ").replace(/\s+/g, " ").trim();
    const rules = [
      ["thanks", /\b(gracias|grax|thx|te agradezco|muy amable)\b/],
      ["bye", /\b(adios|nos vemos|hasta luego|hasta pronto|bye|chao|chau)\b/],
      ["how", /\b(como estas|como te va|como andas|que tal estas|como te encuentras)\b/],
      ["who", /\b(quien eres|que eres|como te llamas|que haces|que puedes hacer|como funciona|como te uso|ayuda|ayudame|help)\b/],
      ["greet", /^(h+o+l+a+|ho+li+|ola+|hey+|buenas|buen(os)? (dia|dias|tarde|tardes|noche|noches)|que onda|que tal|saludos|hello|hi|epale|quiubo)\b/],
      ["ok", /^(ok|okey|vale|listo|perfecto|va|sale|entendido|excelente|genial|chido|super|bien)( .*)?$/]
    ];
    for (const [k, re] of rules) if (re.test(t)) return k;
    return null;
  }

  function recommend(text, data, stores) {
    const { PLAZAS, CATEGORIES } = data;
    const budget = parseBudget(text);
    const plaza = detectPlaza(text, PLAZAS);
    const cats = detectCats(text, CATEGORIES);
    const wantsLocal = /\b(locales?|fondas?|taquer\w*|cenadur\w*|de barrio|loncher\w*)\b/.test(norm(text));
    const locals = stores.filter((s) => s.anyPlaza);
    // Primero lo de la plaza; lo local sólo si lo pides (entonces va solo, para que se note)
    const pool = wantsLocal && locals.length ? locals : stores.filter((s) => (s.anyPlaza ? plaza === "locales" : !plaza || s.plaza === plaza));
    const base = { budget, plaza, cats };
    if (!pool.length) return { ...base, type: "empty", message: plaza ? `Aún no tengo tiendas de ${PLAZAS[plaza].name}. Sincroniza desde Google en Ajustes o agrégalas en «Agregar».` : "Aún no hay tiendas cargadas." };

    const tags = matchedTags(text, pool);
    if (!budget && !cats.length && !tags.length) return { ...base, type: "chat", kind: smalltalk(text) || "unknown" };
    if (tags.length && cats.length <= 1) return { ...base, type: "compare", tags, tag: tags.join(" "), ...compare(tags, pool, budget) };
    if (!budget) return { ...base, type: "ask", message: "¿Con qué presupuesto cuentas? Ej: «$1,500 en Altaria, ropa y perfume»." };
    if (cats.length) { const plan = planCombo(budget, cats, pool); return { ...base, type: "combo", ...plan, route: route(plan.picks, plan.extra) }; }
    return { ...base, type: "list", ...affordable(pool, budget) };
  }

  const api = { parseBudget, detectPlaza, detectCats, itemsOf, est, planCombo, extraFor, reprice, route, matchedTags, compare, affordable, recommend, smalltalk, norm };
  root.GastaEngine = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
