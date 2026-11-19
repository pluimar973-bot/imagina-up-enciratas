const { CITIES, PLAZAS, STORES: SEED } = window.GASTABOT_DATA;
const I = GastaIcons, E = GastaEngine, N = E.norm;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const money = (n) => "$" + Math.round(n).toLocaleString("es-MX");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safeUrl = (u) => (u && /^https?:\/\//i.test(u) ? u : null);
// Fotos de producto: web, incrustadas (HTML único) o del catálogo local img/c/
const safeImg = (u) => (u && /^(https?:\/\/|data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$|img\/c\/[\w.-]+\.jpg$)/i.test(u) ? u : null);
const SEG = ["var(--s1)", "var(--s2)", "var(--s3)", "var(--s4)", "var(--s3)"];
const FIRST_CATS = ["ropa", "calzado", "perfumes", "belleza", "comida", "cafe", "postres", "hogar", "tecnologia", "regalos"];
const ALL_CATS = Object.keys(I.LABEL).filter((c) => c !== "otros");

const S = { stores: [], offers: [], favs: [], admin: false, cloud: false, session: null, profile: null, settings: {}, plaza: "altaria", budget: 0, cats: new Set(), moreCats: false, stack: [], chat: null };
const newChat = () => ({ id: (crypto.randomUUID ? crypto.randomUUID() : "c" + Date.now()), title: "", messages: [] });

// ---------- Datos ----------
function mergeStores(base, extra) {
  const map = new Map(base.map((s) => [s.plaza + "|" + N(s.name), { ...s }]));
  for (const e of extra) {
    const k = e.plaza + "|" + N(e.name), cur = map.get(k);
    map.set(k, cur ? { ...cur, ...e, items: e.items || cur.items, cats: [...new Set([...(cur.cats || []), ...(e.cats || [])])], verified: cur.verified || e.verified, min: cur.items ? cur.min : e.min, max: cur.items ? cur.max : e.max } : { ...e });
  }
  return [...map.values()];
}
async function loadAll() {
  S.settings = await DB.getSettings();
  S.cloud = await DB.isCloud();
  S.session = await DB.getSession();
  S.profile = S.session?.user ? await DB.getProfile().catch(() => null) : null;
  let extra = [];
  try { extra = await DB.listStores(S.settings.city || "aguascalientes"); } catch (e) { console.warn("Nube no disponible:", e.message); }
  S.stores = mergeStores(SEED, extra);
  GastaPhotos.config({ pexelsKey: S.settings.pexelsKey });
  try { S.offers = await DB.listOffers(); } catch { S.offers = []; }
  for (const s of S.stores) {
    const o = S.offers.find((o) => o.store_id === s.id || (o.store_name && N(o.store_name) === N(s.name) && true));
    s.promo = o ? `${o.text} (hasta ${o.valid_until})` : null;
  }
  S.favs = await DB.getFavs().catch(() => []);
  S.admin = await DB.isAdmin().catch(() => false);
  refreshNotifs();
}
const poolFor = (plazaId) => S.stores.filter((s) => (s.anyPlaza ? plazaId === "locales" : !plazaId || s.plaza === plazaId));
const plazaName = (id) => PLAZAS[id]?.name || id;

// ---------- Piezas visuales ----------
const hostOf = (u) => { try { return new URL(u).hostname; } catch { return null; } };
const M = window.GASTABOT_MENUS || { CAT_EMOJI: {}, CAT_HUE: {} };
const GV = window.GastaVisual;
function thumb(store, item, cat, cls = "") {
  const c = item?.cat || cat || store?.cats?.[0] || "otros";
  const img = safeImg(item?.img), host = store?.site ? hostOf(store.site) : null;
  const logo = !img && host ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64` : null;
  const hue = M.CAT_HUE[c] ?? 150;
  const prof = img || !item ? null : GV.profile(store, item), key = prof ? prof.art : GastaArt.keyFor(item, c);
  const art = img ? "" : `<span class="art" aria-hidden="true">${GastaArt.svg(key, 40)}</span>${prof ? `<img class="ph" data-p="${esc(prof.id)}" data-s="${esc((store?.id || "") + "|" + (item?.name || ""))}" alt="" loading="lazy">` : ""}`;
  return `<span class="thumb tile ${img ? "photo" : ""} ${cls}" style="--h:${hue}">${art}${img ? `<img src="${esc(img)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ""}${logo ? `<img class="logo" src="${esc(logo)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ""}</span>`;
}
const kindTag = (i) => (i?.kind === "combo" ? '<span class="tag kind">Combo</span>' : i?.kind === "solo" ? '<span class="tag solo">Solo</span>' : "");
const descOf = (i) => (i?.desc ? `<span class="desc">${esc(i.desc)}</span>` : "");
const priceTxt = (est, item) => (item?.exact ? money(est) : "~" + money(est));
const mark = (s) => (s.verified ? '<span title="Confirmada" aria-label="Confirmada" style="color:var(--bill)">✔</span>' : '<span title="Por confirmar" aria-label="Por confirmar" style="color:var(--muted)">?</span>');
const favBtn = (id) => `<button class="star" data-act="fav" data-id="${esc(id)}" aria-pressed="${S.favs.includes(id)}" aria-label="Guardar tienda en favoritos">${I.svg("star", 18)}</button>`;
const promoTag = (s) => (s.promo ? `<span class="tag warn">Oferta</span>` : "");
function hydrate(ref) {
  const store = S.stores.find((s) => s.id === ref.sid);
  // «aka»: nombre anterior del producto genérico (chats guardados antes de v1.1 siguen abriendo)
  const item = store && (E.itemsOf(store).find((i) => i.name === ref.iname) || E.itemsOf(store).find((i) => (i.aka || []).includes(ref.iname)));
  return store && item ? { store, item } : null;
}
const ref = (p) => ({ sid: p.store.id, iname: p.item.name });
// Atributos que convierten cualquier fila de producto en botón que abre su ficha (detalle + mini catálogo)
const dAttrs = (store, item, kind = "view", extra = "") => `role="button" tabindex="0" aria-haspopup="dialog" data-act="detail" data-kind="${kind}" data-sid="${esc(store.id)}" data-iname="${esc(item.name)}" ${extra}`;

// ---------- Renderizado de mensajes ----------
function renderCombo(m, i) {
  const pool = poolFor(m.plazaId);
  const picks = m.picks.map((p) => { const h = hydrate(p); return h ? { cat: p.cat, ...h } : null; }).filter(Boolean);
  if (!picks.length) return `<p>Esa combinación ya no está disponible. Arma otro combo.</p>`;
  const adds = (m.adds || []).map((a, n) => { const h = hydrate(a); return h ? { n, ...h, est: h.item.min } : null; }).filter(Boolean); // lo agregado cuenta con su precio mínimo (es lo que seguro cuesta)
  const addsTotal = adds.reduce((a, x) => a + x.est, 0), bEff = m.budget - addsTotal;
  const rp = E.reprice(bEff, picks);
  const extra = E.extraFor(rp.left, m.cats, pool);
  const spent = rp.total + addsTotal + (extra ? extra.est : 0);
  const base = Math.max(m.budget, spent);
  const seg = rp.picks.map((p, k) => `<i style="--k:${k};flex-basis:${(p.est / base) * 100}%;background:${SEG[k % SEG.length]}"></i>`).join("") + adds.map((x, k) => `<i style="flex-basis:${(x.est / base) * 100}%;background:${SEG[(rp.picks.length + k) % SEG.length]}"></i>`).join("") + (extra ? `<i style="flex-basis:${(extra.est / base) * 100}%;background:var(--s4)"></i>` : "") + (spent < m.budget ? `<i class="left"></i>` : "");
  const over = rp.over || spent > m.budget;
  const free = Math.max(0, m.budget - rp.sumMin - addsTotal); // margen real: lo que queda con los precios mínimos
  const rows = rp.picks.map((p, k) => {
    const open = m.open === p.cat;
    const alts = (m.alts?.[p.cat] || []).map((a) => ({ a, h: hydrate(a) })).filter((x) => x.h);
    const optHtml = alts.map(({ a, h }, j) => {
      const test = rp.picks.map((x) => (x.cat === p.cat ? { cat: x.cat, store: h.store, item: h.item } : x));
      const r2 = E.reprice(bEff, test), est = r2.picks.find((x) => x.cat === p.cat).est;
      const sel = a.sid === p.store.id && a.iname === p.item.name;
      return `<button class="opt" style="--j:${j};--h:${M.CAT_HUE[p.cat] ?? 150}" role="radio" aria-checked="${sel}" data-act="pick" data-i="${i}" data-cat="${p.cat}" data-j="${j}">
        <span class="radio">${sel ? I.svg("check", 11, 2.6) : ""}</span>${thumb(h.store, h.item, p.cat, "xs")}
        <span class="txt"><span class="name">${esc(h.item.name)}</span><span class="sm">${esc(h.store.name)} ${mark(h.store)}${kindTag(h.item)}${GV.sameBrand(p.store, h.store) ? "" : '<span class="btag other inl">Otra marca</span>'}</span>${descOf(h.item)}</span>
        <span class="price">${priceTxt(est, h.item)}${r2.over ? '<small style="color:var(--warn)">te pasas</small>' : ""}</span></button>`;
    }).join("");
    return `<div class="row ${open ? "open" : ""}" style="--k:${k};--h:${M.CAT_HUE[p.cat] ?? 150}">
      <div class="main" ${dAttrs(p.store, p.item, "combo", `data-i="${i}" data-cat="${p.cat}"`)}>
        ${thumb(p.store, p.item, p.cat)}
        <span class="txt"><span class="name">${esc(p.item.name)}</span><span class="sm">${esc(p.store.name)} ${mark(p.store)}${kindTag(p.item)}${promoTag(p.store)}</span>${descOf(p.item)}</span>
        <span class="price"><span class="dot" style="background:${SEG[k % SEG.length]}"></span>${priceTxt(p.est, p.item)}${p.item.exact ? "" : `<small>${money(p.item.min)} a ${money(p.item.max)}</small>`}</span>
      </div><button class="star chev-btn" data-act="toggle" data-i="${i}" data-cat="${p.cat}" aria-expanded="${open}" aria-label="Ver otras opciones de ${esc(I.LABEL[p.cat] || p.cat)}"><span class="chev2">${I.svg("chevron", 16)}</span></button>${favBtn(p.store.id)}</div>
      <div class="alts" role="radiogroup" aria-label="Otras opciones de ${esc(I.LABEL[p.cat] || p.cat)}">${alts.some(({ h }) => !GV.sameBrand(p.store, h.store)) ? `<p class="brand-note">${I.svg("info", 15)}<span>Las opciones con «Otra marca» no son de ${esc(GV.brandName(p.store))}: son parecidas que quizá te gusten.</span></p>` : ""}${optHtml}${p.store.menu ? `<button class="menu-link" data-act="store" data-id="${esc(p.store.id)}">Ver menú de ${esc(p.store.name)} ${I.svg("chevron", 12)}</button>` : ""}</div>`;
  }).join("");
  const addRows = adds.map((x, k) => `<div class="row added" style="--k:${rp.picks.length + k};--h:${M.CAT_HUE[x.item.cat] ?? 150}"><div class="main" ${dAttrs(x.store, x.item)}>${thumb(x.store, x.item, x.item.cat)}<span class="txt"><span class="name">${esc(x.item.name)}</span><span class="sm">${esc(x.store.name)} ${mark(x.store)}${kindTag(x.item)}<span class="tag">Agregado</span></span></span><span class="price">${x.item.exact ? priceTxt(x.est, x.item) : "desde " + money(x.est)}</span></div><button class="star rm" data-act="rm-add" data-i="${i}" data-n="${x.n}" aria-label="Quitar del combo">${I.svg("trash", 17)}</button></div>`).join("");
  const extraRow = extra ? `<div class="row extra" style="--k:${rp.picks.length}"><div class="main" ${dAttrs(extra.store, extra.item)}>${thumb(extra.store, extra.item, "cafe")}<span class="txt"><span class="name">${esc(extra.item.name)}</span><span class="sm">Aún te alcanza en ${esc(extra.store.name)}</span></span><span class="price">${priceTxt(extra.est, extra.item)}</span></div>${favBtn(extra.store.id)}</div>` : "";
  const route = E.route(rp.picks, extra).map((x, k) => { const t = x.replace(/^\d+\.\s*/, ""), c = t.indexOf(": "); return `<li><span class="n">${k + 1}</span><b>${esc(t.slice(0, c))}</b><span class="sm">${esc(t.slice(c + 2))}</span></li>`; }).join("");
  const miss = m.missing?.length ? `<p class="note">No te alcanzó para: ${esc(m.missing.map((c) => I.LABEL[c] || c).join(", "))}.</p>` : "";
  return `<section class="ticket ${m.bump ? "bumped" : ""}"><div class="t-head"><h3>Tu combo</h3><span class="t-budget">${money(m.budget)}</span></div>${m.intro ? `<p class="sub">${esc(m.intro)}</p>` : ""}
    <div class="bar ${over ? "over" : ""}" role="img" aria-label="Gastas ${money(spent)} de ${money(m.budget)}">${seg}</div>
    <div class="sums"><span>Gastas <b class="num" data-to="${Math.round(spent)}">${money(spent)}</b></span>${spent > m.budget ? `<span class="over">Te pasas <b>${money(spent - m.budget)}</b></span>` : `<span>Te sobran <b class="num" data-to="${Math.round(m.budget - spent)}">${money(m.budget - spent)}</b></span>`}</div>
    <div class="rows">${rows}${addRows}${extraRow}</div>
    ${free >= 40 ? `<div class="chips reply"><button class="chip" data-act="more-ideas">¿Qué más me alcanza? (hasta ${money(free)})</button></div>` : ""}
    <ol class="route" aria-label="Ruta sugerida">${route}</ol>${miss}
    <p class="note">Toca una compra para ver otras opciones. Con «~» son estimados por rango; los demás son precios de lista publicados. Confirma en la tienda.</p></section>`;
}

function renderCompare(m, i) {
  const r = E.compare(m.tags, poolFor(m.plazaId), m.budget, m.cat);
  if (!r.rows.length) {
    const all = E.compare(m.tags, poolFor(m.plazaId), 0, m.cat), low = all.cheapest;
    const need = low && m.addTo != null ? ` Lo más barato cuesta ${priceTxt(low.est, low.item)} (${esc(low.item.name)} en ${esc(low.store.name)}); te faltan ${money(Math.max(0, low.item.min - m.budget))}.` : "";
    return `<p>No encontré «${esc(m.tags.join(" ") || I.LABEL[m.cat] || "eso")}»${m.budget ? " dentro de " + money(m.budget) : ""}.${need} Prueba con otra palabra o sube el monto.</p>${m.addTo != null ? chipsHtml([{ label: "Subir el presupuesto", act: "edit-budget" }]) : ""}`;
  }
  const show = m.expanded ? r.rows : r.picks;
  const rows = show.map((x, k) => `<div class="row" style="--k:${k};--h:${M.CAT_HUE[x.item.cat] ?? 150}"><div class="main" ${m.addTo != null ? dAttrs(x.store, x.item, "add", `data-ci="${m.addTo}"`) : dAttrs(x.store, x.item)}>${thumb(x.store, x.item, x.item.cat)}
    <span class="txt"><span class="name">${esc(x.item.name)}</span>
    <span class="sm">${x.store.menu ? `<button class="lnk" data-act="store" data-id="${esc(x.store.id)}">${esc(x.store.name)}</button>` : esc(x.store.name)} ${mark(x.store)}${kindTag(x.item)}${x === r.cheapest ? '<span class="tag">Más barata</span>' : ""}${x === r.bestRated ? '<span class="tag">Mejor calificada</span>' : ""}${x === r.bestMatch ? '<span class="tag">Coincide más</span>' : ""}${promoTag(x.store)}${x.store.rating ? " ★" + x.store.rating : ""}</span>${descOf(x.item)}</span>
    <span class="price">${priceTxt(x.est, x.item)}${x.item.exact ? "" : `<small>${money(x.item.min)} a ${money(x.item.max)}</small>`}</span></div>${m.addTo != null ? `<button class="add" data-act="add-item" data-ci="${m.addTo}" data-sid="${esc(x.store.id)}" data-iname="${esc(x.item.name)}">+ Agregar</button>` : ""}${favBtn(x.store.id)}</div>`).join("");
  const rest = r.rows.length - r.picks.length;
  return `<h3>${esc(m.tags.join(" ") || I.LABEL[m.cat] || "")}</h3><p class="sub">${m.intro ? esc(m.intro) : `${plazaName(m.plazaId) || "Todas las plazas"}${m.budget ? ", hasta " + money(m.budget) : ""}. Te muestro cinco opciones con su precio.`}</p>
    <div class="flat">${rows}</div>${rest > 0 ? `<button class="more-btn" data-act="more" data-i="${i}">${m.expanded ? "Ver menos" : `Ver ${rest} más`}</button>` : ""}
    ${r.hidden ? `<p class="note">Oculté ${r.hidden} opción(es) fuera de tu presupuesto.</p>` : ""}`;
}

function renderList(m, i) {
  const r = E.affordable(poolFor(m.plazaId), m.budget);
  if (!r.stores.length) return `<p>Con ${money(m.budget)} no encontré tiendas en ${esc(plazaName(m.plazaId) || "esa zona")}.</p>`;
  const show = m.expanded ? r.stores : r.stores.slice(0, 4);
  const rows = show.map((s) => {
    const its = E.itemsOf(s).filter((x) => x.min <= m.budget), cat = its[0]?.cat || s.cats[0];
    const low = Math.min(...its.map((x) => x.min));
    return `<div class="row"><div class="main" style="cursor:default">${thumb(s, its[0], cat)}<span class="txt"><span class="name">${esc(s.name)} ${mark(s)}${promoTag(s)}</span><span class="sm">${esc(its.slice(0, 2).map((x) => x.name).join(", "))}</span></span><span class="price"><small style="display:inline;margin-right:4px">desde</small>${money(low)}</span></div>${favBtn(s.id)}</div>`;
  }).join("");
  const rest = r.stores.length - 4;
  return `<h3>${m.intro ? esc(m.intro) : `Con ${money(m.budget)} te alcanza en`}</h3><p class="sub">${esc(plazaName(m.plazaId) || "Todas las plazas")}. Oculté ${r.hidden} tienda(s) donde nada entra en tu monto.</p><div class="flat">${rows}</div>${rest > 0 ? `<button class="more-btn" data-act="more" data-i="${i}">${m.expanded ? "Ver menos" : `Ver ${rest} más`}</button>` : ""}`;
}

const chipsHtml = (cs) => (cs?.length ? `<div class="chips reply">${cs.map((c) => `<button class="chip" data-act="${esc(c.act)}"${c.id ? ` data-id="${esc(c.id)}"` : ""}${c.q ? ` data-q="${esc(c.q)}"` : ""}>${esc(c.label)}</button>`).join("")}</div>` : "");

// ---------- Franja fija bajo la conversación y locales recomendados (v2.5) ----------
function stripHtml() {
  const near = NEAR.pos ? "Cerca de ti" : "Cerca de mí";
  return `<nav class="strip" aria-label="Más opciones"><span class="sm muted">Más opciones</span><div class="chips" style="margin:4px 0 0;gap:6px">
    <a class="chip" href="${esc(rappiUrl(lastFoodQ()))}" target="_blank" rel="noopener noreferrer">Rappi ${I.svg("external", 13)}</a>
    <a class="chip" href="${esc(DIDI_URL)}" target="_blank" rel="noopener noreferrer">DiDi Food ${I.svg("external", 13)}</a>
    <button class="chip" data-act="page" data-page="delivery">A domicilio</button>
    <button class="chip" data-act="page" data-page="localfood">Comida local</button>
    <button class="chip" data-act="page" data-page="prices">Productos locales</button>
    <button class="chip" data-act="page" data-page="near">${near}</button></div></nav>`;
}
function lastFoodQ() { const u = [...S.chat.messages].reverse().find((m) => m.who === "u"); const t = u ? String(u.text).replace(/\$?\s?\d[\d,.]*/g, "").replace(/\b(con|de|en|para|quiero|dame|armame|un|una|y)\b/gi, " ").replace(/\s+/g, " ").trim() : ""; return t.length >= 3 ? t.slice(0, 40) : "Comida"; }
// Qué categorías locales pegan con lo que se pidió (para que haya de todo un poco)
const LOC_BY_CAT = { comida: ["abarrotes", "mercado"], cafe: ["abarrotes"], postres: ["abarrotes"], super: ["abarrotes", "mercado"], hogar: ["materiales", "servicios"], decoracion: ["materiales", "servicios"], ropa: ["telas", "servicios"], calzado: ["servicios"], tecnologia: ["servicios"], deportes: ["servicios"] };
function localRecs(i) {
  const LC = window.GASTABOT_LOCALES, msgs = S.chat.messages, m = msgs[i]; if (!LC || !m) return [];
  const prev = i > 0 && msgs[i - 1].who === "u" ? msgs[i - 1].text : "", words = nz(prev).split(" ").filter((w) => w.length >= 4);
  const cats = new Set((m.cats || []).flatMap((c) => LOC_BY_CAT[c] || []));
  const pool = LC.ITEMS.map((r, k) => {
    const hay = nz(r.product + " " + r.where.map((w) => w.label).join(" ")); let s = words.reduce((a, w) => a + (hay.includes(w.slice(0, 5)) ? 3 : 0), 0);
    if (cats.has(r.category)) s += 1; return { r, s, k };
  });
  const seed = (i * 7) % Math.max(1, pool.length);   // rota para variar entre mensajes
  return pool.map((x) => ({ ...x, o: (x.k + pool.length - seed) % pool.length })).filter((x) => x.s > 0 || !cats.size).sort((a, b) => b.s - a.s || a.o - b.o).slice(0, 2).map((x) => x.r);
}
// Comida local barata (restaurantes y tipos de negocio) que cabe en el presupuesto del mensaje
function localFoodRecs(i) {
  const m = S.chat.messages[i]; if (!m) return [];
  const budget = m.budget || 0, cats = m.cats || [], wantsFood = !cats.length || cats.some((c) => ["comida", "cafe", "postres"].includes(c));
  if (!wantsFood) return [];
  const pool = S.stores.filter((s) => s.local && s.items?.length).map((s) => {
    const its = s.items.filter((x) => !budget || x.min <= budget).sort((a, b) => a.min - b.min); return its.length ? { s, it: its[Math.min(its.length - 1, (i + s.id.length) % Math.min(2, its.length))] } : null;
  }).filter(Boolean);
  if (!pool.length) return [];
  const seed = (i * 5) % pool.length; return pool.slice(seed).concat(pool.slice(0, seed)).slice(0, 2);
}
function localFoodHtml(i) {
  const fs = localFoodRecs(i); if (!fs.length) return "";
  return `<div class="loc-food"><h4>Comida local, barata <span class="tag solo">Estimado</span></h4><div class="menu-grid" style="padding:0">${fs.map(({ s, it }, k) => `<article class="dish est" style="--k:${k};--h:24" data-act="store" data-id="${esc(s.id)}" role="button" tabindex="0">${thumb(s, it, it.cat)}<div class="dish-t"><b>${esc(it.name)}</b><span class="est-p">~${money(it.min)} a ${money(it.max)}</span><span class="sm muted">${esc(s.generic ? s.name.replace(/ \(tipo de negocio\)/, "") : s.name)}</span></div></article>`).join("")}</div>
    <button class="lnk" data-act="page" data-page="localfood">Ver más comida local</button></div>`;
}
function localRecHtml(i) {
  const rs = localRecs(i), food = localFoodHtml(i); if (!rs.length) return food ? `<section class="loc-rec">${food}</section>` : "";
  const store = { id: "local", name: "Precios locales", cats: ["otros"] };
  return `<section class="loc-rec"><h4>De negocios locales <span class="tag solo">Estimado</span></h4><div class="menu-grid" style="padding:0">${rs.map((r, k) => `<article class="dish est" style="--k:${k};--h:150;cursor:pointer" data-act="page" data-page="prices" role="button" tabindex="0">${thumb(store, { name: r.product, cat: "otros", type: r.type, tags: [] }, "otros")}<div class="dish-t"><b>${esc(r.product)}</b><span class="est-p">${money(r.min)} a ${money(r.max)} <small>/ ${esc(r.unit)}</small></span><span class="chips" style="margin:2px 0 0;gap:6px">${r.where.slice(0, 2).map((w) => `<a class="chip" href="${esc(mapQ(w.q))}" target="_blank" rel="noopener noreferrer">${esc(w.label)}</a>`).join("")}</span></div></article>`).join("")}</div>
    <button class="lnk" data-act="page" data-page="prices">Ver más productos locales</button>${food}</section>`;
}
function msgHtml(m, i) {
  if (m.who === "u") return `<div class="u" data-msg="${i}">${esc(m.text)}</div>`;
  const body = m.k === "typing" ? `<p class="typing" aria-label="Escribiendo"><i></i><i></i><i></i></p>` : m.k === "combo" ? renderCombo(m, i) : m.k === "compare" ? renderCompare(m, i) : m.k === "list" ? renderList(m, i) : `<p>${esc(m.text)}</p>${chipsHtml(m.chips)}`;
  const loc = ["combo", "compare", "list"].includes(m.k) ? localRecHtml(i) : "";
  return `<article class="bot ${S.fresh === i ? "fresh" : ""}" data-msg="${i}">${body}${loc}</article>`;
}
function renderThread() {
  const msgs = S.chat.messages;
  $("#hero").hidden = msgs.length > 0;
  $("#thread").innerHTML = msgs.map(msgHtml).join("") + (msgs.length && !msgs.some((m) => m.k === "typing") ? stripHtml() : "");
  placeComposer();
  const main = $("#main"); main.scrollTop = msgs.length ? main.scrollHeight : 0;
}
// Primer mensaje: el chat va justo bajo el presupuesto; ya con conversación vuelve abajo, a su lugar de siempre
function placeComposer() {
  const c = $("#composer"), slot = $("#heroComposer"), inHero = !$("#hero").hidden;
  if (inHero && c.parentNode !== slot) slot.appendChild(c);
  else if (!inHero && c.parentNode !== document.body) { document.body.insertBefore(c, $("#toast")); c.querySelector("input").focus({ preventScroll: true }); }
  c.classList.toggle("in-hero", inHero);
}
function renderOne(i) {
  const el = $(`[data-msg="${i}"]`); if (!el) return renderThread();
  const keep = $("#main").scrollTop; el.outerHTML = msgHtml(S.chat.messages[i], i); $("#main").scrollTop = keep;
}
// Los números del ticket "corren" hasta su valor (si el usuario no pidió menos movimiento)
function countUp(root = document) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  $$(".num[data-to]", root).forEach((el) => {
    const to = +el.dataset.to, t0 = performance.now(), dur = 650;
    const tick = (t) => { const p = Math.min(1, (t - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - p, 3))); el.textContent = money(v); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
}

// ---------- Preguntar ----------
function toModel(r, text) {
  const base = { who: "bot", plazaId: r.plaza || S.plaza || "", budget: r.budget };
  if (r.type === "combo") {
    if (!r.picks.length) return { who: "bot", k: "text", text: `Con ${money(r.budget)} no encontré opciones para ${r.missing.map((c) => I.LABEL[c] || c).join(", ")}${r.plaza ? " en " + plazaName(r.plaza) : ""}. Sube el monto o prueba otra categoría.` };
    const alts = {}; for (const [c, list] of Object.entries(r.alts)) alts[c] = list.map(ref);
    return { ...base, k: "combo", cats: r.cats, picks: r.picks.map((p) => ({ cat: p.cat, ...ref(p) })), alts, missing: r.missing, open: null };
  }
  if (r.type === "compare") return { ...base, k: "compare", tags: r.tags, expanded: false };
  if (r.type === "list") return { ...base, k: "list", expanded: false };
  if (r.type === "chat") return chatReply(r);
  return { who: "bot", k: "text", text: r.message };
}
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const EXAMPLES = [{ label: "$800 en Altaria, una sudadera", act: "example", q: "$800 en Altaria, una sudadera" }, { label: "Ropa, perfume y comida", act: "example", q: "Tengo $2,400: ropa, perfume y comida" }, { label: "Menú de Chili's", act: "example", q: "menú de Chili's" }];
function storeAsked(text) {
  const t = N(text);
  if (!/\b(menu|menus|carta)\b/.test(t)) return null;
  return S.stores.filter((s) => s.menu).sort((a, b) => b.name.length - a.name.length).find((s) => t.includes(N(s.name).replace(/\s+/g, " "))) || null;
}
function chatReply(r) {
  const first = (S.profile?.name || S.session?.user?.name || "").split(" ")[0];
  const bud = S.budget > 0 ? money(S.budget) : null;
  const catChips = ["ropa", "perfumes", "comida", "cafe"].map((c) => ({ label: I.LABEL[c], act: "example", q: `quiero ${I.LABEL[c].toLowerCase()}` }));
  const T = (text, chips) => ({ who: "bot", k: "text", text, chips });
  switch (r.kind) {
    case "greet": return T(pick([
      `¡Holaaa${first ? ", " + first : ""}! Qué gusto. ${bud ? `Tengo anotado tu presupuesto de ${bud}. ` : ""}¿Qué se te antoja hoy?`,
      `¡Hola${first ? ", " + first : ""}! Soy gastabot. ${bud ? `Con ${bud} ` : "Dime cuánto traes y "}${bud ? "podemos buscar algo bueno. " : "te busco algo bueno. "}¿Ropa, perfume, comida?`,
      `¡Holaaa! Aquí estoy. Cuéntame qué buscas${bud ? ` y lo ajusto a tus ${bud}` : " y cuánto quieres gastar"}.`
    ]), catChips);
    case "how": return T(pick(["¡Muy bien, gracias por preguntar! Con ganas de que tu dinero rinda. ¿Qué se te antoja hoy?", "¡Todo bien por aquí! ¿Y tú? Cuéntame qué buscas y lo vemos."]), catChips);
    case "thanks": return T(pick(["¡De nada! Si quieres otra opción o cambiar el presupuesto, aquí sigo.", "¡Con gusto! Cualquier otra cosa que se te antoje, dime."]));
    case "bye": return T(`¡Nos vemos! ${bud ? `Dejo guardado tu presupuesto de ${bud}.` : "Aquí estaré cuando quieras comprar algo."}`);
    case "ok": return T(pick(["Perfecto. ¿Algo más que se te antoje?", "Listo. ¿Buscamos otra cosa?"]), catChips);
    case "who": return T("Soy gastabot. Te ayudo a gastar bien tu presupuesto en las plazas de Aguascalientes: me dices cuánto traes y qué se te antoja, y te muestro 5 opciones con precio. También te enseño el menú de una tienda; prueba con «menú de Chili's».", EXAMPLES);
    case "store": return T(`Aquí está el menú de ${r.store.name}.`, [{ label: `Ver menú de ${r.store.name}`, act: "store", id: r.store.id }]);
    default: return T("Mmm, no te entendí bien. Dime cuánto traes y qué buscas, por ejemplo «$800 en Altaria, una sudadera», o toca un ejemplo.", EXAMPLES);
  }
}
// ---------- Memoria del combo: «agrega…», «qué más me alcanza» ----------
const lastCombo = () => { const ms = S.chat.messages; for (let i = ms.length - 1; i >= 0; i--) if (ms[i].k === "combo") return i; return -1; };
function comboLeft(m) {
  const picks = m.picks.map((p) => { const h = hydrate(p); return h ? { cat: p.cat, ...h } : null; }).filter(Boolean);
  const addsTotal = (m.adds || []).reduce((a, x) => { const h = hydrate(x); return a + (h ? h.item.min : 0); }, 0);
  const rp = E.reprice(m.budget - addsTotal, picks);
  // lo que de verdad queda libre: se calcula con los precios mínimos, porque el resto del sobrante se reparte entre las compras
  return Math.max(0, m.budget - rp.sumMin - addsTotal);
}
function followUp(text, ci) {
  const m = S.chat.messages[ci], pool = poolFor(m.plazaId), t = N(text), left = comboLeft(m);
  const more = /\b(agrega|agregar|agregale|agregame|anade|anadir|suma|sumar|incluye|incluir|ponle|tambien|ademas|mas cosas|que mas|algo mas|otra cosa|otro|otra|sobra|sobran|alcanza|queda)\b/.test(t);
  const cats = E.detectCats(text, window.GASTABOT_DATA.CATEGORIES), tags = E.matchedTags(text, pool);
  if (!more && !cats.length && !tags.length) return null;
  const T = (text, chips) => ({ who: "bot", k: "text", text, chips });
  if (left < 30) return T(`Ya usaste casi todo tu presupuesto de ${money(m.budget)}. Quita algo del combo o sube el monto (por ejemplo «ahora tengo ${money(m.budget + 500)}») y lo ajusto.`);
  const newCats = cats.filter((c) => !m.cats.includes(c));
  if (newCats.length) {
    const plan = E.planCombo(left, newCats, pool);
    if (!plan.picks.length) {
      const low = newCats.map((c) => { const mins = pool.flatMap((x) => E.itemsOf(x)).filter((it) => it.cat === c).map((it) => it.min); return mins.length ? { c, min: Math.min(...mins) } : null; }).filter(Boolean);
      const names = newCats.map((c) => (I.LABEL[c] || c).toLowerCase()).join(" y ");
      const why = low.length ? ` Lo más barato en ${names} cuesta desde ${money(Math.min(...low.map((x) => x.min)))}, así que te faltan ${money(Math.max(0, Math.min(...low.map((x) => x.min)) - left))}.` : "";
      return T(`Te sobran ${money(left)} y con eso no alcanza para ${names}.${why} Puedo rearmar todo junto desde cero con tu presupuesto de ${money(m.budget)}.`, [{ label: `Rearmar: ${[...m.cats, ...newCats].map((c) => (I.LABEL[c] || c).toLowerCase()).join(" + ")}`, act: "example", q: `Tengo ${money(m.budget)}: ${[...m.cats, ...newCats].join(", ")}` }, { label: "Subir el presupuesto", act: "edit-budget" }]);
    }
    const alts = { ...m.alts }; for (const [c, list] of Object.entries(plan.alts)) alts[c] = list.map(ref);
    return { ...m, intro: `Agregué ${plan.picks.map((p) => (I.LABEL[p.cat] || p.cat).toLowerCase()).join(" y ")} con lo que te sobraba.`, cats: [...m.cats, ...plan.picks.map((p) => p.cat)], picks: m.picks.concat(plan.picks.map((p) => ({ cat: p.cat, ...ref(p) }))), alts, open: null, bump: true };
  }
  if (tags.length || cats.length) {
    const cat = !tags.length ? cats[0] : undefined;
    return { who: "bot", k: "compare", tags, cat, plazaId: m.plazaId, budget: left, expanded: false, addTo: ci, intro: `Te sobran ${money(left)}. Estas opciones sí te caben; toca «+ Agregar» para sumarlas a tu combo.` };
  }
  return { who: "bot", k: "list", plazaId: m.plazaId, budget: left, expanded: false, intro: `Con lo que te sobra (${money(left)}) te alcanza en` };
}
let budT;
function setBudget(n, silent) {
  S.budget = n > 0 ? n : 0;
  $("#budgetIn").value = S.budget ? S.budget.toLocaleString("es-MX") : "";
  clearTimeout(budT);
  const keep = S.budget;
  budT = setTimeout(() => { S.settings.lastBudget = keep; Promise.resolve(DB.saveSettings({ ...S.settings, lastBudget: keep })).catch(() => {}); }, 400);
  if (!silent) renderHero();
  renderBudgetBar();
}
function renderBudgetBar() {
  const el = $("#budgetBar");
  el.hidden = !S.budget;
  el.innerHTML = S.budget ? `<button type="button" data-act="edit-budget" aria-label="Cambiar presupuesto"><span>Presupuesto</span><b>${money(S.budget)}</b>${I.svg("edit", 14)}</button>` : "";
}
// Con IA activada: Claude entiende el mensaje; el motor de reglas sigue calculando precios y combos.
async function aiStep(text) {
  if (!GastaLLM.enabled(S.settings)) return null;
  const ci = lastCombo(), m = ci >= 0 ? S.chat.messages[ci] : null;
  S.chat.messages.push({ who: "bot", k: "typing" }); renderThread();
  const ai = await GastaLLM.interpret(text, {
    budget: S.budget, plaza: S.plaza, hasCombo: !!m, cats: m ? m.cats : [], left: m ? comboLeft(m) : 0,
    name: (S.profile?.name || S.session?.user?.name || "").split(" ")[0]
  }, S.settings);
  S.chat.messages = S.chat.messages.filter((x) => x.k !== "typing");
  return ai;
}
// Inicio de sesión: se pide hasta después del primer mensaje, para que al abrir veas todo directo
async function ask(text, title) {
  await askCore(text, title);
  if (!S.session?.user && !S.settings.skipLogin && !S.loginAsked) { S.loginAsked = true; setTimeout(() => showWelcome(true), 1200); }
}
async function askCore(text, title) {
  const orig = text;
  S.chat.messages.push({ who: "u", text });
  if (!S.chat.title) S.chat.title = title || text.slice(0, 48);
  const ai = await aiStep(text);
  if (ai) {
    if (!ai.shop) {
      S.chat.messages.push({ who: "bot", k: "text", text: ai.reply || "Cuéntame cuánto traes y qué se te antoja." });
      S.fresh = S.chat.messages.length - 1; renderThread(); S.fresh = -1; persist(); return;
    }
    if (ai.reply) S.chat.messages.push({ who: "bot", k: "text", text: ai.reply });
    if (ai.budget) setBudget(ai.budget, true);
    text = GastaLLM.toQuery(ai, (c) => I.LABEL[c]) || text;
    if (ai.plaza && PLAZAS[ai.plaza]) text += ` en ${PLAZAS[ai.plaza].name}`;
  }
  const given = E.parseBudget(text);
  if (given && !ai) setBudget(given, true);
  const ci = !given && !storeAsked(text) ? lastCombo() : -1;
  const fu = ci >= 0 ? followUp(text, ci) : null;
  if (fu) {
    S.chat.messages.push(fu);
    S.fresh = S.chat.messages.length - 1;
    renderThread(); S.fresh = -1; countUp(); persist(); return;
  }
  const plazaId = E.detectPlaza(text, PLAZAS) ? "" : S.plaza;
  let q = plazaId ? `${text} en ${plazaName(plazaId)}` : text;
  const st = storeAsked(text);
  let r = E.recommend(q, window.GASTABOT_DATA, S.stores);
  if (st) r = { type: "chat", kind: "store", store: st };
  else if (r.type !== "chat") {
    if (!given && S.budget > 0) r = E.recommend(q + ` con $${S.budget}`, window.GASTABOT_DATA, S.stores);
    // «¿y con 1000?»: reutiliza lo que se pidió antes cuando ahora sólo cambia el monto
    if (r.type === "list" && given && S.chat.ctx) r = E.recommend(`${q} ${S.chat.ctx}`, window.GASTABOT_DATA, S.stores);
    if (r.type === "combo" && r.cats?.length) S.chat.ctx = r.cats.join(" ");
    else if (r.type === "compare" && r.tags?.length) S.chat.ctx = r.tags.join(" ");
  }
  S.chat.messages.push(toModel(r, orig));
  DB.logSearch(orig, r.budget);
  S.fresh = S.chat.messages.length - 1;
  renderThread(); S.fresh = -1; countUp(); persist();
}
let saveT;
function persist() { clearTimeout(saveT); saveT = setTimeout(() => DB.saveChat(S.chat).catch((e) => console.warn("No se guardó el chat:", e.message)), 250); }

// ---------- Hero ----------
function renderHero() {
  const first = (S.profile?.name || S.session?.user?.name || "").split(" ")[0];
  $("#greet").textContent = first ? `Hola, ${first}` : "Hola";
  $("#quick").innerHTML = [300, 500, 1000, 2000].map((n) => `<button class="chip" data-act="quick" data-n="${n}">${money(n)}</button>`).join("");
  const list = S.moreCats ? ALL_CATS : FIRST_CATS;
  $("#catChips").innerHTML = list.map((c) => `<button class="chip cat" style="--h:${M.CAT_HUE[c] ?? 150}" data-act="cat" data-cat="${c}" aria-pressed="${S.cats.has(c)}">${I.svg(c, 16)}${esc(I.LABEL[c])}</button>`).join("") + (S.moreCats ? "" : `<button class="chip more" data-act="morecats">Más</button>`);
  const ok = S.budget > 0 && S.cats.size > 0;
  $("#goBtn").disabled = !ok;
  $("#goBtn").textContent = ok ? `Armar combo de ${money(S.budget)}` : "Armar combo";
  $("#goHint").hidden = ok;
}
$("#budgetIn").addEventListener("input", (e) => {
  const d = e.target.value.replace(/\D/g, "").slice(0, 6);
  S.budget = d ? parseInt(d, 10) : 0; e.target.value = d ? S.budget.toLocaleString("es-MX") : ""; renderHero(); setBudget(S.budget, true);
});

// ---------- Navegación ----------
function syncPages() { $$(".page").forEach((p) => (p.hidden = true)); const t = S.stack.at(-1); if (t) $("#page-" + t).hidden = false; }
function renderStorePage(id, filter = "all", keep) {
  const s = S.stores.find((x) => x.id === id); if (!s) return;
  const prev = keep && keep.id === id ? keep : {};
  S.storeView = { id, filter, cat: prev.cat || "all", q: prev.q || "", n: 60 };
  const all = E.itemsOf(s);
  const kinds = new Set(all.map((i) => i.kind).filter(Boolean));
  const cats = [...new Set(all.map((i) => i.cat))];
  const chips = kinds.size > 1 ? `<div class="chips seg-chips">${[["all", "Todo"], ["combo", "Combos"], ["solo", "Solos"]].map(([k, l]) => `<button class="chip ${filter === k ? "on" : ""}" data-act="store-filter" data-f="${k}">${l}</button>`).join("")}</div>` : "";
  const catChips = cats.length > 1 && all.length > 12 ? `<div class="chips seg-chips" id="storeCats">${[["all", "Todas"]].concat(cats.map((c) => [c, I.LABEL[c] || c])).map(([k, l]) => `<button class="chip ${S.storeView.cat === k ? "on" : ""}" data-act="store-cat" data-c="${esc(k)}">${esc(l)}</button>`).join("")}</div>` : "";
  const search = all.length > 12 ? `<form id="storeSearch" class="stack" style="margin:10px 16px 0"><input id="storeQ" type="search" placeholder="Buscar en ${esc(s.name)}: tenis, perfume, pantalla…" aria-label="Buscar productos de ${esc(s.name)}" value="${esc(S.storeView.q)}" /></form>` : "";
  $("#storeBody").innerHTML = `<div class="store-hero" style="--brand:${esc(s.brand || "#167A5B")};--ink:${esc(s.brandInk || "#fff")}"><h3>${esc(s.name)} ${mark(s)}</h3><p>${esc(plazaName(s.plaza))}</p>${favBtn(s.id)}</div>${isFood(s) ? `<div class="chips" style="padding:8px 0">${s.generic ? "" : deliveryChips(s)}${s.local ? `<a class="chip" href="${esc(mapQ(s.mapq || s.name))}" target="_blank" rel="noopener noreferrer">${NEAR.pos ? "Buscar cerca de ti" : "Buscar en el mapa"}</a>` : ""}</div>` : ""}${chips}${search}${catChips}
    <div class="menu-grid" id="storeGrid"></div><div id="storeMore"></div>
    <p class="note">${esc(s.menuNote || "Precios estimados por rango; confirma en la tienda.")}</p>`;
  drawStoreGrid();
}
function drawStoreGrid() {
  const v = S.storeView, s = S.stores.find((x) => x.id === v.id), g = $("#storeGrid"); if (!s || !g) return;
  const q = N(v.q || "").trim().split(/\s+/).filter(Boolean);
  const items = E.itemsOf(s).filter((i) => (v.filter === "all" || (v.filter === "combo" ? i.kind === "combo" : i.kind === "solo")) && (v.cat === "all" || i.cat === v.cat)
    && q.every((w) => N(i.name + " " + (i.desc || "") + " " + (i.tags || []).join(" ")).includes(w))).slice().sort((a, b) => (s.catalogo ? (b.exact ? 1 : 0) - (a.exact ? 1 : 0) : 0) || a.min - b.min);
  const shown = items.slice(0, v.n);
  g.innerHTML = shown.length ? shown.map((i, k) => `<article class="dish" style="--k:${Math.min(k, 12)};--h:${M.CAT_HUE[i.cat] ?? 150}" ${dAttrs(s, i)}>${thumb(s, i, i.cat)}<div class="dish-t"><b>${esc(i.name)}</b>${descOf(i)}<span class="sm">${kindTag(i)}${i.exact ? "" : "Estimado"}</span></div><div class="dish-p">${i.exact ? money(i.min) : "~" + money(est(i))}</div></article>`).join("") : `<p class="muted" style="padding:12px 16px">No encontré productos con ese filtro.</p>`;
  $("#storeMore").innerHTML = items.length > shown.length ? `<div style="padding:8px 16px"><button class="btn ghost" data-act="store-more">Ver más (${items.length - shown.length} restantes de ${items.length})</button></div>` : items.length > 12 ? `<p class="muted" style="padding:4px 16px">${items.length} productos</p>` : "";
}
const est = (i) => Math.round(i.min + (i.max - i.min) * 0.35);
function renderMenus() {
  const list = S.stores.filter((s) => s.menu && (s.anyPlaza ? S.plaza === "locales" : !S.plaza || s.plaza === S.plaza));
  $("#menusBody").innerHTML = list.length ? list.map((s, k) => `<button class="store-card" style="--brand:${esc(s.brand || "#167A5B")};--ink:${esc(s.brandInk || "#fff")};--k:${k}" data-act="store" data-id="${esc(s.id)}"><b>${esc(s.name)}</b><span>${E.itemsOf(s).length} ${E.itemsOf(s).length === 1 ? "producto" : "productos"}</span></button>`).join("") : `<p class="empty">Aún no tengo menús para esta plaza.</p>`;
}
const RENDER = {
  menus: renderMenus, near: renderNear, localfood: renderLocalFood,
  history: renderHistory, prices: renderPrices, delivery: renderDelivery, notifs: renderNotifs, community: renderCommunity, offers: renderOffers, favs: renderFavs, add: renderAdd, account: renderAccount, settings: renderSettings, credits: renderCredits
};
async function openDrawer() {
  $("#drawer").hidden = false; $("#scrim").hidden = false;
  requestAnimationFrame(() => { $("#drawer").classList.add("open"); $("#scrim").classList.add("open"); });
  const list = await DB.listChats().catch(() => []);
  $("#drawerChats").innerHTML = list.length ? list.slice(0, 12).map((c) => `<button class="${c.id === S.chat.id ? "cur" : ""}" data-act="open-chat" data-id="${esc(c.id)}">${esc(c.title || "Chat sin título")}</button>`).join("") : `<p class="d-empty">Aún no hay chats.</p>`;
}
function closeDrawer() {
  $("#drawer").classList.remove("open"); $("#scrim").classList.remove("open");
  setTimeout(() => { if (!$("#drawer").classList.contains("open")) { $("#drawer").hidden = true; $("#scrim").hidden = true; } }, 220);
}
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#drawer").hidden) closeDrawer(); });
function openPage(n) { closeDrawer(); S.stack.push(n); syncPages(); RENDER[n]?.(); $("#page-" + n).scrollTop = 0; }
function closePage() { S.stack.pop(); syncPages(); }
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2200); }
const line = (el, msg, kind = "") => { el.textContent = msg; el.className = "msg-line " + kind; };

async function renderHistory() {
  const list = await DB.listChats().catch(() => []);
  $("#chatList").innerHTML = list.length ? list.map((c) => `<div class="chat-item ${c.id === S.chat.id ? "cur" : ""}"><button class="main" data-act="open-chat" data-id="${esc(c.id)}"><div class="name">${esc(c.title || "Chat sin título")}</div><div class="sm">${esc(new Date(c.updated).toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }))}</div></button><button class="icon" data-act="del-chat" data-id="${esc(c.id)}" aria-label="Borrar chat">${I.svg("trash", 18)}</button></div>`).join("") : `<p class="empty">Todavía no hay chats guardados. Arma un combo y aparecerá aquí.</p>`;
  $("#historyNote").textContent = S.cloud && S.session?.user?.id ? "Tus chats se sincronizan con tu cuenta." : "Tus chats se guardan en este navegador. Con una cuenta en la nube se sincronizan.";
}
function renderFavs() {
  const list = S.stores.filter((s) => S.favs.includes(s.id));
  $("#favList").innerHTML = list.length ? `<div class="flat">${list.map((s) => `<div class="row"><div class="main" style="cursor:default">${thumb(s, null, s.cats[0])}<span class="txt"><span class="name">${esc(s.name)} ${mark(s)}</span><span class="sm">${esc(plazaName(s.plaza))}</span></span></div>${favBtn(s.id)}</div>`).join("")}</div>` : `<p class="empty">Aún no guardas tiendas. Toca la estrella en cualquier resultado.</p>`;
}
async function renderComOffers() {
  const posts = (await DB.listPosts().catch(() => [])).filter((p) => p.kind === "oferta");
  $("#offerCom").innerHTML = posts.length ? posts.slice(0, 15).map((p) => `<div class="offer"><b>${esc(p.store || p.title)}</b>${esc(p.title)}<div class="sm muted">Vigente hasta ${esc(p.valid_until ? fmtD(p.valid_until) : "—")} · ${p.still_ok || 0} confirman · por ${esc(p.author || "Anónimo")}</div></div>`).join("") + `<button class="more-btn" data-act="page" data-page="community">Ver y confirmar en Comunidad</button>` : `<p class="empty">Aún no hay ofertas de la comunidad. Comparte la primera en Comunidad.</p>`;
}
function renderOffers() {
  renderComOffers();
  $("#offerList").innerHTML = S.offers.length ? S.offers.map((o) => `<div class="offer"><b>${esc(o.store_name || o.store_id)}</b>${esc(o.text)}<div class="sm muted">Vigente hasta ${esc(o.valid_until)}</div></div>`).join("") : `<p class="empty">No hay ofertas vigentes.${S.admin ? " Publica la primera abajo." : ""}</p>`;
  $("#offerForm").hidden = !S.admin;
  $("#offerStore").innerHTML = S.stores.slice().sort((a, b) => a.name.localeCompare(b.name)).map((s) => `<option value="${esc(s.id)}">${esc(s.name)}, ${esc(plazaName(s.plaza))}</option>`).join("");
}
function renderAdd() {
  $("#prodStore").innerHTML = S.stores.slice().sort((a, b) => a.name.localeCompare(b.name)).map((s) => `<option value="${esc(s.id)}">${esc(s.name)}, ${esc(plazaName(s.plaza))}</option>`).join("");
  $("#prodCat").innerHTML = ALL_CATS.map((c) => `<option value="${c}">${esc(I.LABEL[c])}</option>`).join("");
  $("#storePlaza").innerHTML = Object.entries(PLAZAS).map(([id, p]) => `<option value="${id}">${esc(p.name)}</option>`).join("");
}
async function renderAccount() {
  const u = S.session?.user, box = $("#accountBox");
  if (!u) { box.innerHTML = `<p class="muted">No has iniciado sesión.</p><button class="primary slim" data-act="show-welcome">Entrar o crear cuenta</button>`; }
  else {
    const p = S.profile || {};
    box.innerHTML = `<p><b>${esc(p.name || u.name || u.email)}</b><br><span class="muted">${esc(u.email || "")}${u.local ? ". Perfil guardado solo en este navegador." : ""}${S.admin ? " Administrador." : ""}</span></p>
      <form id="profForm" class="stack"><label>Plaza favorita<select name="plaza"><option value="">Ninguna</option>${Object.entries(PLAZAS).map(([id, x]) => `<option value="${id}" ${p.plaza === id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label>
      <label>Presupuesto habitual (MXN)<input name="budget" type="number" min="0" value="${esc(p.budget || "")}"></label>
      ${u.local ? `<p class="muted">Para recibir recomendaciones por correo de tus tiendas favoritas necesitas una cuenta en la nube (Supabase).</p>` : `<label class="chk"><input type="checkbox" name="email_digest" ${p.email_digest ? "checked" : ""}> Mandarme por correo recomendaciones de mis tiendas favoritas (${S.favs.length} ⭐)</label>
      <label>Frecuencia<select name="digest_freq"><option value="weekly" ${p.digest_freq !== "monthly" ? "selected" : ""}>Cada semana</option><option value="monthly" ${p.digest_freq === "monthly" ? "selected" : ""}>Cada mes</option></select></label>
      <p class="muted">Llegan a ${esc(u.email || "tu correo")}. Incluyen ofertas vigentes y opciones parecidas de otras marcas (marcadas como tal). ${S.favs.length ? "" : "Marca tiendas con ⭐ para recibirlas."}</p>`}
      <button class="primary" type="submit">Guardar perfil</button></form>
      <button class="text" data-act="logout">Cerrar sesión</button><p id="profMsg" class="msg-line" role="status"></p>`;
  }
  $("#metrics").textContent = JSON.stringify(await DB.getMetrics(), null, 2);
}
function renderCredits() {
  const l = GastaPhotos.credits();
  $("#creditList").innerHTML = l.length ? l.map((c) => `<li><b>${esc(c.q)}</b><br><span class="sm">${esc(c.t)}${c.a ? " · " + esc(c.a) : ""}${c.l ? " · " + esc(c.l) : ""}</span>${c.link ? `<br><a href="${esc(c.link)}" target="_blank" rel="noopener noreferrer">Ver origen</a>` : ""}</li>`).join("") : `<p class="muted">Todavía no se han cargado fotos. Haz una búsqueda con conexión a internet y vuelve aquí.</p>`;
}
function renderSettings() { for (const k of ["supabaseUrl", "supabaseKey", "placesKey", "pexelsKey"]) $("#setForm").elements[k].value = S.settings[k] || ""; $("#setForm").elements.llm.checked = !!S.settings.llm; }

// ---------- Ficha de producto: fotos, calidad, opciones parecidas y mini catálogo ----------
const CC = window.GastaCatalog;
const sheetPool = (plaza) => { const p = poolFor(plaza); return p.length ? p : S.stores; };
const comboOf = (ctx) => { const i = ctx.kind === "combo" ? ctx.i : ctx.kind === "add" ? ctx.ci : null; return i != null ? { i, m: S.chat.messages[i] } : null; };
const deltaTxt = (d) => (Math.abs(d) < 5 ? '<span class="delta same">Mismo precio</span>' : d < 0 ? `<span class="delta less">${money(-d)} menos</span>` : `<span class="delta more">${money(d)} más</span>`);
const lvlTag = (q, cls = "") => `<span class="qtag lvl${q.level} ${cls}">${esc(q.label)}</span>`;
const creditHtml = (p) => (p && !p.own && p.a !== undefined ? `Foto: ${esc(p.a || "autor desconocido")}${p.l ? " · " + esc(p.l) : ""}${safeUrl(p.link) ? ` · <a href="${esc(p.link)}" target="_blank" rel="noopener noreferrer">origen</a>` : ""}` : "");

function openSheet(sid, iname, ctx) {
  const h = hydrate({ sid, iname }); if (!h) return;
  const c = ctx || { kind: "view" }, cm = comboOf(c);
  S.sheet = { sid, iname, ctx: c, plaza: cm?.m?.plazaId || h.store.plaza, filter: "all", n: 6, hist: [], cmp: null, imgs: null, gi: 0, token: 0 };
  $("#sheet").style.transform = ""; $("#sheet").hidden = false; $("#sheetScrim").hidden = false;
  renderSheet();
  requestAnimationFrame(() => { $("#sheet").classList.add("open"); $("#sheetScrim").classList.add("open"); });
  $("#sheet").focus({ preventScroll: true });
}
function closeSheet() {
  if (!S.sheet) return;
  S.sheet = null; $("#sheet").style.transform = "";
  $("#sheet").classList.remove("open"); $("#sheetScrim").classList.remove("open");
  setTimeout(() => { if (!S.sheet) { $("#sheet").hidden = true; $("#sheetScrim").hidden = true; $("#sheet").innerHTML = ""; } }, 240);
}
// Calcula todo lo que la ficha necesita del producto que se está viendo
function sheetState() {
  const sh = S.sheet, h = hydrate(sh); if (!h) return null;
  const pool = sheetPool(sh.plaza), cx = CC.makeCtx(pool), lab = I.LABEL[h.item.cat];
  const q = CC.qualityInfo(h.store, h.item, cx, lab);
  let sims = CC.similar(h.store, h.item, cx, 6), sx = cx;
  if (sims.length < 4 && pool.length !== S.stores.length) { sx = CC.makeCtx(S.stores); sims = CC.similar(h.store, h.item, sx, 6); }
  sims = sims.map((r) => ({ ...r, q: CC.qualityInfo(r.store, r.item, sx, lab) }));
  sh.cur = { ...h, q, cx, sims, lab };
  if (!sh.cmp || !sims.some((r) => CC.keyOf(r.store, r.item) === sh.cmp)) sh.cmp = sims[0] ? CC.keyOf(sims[0].store, sims[0].item) : null;
  return sh.cur;
}
function renderSheet() {
  const sh = S.sheet; if (!sh) return;
  const c = sheetState(); if (!c) return closeSheet();
  $("#sheet").innerHTML = `<div class="sh-top"><span class="grab" aria-hidden="true"></span>
      <button class="icon sh-back" data-act="sheet-back" aria-label="Volver a la ficha anterior" ${sh.hist.length ? "" : "hidden"}>${I.svg("back", 20)}</button>
      <span class="sh-cat">${esc(c.lab || "")}</span>
      <button class="icon sh-x" data-act="sheet-close" aria-label="Cerrar">${I.svg("close", 20)}</button></div>
    <div class="sh-body" id="shBody">
      <div id="shGal">${galHtml(sh)}</div><div id="shHead">${headHtml(sh)}</div><div id="shVar">${varHtml(sh)}</div><div id="shQual">${qualHtml(sh)}</div>
      <div id="shInfo">${infoHtml(sh)}</div><div id="shSim">${simHtml(sh)}</div><div id="shCmp">${cmpHtml(sh)}</div><div id="shCat">${catHtml(sh)}</div>
    </div>
    <div class="sh-bar" id="shBar">${barHtml(sh)}</div>`;
  $("#shBody").scrollTop = 0; bindGal(); countUp($("#shBar")); loadGallery();
}
function loadGallery() {
  const sh = S.sheet, c = sh.cur, tok = ++sh.token;
  sh.imgs = null;
  GastaPhotos.gallery(GV.profile(c.store, c.item), 4, c.store.id + "|" + c.item.name).then((list) => {
    if (!S.sheet || S.sheet.token !== tok) return; // ya cambió de producto
    S.sheet.imgs = list; $("#shGal").innerHTML = galHtml(S.sheet); bindGal();
  });
}
function galHtml(sh) {
  const { store, item } = sh.cur, hue = M.CAT_HUE[item.cat] ?? 150, prof = GV.profile(store, item), key = prof.art;
  const own = safeImg(item.img) ? [{ u: item.img, own: true }] : [];
  const list = own.concat(sh.imgs || []).slice(0, 4), n = Math.max(1, list.length);
  sh.list = list; sh.gi = Math.min(sh.gi, n - 1);
  const art = (s) => `<span class="art" aria-hidden="true">${GastaArt.svg(key, s)}</span>`;
  const slides = Array.from({ length: n }, (_, k) => { const p = list[k]; return `<div class="g-slide thumb tile" style="--h:${hue}" role="group" aria-label="Imagen ${k + 1} de ${n}">${art(110)}${p ? `<img src="${esc(p.u)}" alt="${esc(p.t || item.name)}" referrerpolicy="no-referrer">` : ""}</div>`; }).join("");
  const ths = n > 1 ? `<div class="g-ths">${list.map((p, k) => `<button class="g-th ${k === sh.gi ? "on" : ""}" data-act="g-go" data-n="${k}" aria-label="Ver imagen ${k + 1}"><span class="thumb tile" style="--h:${hue}">${art(40)}<img src="${esc(p.u)}" alt="" referrerpolicy="no-referrer"></span></button>`).join("")}</div>` : "";
  return `<div class="gal"><span class="g-type">${esc(prof.label)}</span><div class="g-track" id="galTrack" tabindex="0" aria-label="Galería de imágenes">${slides}</div>
    ${n > 1 ? `<span class="g-count" id="gCount" aria-live="polite">${sh.gi + 1}/${n}</span><span class="g-dots" aria-hidden="true">${list.map((_, k) => `<i class="${k === sh.gi ? "on" : ""}"></i>`).join("")}</span>` : ""}
    <span class="g-fav">${favBtn(store.id)}</span></div>${ths}
    <p class="g-note"><span id="gCredit">${creditHtml(list[sh.gi])}</span><span class="g-hint" id="gNote">${esc(galNote(sh, list, own.length, prof))}</span></p>`;
}
// Aviso honesto sobre qué muestra la foto actual: del tipo de producto, no del modelo exacto
function galNote(sh, list, ownN, prof) {
  const { store } = sh.cur, bn = GV.brandName(store), cur = list[sh.gi];
  if (cur && cur.own) return "Foto del producto en la página de la tienda.";
  if (sh.imgs === null) return "Buscando fotos de este tipo de producto…";
  if (!GastaPhotos.enabled()) return "Sin fotos: agrega tu clave gratuita de Pexels en Ajustes (o captura el producto con su imagen). Por ahora se muestra una ilustración.";
  if (!list.length) return `No encontré una foto que coincida con «${prof.label}» (o no hay conexión). Se muestra una ilustración.`;
  if (cur && cur.own) return "";
  return cur && cur.brand ? `Foto de ${bn}; puede no ser el modelo exacto.` : `Foto de referencia de «${prof.label}»; no es el modelo exacto de ${bn}.`;
}
function bindGal() {
  const t = $("#galTrack"); if (!t) return;
  t.scrollLeft = (S.sheet.gi || 0) * t.clientWidth;
  t.addEventListener("scroll", () => setGi(Math.round(t.scrollLeft / Math.max(1, t.clientWidth))), { passive: true });
}
function setGi(gi) {
  const sh = S.sheet; if (!sh || gi === sh.gi) return; sh.gi = gi;
  $$("#shGal .g-dots i").forEach((d, k) => d.classList.toggle("on", k === gi));
  $$("#shGal .g-th").forEach((d, k) => d.classList.toggle("on", k === gi));
  const c = $("#gCount"); if (c) c.textContent = `${gi + 1}/${$$("#shGal .g-slide").length}`;
  const cr = $("#gCredit"); if (cr) cr.innerHTML = creditHtml(sh.list?.[gi]);
  const nt = $("#gNote"); if (nt) nt.textContent = galNote(sh, sh.list || [], 0, GV.profile(sh.cur.store, sh.cur.item));
}
function headHtml(sh) {
  const { store, item } = sh.cur, est = E.est(item);
  return `<div class="sh-head"><div class="sh-t"><h3 id="shName">${esc(item.name)}</h3>
      <p class="sh-store">${store.menu ? `<button class="lnk" data-act="store" data-id="${esc(store.id)}">${esc(store.name)}</button>` : esc(store.name)} ${mark(store)} <span class="dotsep">·</span> ${esc(plazaName(store.plaza))}</p>
      <p class="sh-tags">${kindTag(item)}${promoTag(store)}${item.exact ? "" : '<span class="tag est">Estimado</span>'}</p></div>
    <div class="sh-price"><b>${priceTxt(est, item)}</b>${item.exact ? "" : `<small>rango ${money(item.min)} a ${money(item.max)}</small>`}</div></div>`;
}
// Variedad dentro de la misma tienda: cada tipo cambia fotos, descripción y precio de la ficha
function varHtml(sh) {
  const { store, item } = sh.cur, vs = CC.variants(store, item); if (vs.length < 2) return "";
  return `<section class="sh-sec"><div class="sec-h"><h4>${item.grp ? "Variedad en" : "Más de"} ${esc(GV.brandName(store))}${item.grp ? "" : " · " + esc((I.LABEL[item.cat] || item.cat).toLowerCase())}</h4><span class="muted">${vs.length} ${item.grp ? "tipos" : "productos"}</span></div>
    <p class="var-hint">Toca uno para ver sus fotos, descripción y precio.</p>
    <div class="vars" role="radiogroup" aria-label="Tipos de producto de ${esc(GV.brandName(store))}">${vs.map((v) => `<button class="var ${v.cur ? "on" : ""}" role="radio" aria-checked="${v.cur}" data-act="sheet-var" data-iname="${esc(v.item.name)}" style="--h:${M.CAT_HUE[v.item.cat] ?? 150}">
      <span class="mwrap">${thumb(store, v.item, v.item.cat, "fill")}</span><span class="vn">${esc(v.item.name)}</span><span class="vp">${priceTxt(v.est, v.item)}</span></button>`).join("")}</div></section>`;
}
function sheetVar(iname) {
  const sh = S.sheet; if (!sh || !hydrate({ sid: sh.sid, iname }) || iname === sh.iname) return;
  sh.iname = iname; sh.cmp = null; sh.imgs = null; sh.gi = 0; sh.filter = "all"; sh.n = 6;
  renderSheet();
}
function qualHtml(sh) {
  const { q } = sh.cur, ic = { ok: "check", info: "info", warn: "alert" };
  return `<section class="sh-card"><div class="q-head"><h4>Nivel de calidad</h4>${lvlTag(q)}</div>
    <div class="meter" role="img" aria-label="Nivel de calidad: ${esc(q.label)}">${CC.LEVELS.map((l, k) => `<span class="mseg ${k <= q.level ? "on" : ""} ${k === q.level ? "cur" : ""}"><i></i><em>${l}</em></span>`).join("")}</div>
    <p class="q-hint">${esc(q.hint)}</p>
    <ul class="why" aria-label="Por qué">${q.reasons.map((r) => `<li class="r-${r.k}"><span class="wi">${I.svg(ic[r.k], 15, 2)}</span>${esc(r.t)}</li>`).join("")}</ul>
    <p class="note">Calculado con el precio y los datos de la tienda; no es una prueba de materiales. Confirma en la tienda.</p></section>`;
}
function infoHtml(sh) {
  const { store, item, q } = sh.cur, skip = new Set(["combo", "solo", "promo", "doble", "mini"]);
  const chips = (q.specs.length ? q.specs : [...new Set((item.tags || []).filter((t) => !skip.has(String(t).toLowerCase())))].slice(0, 6)).map((t) => `<span class="spec">${esc(String(t).charAt(0).toUpperCase() + String(t).slice(1))}</span>`).join("");
  const prof = GV.profile(store, item), typeChip = `<span class="spec type">${esc(prof.label)}</span>`, desc = item.desc || (prof.type !== "otros" ? prof.desc : "");
  const links = [store.menu ? `<button class="chip" data-act="store" data-id="${esc(store.id)}">Menú de ${esc(store.name)}</button>` : "", safeUrl(store.site) ? `<a class="chip" href="${esc(store.site)}" target="_blank" rel="noopener noreferrer">Sitio de la tienda ${I.svg("external", 13)}</a>` : "", safeUrl(item.url) ? `<a class="chip" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">Ver producto ${I.svg("external", 13)}</a>` : "", deliveryChips(store)].join("");
  return `<section class="sh-sec"><h4>Qué incluye</h4>${desc ? `<p class="sh-desc">${esc(desc)}</p>` : `<p class="sh-desc muted">Aún no hay descripción de este producto. Confirma modelo, talla y materiales en la tienda.</p>`}
    ${item.type ? `<p class="note">Tipo tomado de las categorías públicas del catálogo de ${esc(GV.brandName(store))}. Modelo, talla y precio exactos: confirma en la tienda.</p>` : ""}
    <div class="specs">${typeChip}${chips}</div>${store.promo ? `<p class="sh-promo">${I.svg("tag", 15)} ${esc(store.promo)}</p>` : ""}${links ? `<div class="chips">${links}</div>` : ""}</section>`;
}
const brandTag = (cur, s) => (GV.sameBrand(cur, s) ? `<span class="btag same">Misma marca · ${esc(plazaName(s.plaza))}</span>` : '<span class="btag other">Otra marca</span>');
function simHtml(sh) {
  const { sims } = sh.cur; if (!sims.length) return "";
  const bn = GV.brandName(sh.cur.store), others = sims.filter((r) => !GV.sameBrand(r.store, sh.cur.store)).length;
  const msg = others === sims.length ? `Estas opciones <b>no son de ${esc(bn)}</b>: son productos parecidos de otras marcas que quizá te gusten.` : `Las marcadas «Otra marca» <b>no son de ${esc(bn)}</b>: son productos parecidos que quizá te gusten.`;
  return `<section class="sh-sec"><div class="sec-h"><h4>Opciones parecidas</h4><span class="muted">De otras marcas</span></div>
    <p class="brand-note">${I.svg("info", 15)}<span>${msg}</span></p>
    <div class="sim" role="list">${sims.map((r, k) => `<button class="sim-card" role="listitem" data-act="sim-pick" data-key="${esc(CC.keyOf(r.store, r.item))}" aria-pressed="${CC.keyOf(r.store, r.item) === sh.cmp}" style="--h:${M.CAT_HUE[r.item.cat] ?? 150}">
      <span class="mwrap">${thumb(r.store, r.item, r.item.cat, "fill")}${lvlTag(r.q, "corner")}<span class="sim-check" aria-hidden="true">${I.svg("check", 14, 2.6)}</span></span>
      <span class="name">${esc(r.item.name)}</span><span class="sm">${esc(r.store.name)}</span>${brandTag(sh.cur.store, r.store)}
      <span class="sim-p"><b>${priceTxt(r.est, r.item)}</b>${deltaTxt(r.delta)}</span></button>`).join("")}</div></section>`;
}
function cmpHtml(sh) {
  const c = sh.cur, r = c.sims.find((x) => CC.keyOf(x.store, x.item) === sh.cmp); if (!r) return "";
  const a = { store: c.store, item: c.item, est: E.est(c.item), q: c.q }, d = r.est - a.est;
  const row = (l, x, y, cls = "") => `<tr class="${cls}"><th scope="row">${l}</th><td>${x}</td><td>${y}</td></tr>`;
  const kind = (i) => (i.kind === "combo" ? "Combo" : i.kind === "solo" ? "Solo" : esc(I.LABEL[i.cat] || i.cat));
  const w = comboWith(sh, r.store, r.item), canPick = sh.ctx.kind === "combo" || sh.ctx.kind === "add";
  const effect = w ? `<p class="cmp-fx ${w.over ? "over" : ""}">Tu combo quedaría en <b>${money(w.spent)}</b> de ${money(w.budget)}${w.over ? ` (te pasas ${money(w.spent - w.budget)})` : `; te sobran ${money(w.budget - w.spent)}`}.</p>` : "";
  return `<section class="sh-sec"><h4>Comparación rápida</h4><table class="cmp"><thead><tr><th></th><th scope="col">Este</th><th scope="col">${esc(r.item.name)}</th></tr></thead><tbody>
    ${row("Precio", `<b>${priceTxt(a.est, a.item)}</b>`, `<b>${priceTxt(r.est, r.item)}</b> ${deltaTxt(d)}`, "price")}
    ${row("Calidad", lvlTag(a.q), lvlTag(r.q))}${row("Tienda", esc(a.store.name), esc(r.store.name))}${row("Tipo", kind(a.item), kind(r.item))}</tbody></table>
    ${GV.sameBrand(c.store, r.store) ? "" : `<p class="brand-note">${I.svg("info", 15)}<span>«${esc(r.item.name)}» es de <b>${esc(GV.brandName(r.store))}</b>, no de ${esc(GV.brandName(c.store))}: es una opción parecida.</span></p>`}
    ${effect}<div class="cmp-act"><button class="ghost" data-act="sheet-go" data-sid="${esc(r.store.id)}" data-iname="${esc(r.item.name)}">Ver su ficha</button>${canPick ? `<button class="ghost on" data-act="sheet-choose-cmp" data-sid="${esc(r.store.id)}" data-iname="${esc(r.item.name)}" ${w && w.same ? "disabled" : ""}>${sh.ctx.kind === "add" ? "Agregar esta" : "Elegir esta"}</button>` : ""}</div></section>`;
}
function catHtml(sh) {
  const c = sh.cur, F = [["all", "Todo"], ["cheap", "Más barato"], ["quality", "Mejor calidad"], ["store", "Misma tienda"], ["other", "Otras marcas"]];
  const rows = CC.catalog(c.item.cat, c.cx, { filter: sh.filter, storeId: c.store.id, skip: CC.keyOf(c.store, c.item) });
  const show = rows.slice(0, sh.n), cm = comboOf(sh.ctx), left = cm?.m ? comboLeft(cm.m) : 0;
  return `<section class="sh-sec"><div class="sec-h"><h4>Más de ${esc(c.lab || "esta categoría")}</h4><span class="muted">${rows.length} ${rows.length === 1 ? "opción" : "opciones"}</span></div>
    <div class="chips seg-chips" role="group" aria-label="Filtrar">${F.map(([k, l]) => `<button class="chip ${sh.filter === k ? "on" : ""}" data-act="cat-filter" data-f="${k}" aria-pressed="${sh.filter === k}">${l}</button>`).join("")}</div>
    ${sh.filter !== "store" && show.some((r) => !GV.sameBrand(r.store, c.store)) ? `<p class="brand-note">${I.svg("info", 15)}<span>Los productos con «Otra marca» no son de ${esc(GV.brandName(c.store))}; son parecidos de otras tiendas.</span></p>` : ""}
    ${show.length ? `<div class="cat-grid">${show.map((r) => `<article class="cat-card" ${dAttrs(r.store, r.item, "view").replace('data-act="detail"', 'data-act="sheet-go"')} style="--h:${M.CAT_HUE[r.item.cat] ?? 150}">
      <span class="mwrap">${thumb(r.store, r.item, r.item.cat, "fill")}${lvlTag(r.q, "corner")}${cm && r.item.min <= left ? `<button class="plus" data-act="sheet-plus" data-sid="${esc(r.store.id)}" data-iname="${esc(r.item.name)}" aria-label="Agregar ${esc(r.item.name)} al combo">${I.svg("plus", 16, 2.2)}</button>` : ""}</span>
      <span class="name">${esc(r.item.name)}</span><span class="sm">${esc(r.store.name)}</span>${brandTag(c.store, r.store)}
      <span class="cat-p"><b>${priceTxt(r.est, r.item)}</b></span></article>`).join("")}</div>` : `<p class="empty">No hay más opciones con este filtro.</p>`}
    ${rows.length > sh.n ? `<button class="more-btn" data-act="cat-more">Ver más</button>` : ""}</section>`;
}
// Cómo quedaría el combo si en la categoría de la ficha se eligiera (store, item)
function comboWith(sh, store, item) {
  const ctx = sh.ctx, m = comboOf(ctx)?.m; if (ctx.kind !== "combo" || !m) return null;
  const picks = m.picks.map((p) => { const h = hydrate(p); return h ? { cat: p.cat, ...h } : null; }).filter(Boolean);
  const cur = picks.find((p) => p.cat === ctx.cat), same = !!cur && cur.store.id === store.id && cur.item.name === item.name;
  const addsTotal = (m.adds || []).reduce((a, x) => { const h = hydrate(x); return a + (h ? h.item.min : 0); }, 0);
  const calc = (list) => { const r = E.reprice(m.budget - addsTotal, list); return { r, spent: r.total + addsTotal, over: r.over || r.total + addsTotal > m.budget }; };
  const now = calc(picks), nu = calc(picks.map((p) => (p.cat === ctx.cat ? { cat: p.cat, store, item } : p)));
  return { m, same, addsTotal, budget: m.budget, spent: nu.spent, over: nu.over, picks: nu.r.picks, delta: nu.spent - now.spent };
}
function barHtml(sh) {
  const { store, item } = sh.cur, ctx = sh.ctx, cm = comboOf(ctx), m = cm?.m, w = comboWith(sh, store, item);
  if (w) {
    const base = Math.max(w.budget, w.spent);
    const seg = w.picks.map((p, k) => `<i style="flex-basis:${(p.est / base) * 100}%;background:${SEG[k % SEG.length]}"></i>`).join("") + (w.addsTotal ? `<i style="flex-basis:${(w.addsTotal / base) * 100}%;background:var(--s4)"></i>` : "") + (w.spent < w.budget ? '<i class="left"></i>' : "");
    const dl = !w.same && Math.abs(w.delta) >= 1 ? `<span class="b-delta ${w.delta < 0 ? "less" : "more"}">${w.delta < 0 ? "−" : "+"}${money(Math.abs(w.delta))}</span>` : "";
    return `<div class="b-left"><span class="b-t">Tu combo ${dl}</span><span class="b-n ${w.over ? "over" : ""}"><b class="num" data-to="${Math.round(w.spent)}">${money(w.spent)}</b> de ${money(w.budget)}</span>${w.over ? `<span class="b-over">Te pasas por ${money(w.spent - w.budget)}</span>` : ""}<div class="bar ${w.over ? "over" : ""}" role="img" aria-label="Gastarías ${money(w.spent)} de ${money(w.budget)}">${seg}</div></div>
      <button class="primary" data-act="sheet-choose" ${w.same ? "disabled" : ""}>${w.same ? "Es tu elección actual" : w.over ? "Elegir (te pasas)" : "Elegir esta opción"}</button>`;
  }
  if (ctx.kind === "add" && m) {
    const left = comboLeft(m), ok = item.min <= left;
    return `<div class="b-left"><span class="b-t">Te sobran</span><span class="b-n"><b>${money(left)}</b></span></div>
      <button class="primary" data-act="sheet-choose" ${ok ? "" : "disabled"}>${ok ? "+ Agregar al combo" : `Te faltan ${money(item.min - left)}`}</button>`;
  }
  return `<div class="b-left"><span class="b-t">${item.exact ? "Precio" : "Precio estimado"}</span><span class="b-n"><b>${priceTxt(E.est(item), item)}</b></span></div>
    ${store.menu ? `<button class="primary" data-act="store" data-id="${esc(store.id)}">Ver menú de ${esc(store.name)}</button>` : `<button class="primary" data-act="sheet-close">Cerrar</button>`}`;
}
// Aplica la elección de la ficha según desde dónde se abrió
function sheetChoose(sid, iname) {
  const sh = S.sheet, ctx = sh.ctx, msgs = S.chat.messages;
  const { store, item } = sid ? hydrate({ sid, iname }) || sh.cur : sh.cur;
  if (ctx.kind === "combo") {
    const m = msgs[ctx.i]; if (!m) return;
    const r = { sid: store.id, iname: item.name };
    m.picks = m.picks.map((p) => (p.cat === ctx.cat ? { cat: ctx.cat, ...r } : p));
    const list = (m.alts?.[ctx.cat] || []).filter((a) => !(a.sid === r.sid && a.iname === r.iname));
    m.alts = { ...(m.alts || {}), [ctx.cat]: [r, ...list].slice(0, 5) };
    m.bump = true; m.open = null; renderOne(ctx.i); delete m.bump; countUp($(`[data-msg="${ctx.i}"]`)); persist(); closeSheet(); toast("Cambiado en tu combo");
  } else if (ctx.kind === "add") addToCombo(ctx.ci, store.id, item.name);
}
function addToCombo(ci, sid, iname) {
  const msgs = S.chat.messages, m = msgs[ci]; if (!m) return;
  msgs.push({ ...m, adds: [...(m.adds || []), { sid, iname }], intro: `Agregué «${iname}».`, open: null, bump: true });
  S.fresh = msgs.length - 1; renderThread(); S.fresh = -1; countUp(); persist(); closeSheet(); toast("Agregado a tu combo");
}
function sheetGo(sid, iname) {
  const sh = S.sheet; if (!hydrate({ sid, iname })) return;
  sh.hist.push({ sid: sh.sid, iname: sh.iname }); sh.sid = sid; sh.iname = iname; sh.cmp = null; sh.imgs = null; sh.gi = 0; sh.filter = "all"; sh.n = 6;
  renderSheet();
}
(function sheetDrag() {
  const el = $("#sheet"); let y0 = null, dy = 0;
  el.addEventListener("pointerdown", (e) => { if (!e.target.closest(".sh-top") || e.target.closest("button")) return; y0 = e.clientY; dy = 0; el.style.transition = "none"; el.setPointerCapture?.(e.pointerId); });
  el.addEventListener("pointermove", (e) => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); el.style.transform = `translateY(${dy}px)`; });
  const end = () => { if (y0 == null) return; y0 = null; el.style.transition = ""; if (dy > 120) closeSheet(); else el.style.transform = ""; };
  el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
})();
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && S.sheet) return closeSheet();
  const t = e.target;
  if ((e.key === "Enter" || e.key === " ") && t.matches?.('[role="button"][data-act]')) { e.preventDefault(); t.click(); }
});

// ---------- Acciones (un solo manejador de clics) ----------
document.addEventListener("click", async (e) => {
  const el = e.target.closest("[data-act]"); if (!el) return;
  const d = el.dataset, act = d.act, msgs = S.chat.messages;
  if (act === "page") return openPage(d.page);
  if (act === "store") { closeDrawer(); S.stack.push("store"); syncPages(); renderStorePage(d.id); $("#page-store").scrollTop = 0; return; }
  if (act === "store-filter") return renderStorePage(S.storeView.id, d.f, S.storeView);
  if (act === "store-cat") { S.storeView.cat = d.c; S.storeView.n = 60; $$("#storeCats .chip").forEach((b) => b.classList.toggle("on", b.dataset.c === d.c)); return drawStoreGrid(); }
  if (act === "store-more") { S.storeView.n += 60; return drawStoreGrid(); }
  if (act === "close") return closePage();
  if (act === "add-item") { if (!msgs[+d.ci]) return; return addToCombo(+d.ci, d.sid, d.iname); }
  if (act === "detail") return openSheet(d.sid, d.iname, d.kind === "combo" ? { kind: "combo", i: +d.i, cat: d.cat } : d.kind === "add" ? { kind: "add", ci: +d.ci } : { kind: "view" });
  if (act === "sheet-close") return closeSheet();
  if (act === "sheet-back") { const sh = S.sheet, p = sh?.hist.pop(); if (!p) return; sh.sid = p.sid; sh.iname = p.iname; sh.cmp = null; sh.imgs = null; sh.gi = 0; sh.filter = "all"; sh.n = 6; return renderSheet(); }
  if (act === "sheet-go") return sheetGo(d.sid, d.iname);
  if (act === "sheet-var") return sheetVar(d.iname);
  if (act === "sheet-choose") return sheetChoose();
  if (act === "sheet-choose-cmp") return sheetChoose(d.sid, d.iname);
  if (act === "sheet-plus") {
    const cm = comboOf(S.sheet.ctx), h = hydrate({ sid: d.sid, iname: d.iname }); if (!cm?.m || !h) return;
    const left = comboLeft(cm.m); if (h.item.min > left) return toast(`Te sobran ${money(left)}; no alcanza`);
    return addToCombo(cm.i, d.sid, d.iname);
  }
  if (act === "g-go") { const t = $("#galTrack"); t?.scrollTo({ left: +d.n * t.clientWidth, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); return; }
  if (act === "sim-pick") { S.sheet.cmp = d.key; $$("#shSim .sim-card").forEach((b) => b.setAttribute("aria-pressed", b.dataset.key === d.key)); $("#shCmp").innerHTML = cmpHtml(S.sheet); return; }
  if (act === "cat-filter") { S.sheet.filter = d.f; S.sheet.n = 6; $("#shCat").innerHTML = catHtml(S.sheet); return; }
  if (act === "cat-more") { S.sheet.n += 6; $("#shCat").innerHTML = catHtml(S.sheet); return; }
  if (act === "rm-add") { const m = msgs[+d.i]; m.adds = (m.adds || []).filter((_, n) => n !== +d.n); m.bump = true; renderOne(+d.i); countUp($(`[data-msg="${d.i}"]`)); persist(); return; }
  if (act === "more-ideas") return ask("¿qué más me alcanza?");
  if (act === "drawer") return openDrawer();
  if (act === "drawer-close") return closeDrawer();
  if (act === "notif-go") { NOTIF.st.read[d.k] = 1; await DB.saveNotif(NOTIF.st); drawBell(); openPage(d.go); return; }
  if (act === "notif-readall") { for (const n of NOTIF.list) NOTIF.st.read[n.key] = 1; await DB.saveNotif(NOTIF.st); drawBell(); renderNotifs(); return; }
  if (act === "pr-cat") { PR.cat = d.k; PR.estN = 30; drawPrices(); return; }
  if (act === "lf-filter") { S.lf.f = d.f; return renderLocalFood(); }
  if (act === "near-locate") return nearLocate();
  if (act === "near-use") { S.plaza = d.id; $("#plazaSel").value = d.id; S.settings.plaza = d.id; DB.saveSettings({ ...S.settings, plaza: d.id }); S.stack.length = 0; syncPages(); toast("Plaza: " + plazaName(d.id) + ". Escribe tu presupuesto."); $("#budgetIn")?.focus(); return; }
  if (act === "pr-est-more") { PR.estN = (PR.estN || 30) + 30; return drawEst(); }
  if (act === "pr-vote") {
    const ok = d.ok === "1", cur = PR.votes[d.id], next = cur === ok ? null : ok;
    try { await DB.votePrice(d.id, next); } catch (err) { return toast(err.message); }
    const p = PR.rows.find((x) => x.id === d.id); if (p) { p.still_ok = (p.still_ok || 0) - (cur === true) + (next === true); p.gone = (p.gone || 0) - (cur === false) + (next === false); }
    if (next === null) delete PR.votes[d.id]; else PR.votes[d.id] = next; drawPrices(); return;
  }
  if (act === "pr-del") { if (!confirm("¿Borrar este precio?")) return; try { await DB.deletePrice(d.id); PR.rows = PR.rows.filter((x) => x.id !== d.id); drawPrices(); } catch (err) { toast(err.message); } return; }
  if (act === "pr-flag") { if (!confirm("¿Reportar este precio como falso o inapropiado?")) return; try { await DB.flagPrice(d.id); toast("Gracias, lo revisaremos."); } catch (err) { toast(err.message); } return; }
  if (act === "pr-reqdel") { if (!confirm("¿Borrar esta cotización?")) return; try { await DB.deleteRequest(d.id); PR.reqs = PR.reqs.filter((x) => x.id !== d.id); drawPrices(); } catch (err) { toast(err.message); } return; }
  if (act === "pr-answer") {
    const r = PR.reqs.find((x) => x.id === d.id); if (!r) return; const f = $("#prForm");
    $("#prAdd").open = true; f.elements.category.value = r.category; syncUnits(); f.elements.product.value = r.product; if (r.zone) f.elements.zone.value = r.zone; f.scrollIntoView({ behavior: "smooth", block: "center" }); f.elements.unit.focus(); return;
  }
  if (act === "com-kind") { COM.kind = d.k; drawCommunity(); return; }
  if (act === "com-sort") { COM.sort = d.k; drawCommunity(); return; }
  if (act === "com-like") {
    const on = !COM.likes.has(d.id);
    try { await DB.toggleLike(d.id, on); } catch (err) { return toast(err.message); }
    on ? COM.likes.add(d.id) : COM.likes.delete(d.id); const p = COM.posts.find((x) => x.id === d.id); if (p) p.likes = Math.max(0, (p.likes || 0) + (on ? 1 : -1)); drawCommunity(); return;
  }
  if (act === "com-vote") {
    const ok = d.ok === "1", cur = COM.votes[d.id], next = cur === ok ? null : ok;
    try { await DB.vote(d.id, next); } catch (err) { return toast(err.message); }
    const p = COM.posts.find((x) => x.id === d.id);
    if (p) { p.still_ok = (p.still_ok || 0) - (cur === true) + (next === true); p.gone = (p.gone || 0) - (cur === false) + (next === false); }
    if (next === null) delete COM.votes[d.id]; else COM.votes[d.id] = next; drawCommunity(); return;
  }
  if (act === "com-del") { if (!confirm("¿Borrar esta publicación?")) return; try { await DB.deletePost(d.id); COM.posts = COM.posts.filter((x) => x.id !== d.id); drawCommunity(); } catch (err) { toast(err.message); } return; }
  if (act === "com-report") { if (!confirm("¿Reportar esta publicación como inapropiada o falsa?")) return; try { await DB.reportPost(d.id); toast("Gracias, la revisaremos. Con varios reportes se oculta sola."); } catch (err) { toast(err.message); } return; }
  if (act === "home") { closeDrawer(); S.chat = newChat(); S.stack = []; syncPages(); S.cats.clear(); renderThread(); renderHero(); $("#main").scrollTop = 0; return; }
  if (act === "example") { closeDrawer(); return ask(d.q); }
  if (act === "new-chat") { closeDrawer(); S.chat = newChat(); S.stack = []; syncPages(); S.cats.clear(); renderThread(); renderHero(); return; }
  if (act === "quick") return setBudget(+d.n);
  if (act === "edit-budget") { window.scrollTo({ top: 0, behavior: "smooth" }); $("#main").scrollTo?.({ top: 0, behavior: "smooth" }); $("#hero").scrollIntoView({ behavior: "smooth", block: "start" }); $("#budgetIn").focus(); $("#budgetIn").select(); return; }
  if (act === "cat") { S.cats.has(d.cat) ? S.cats.delete(d.cat) : S.cats.add(d.cat); return renderHero(); }
  if (act === "morecats") { S.moreCats = true; return renderHero(); }
  if (act === "go") { const cats = [...S.cats]; await ask(`Tengo ${money(S.budget)}${S.plaza ? " en " + plazaName(S.plaza) : ""}, quiero ${cats.join(", ")}`, `Combo de ${money(S.budget)}`); S.cats.clear(); return renderHero(); }
  if (act === "toggle") { const m = msgs[+d.i]; m.open = m.open === d.cat ? null : d.cat; return renderOne(+d.i); }
  if (act === "pick") { const m = msgs[+d.i], a = m.alts[d.cat][+d.j]; m.picks = m.picks.map((p) => (p.cat === d.cat ? { cat: d.cat, ...a } : p)); m.bump = true; renderOne(+d.i); delete m.bump; countUp($(`[data-msg="${d.i}"]`)); persist(); return; }
  if (act === "more") { const m = msgs[+d.i]; m.expanded = !m.expanded; return renderOne(+d.i); }
  if (act === "fav") {
    const on = !S.favs.includes(d.id); S.favs = on ? [...S.favs, d.id] : S.favs.filter((x) => x !== d.id);
    $$(`.star[data-id="${CSS.escape(d.id)}"]`).forEach((x) => x.setAttribute("aria-pressed", on));
    try { await DB.setFav(d.id, on); } catch (err) { toast("No se pudo guardar: " + err.message); }
    refreshNotifs();
    if (S.stack.at(-1) === "favs") renderFavs(); return;
  }
  if (act === "open-chat") { closeDrawer(); const c = await DB.loadChat(d.id); if (c) { S.chat = c; S.stack = []; syncPages(); renderThread(); renderHero(); } return; }
  if (act === "del-chat") { await DB.deleteChat(d.id); if (d.id === S.chat.id) S.chat = newChat(); renderHistory(); return; }
  if (act === "seg") { $$(".seg button").forEach((b) => b.classList.toggle("on", b === el)); $("#prodForm").hidden = d.seg !== "prod"; $("#storeForm").hidden = d.seg !== "store"; return; }
  if (act === "skip-login") { await DB.saveSettings({ ...S.settings, skipLogin: true }); S.settings.skipLogin = true; $("#welcome").hidden = true; return; }
  if (act === "show-welcome") { S.stack = []; syncPages(); showWelcome(); return; }
  if (act === "logout") { await DB.signOut(); await loadAll(); S.chat = newChat(); renderThread(); renderHero(); renderAccount(); return; }
  if (act === "fetch-link") return fetchLink();
});

// ---------- Mensaje de texto ----------
$("#composer").addEventListener("submit", async (e) => {
  e.preventDefault();
  const t = $("#chatInput").value.trim(); if (!t) return;
  $("#chatInput").value = ""; await ask(t);
});
$("#plazaSel").addEventListener("change", async (e) => { S.plaza = e.target.value; DB.saveSettings({ ...S.settings, plaza: S.plaza }); S.settings.plaza = S.plaza; });

// ---------- Inicio de sesión ----------
function showWelcome(afterChat) {
  $("#welcome").hidden = false;
  $("#welcome h2").textContent = afterChat ? "¿Quieres seguir recibiendo recomendaciones?" : "Entra para guardar tus chats y favoritos";
  $("#pwRow").hidden = !S.cloud; $("#authSecondary").hidden = !S.cloud;
  $("#authPrimary").textContent = S.cloud ? "Entrar" : "Guardar perfil";
  $("#authPrimary").dataset.mode = S.cloud ? "signin" : "signup";
  const base = S.cloud ? "Tu cuenta vive en la nube: entras desde cualquier equipo." : "Sin conexión a la nube, tu perfil se guarda solo en este navegador. Puedes conectarla después en Ajustes.";
  $("#welcomeNote").textContent = (afterChat ? "Inicia sesión para seguir recibiendo recomendaciones y guardar tus chats y favoritos. O sigue sin cuenta: todo funciona igual. " : "") + base;
}
$("#authForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target)), mode = e.submitter?.dataset.mode, msg = $("#authMsg");
  line(msg, "Un momento…");
  try {
    if (S.cloud && mode === "signin") await DB.signIn(f);
    else { await DB.signUp(f); if (S.cloud && !(await DB.getSession())?.access_token) return line(msg, "Cuenta creada. Revisa tu correo para confirmarla y luego toca Entrar.", "ok"); }
    await loadAll(); $("#welcome").hidden = true; renderHero(); toast("Sesión iniciada");
  } catch (err) { line(msg, err.message, "err"); }
});
// ---------- A domicilio (enlaces a Rappi y DiDi Food; sin conexión a sus datos) ----------
const rappiUrl = (q) => "https://www.rappi.com.mx/search?query=" + encodeURIComponent(q);
const DIDI_URL = "https://web.didiglobal.com/mx/food/aguascalientes-agu/";
const isFood = (s) => (s.cats || []).some((c) => ["comida", "cafe", "postres"].includes(c));
const plainName = (s) => String(s.name || "").replace(/\s*\(.*\)\s*$/, "").trim();
const deliveryChips = (s) => isFood(s) ? `<a class="chip" href="${esc(rappiUrl(plainName(s)))}" target="_blank" rel="noopener noreferrer">Buscar en Rappi ${I.svg("external", 13)}</a><a class="chip" href="${esc(DIDI_URL)}" target="_blank" rel="noopener noreferrer">DiDi Food ${I.svg("external", 13)}</a>` : "";
function renderDelivery() {
  $("#delivChips").innerHTML = ["Pizza", "Tacos", "Hamburguesas", "Sushi", "Pollo", "Café", "Postres", "Súper"].map((q) => `<a class="chip" href="${esc(rappiUrl(q))}" target="_blank" rel="noopener noreferrer">${esc(q)}</a>`).join("");
  $("#didiLink").href = DIDI_URL;
}
document.addEventListener("submit", (e) => {
  if (e.target.id !== "delivForm") return;
  e.preventDefault();
  const q = new FormData(e.target).get("q").trim(); if (q) window.open(rappiUrl(q), "_blank", "noopener,noreferrer");
});

// ---------- Comida local (v2.5) ----------
S.lf = S.lf || { f: "all" };
function renderLocalFood() {
  const all = S.stores.filter((s) => s.local), f = S.lf.f;
  const chips = [["all", "Todo"], ["named", "Lugares con nombre"], ["generic", "Tipos de negocio"], ["cheap", "Lo más barato"]];
  $("#lfChips").innerHTML = chips.map(([k, l]) => `<button class="chip ${f === k ? "on" : ""}" data-act="lf-filter" data-f="${k}">${l}</button>`).join("");
  let list = all.filter((s) => f === "named" ? s.named : f === "generic" ? s.generic : true);
  if (f === "cheap") list = list.slice().sort((a, b) => Math.min(...a.items.map((x) => x.min)) - Math.min(...b.items.map((x) => x.min)));
  $("#lfList").innerHTML = list.map((s) => {
    const its = s.items.slice().sort((a, b) => a.min - b.min).slice(0, 3), low = Math.min(...s.items.map((x) => x.min));
    return `<article class="offer" style="margin:8px 16px"><b>${esc(s.name)}</b> ${mark(s)} <span class="tag ${s.named ? "kind" : "solo"}">${s.named ? "Lugar mencionado en fuentes públicas" : "Tipo de negocio"}</span>
      <div class="sm muted">${s.address ? esc(s.address) + " · " : ""}Desde ~${money(low)} · ${s.items.length} platillos</div>
      <div class="menu-grid" style="padding:0;margin-top:6px">${its.map((it, k) => `<article class="dish est" style="--k:${k};--h:24">${thumb(s, it, it.cat)}<div class="dish-t"><b>${esc(it.name)}</b><span class="est-p">~${money(it.min)} a ${money(it.max)}</span></div></article>`).join("")}</div>
      <div class="post-act"><button class="chip" data-act="store" data-id="${esc(s.id)}">Ver menú y fotos</button><a class="chip" href="${esc(mapQ(s.mapq || s.name))}" target="_blank" rel="noopener noreferrer">${NEAR.pos ? "Buscar cerca de ti" : "Buscar en el mapa"}</a></div></article>`;
  }).join("") + `<p class="note" style="margin:8px 16px">Precios estimados por mí (nov-2026) para cada tipo de platillo; no son el menú de los negocios. Los nombres salen de Grupo Animal, Mexico News Daily, Tus Buenas Noticias, Carta.menu y Uber Eats.</p>`;
}

// ---------- Cerca de mí (v2.4) ----------
const NEAR = { pos: null, ranked: null, busy: false };
function nearFav(plazaId) { // tiendas de la plaza con oferta o menú, para recomendar qué mirar primero
  return S.stores.filter((s) => s.plaza === plazaId && (s.promo || s.menu)).sort((a, b) => (b.promo ? 1 : 0) - (a.promo ? 1 : 0) || (S.favs.includes(b.id) ? 1 : 0) - (S.favs.includes(a.id) ? 1 : 0)).slice(0, 6);
}
function renderNear() {
  const sel = $("#nearPick"); if (!sel.options.length) sel.innerHTML = `<option value="">— elige una plaza —</option>` + Object.entries(PLAZAS).filter(([, p]) => !p.virtual).map(([id, p]) => `<option value="${id}">${esc(p.name)}</option>`).join("");
  drawNear();
}
function drawNear() {
  const box = $("#nearList"), GN = window.GastaNear;
  if (!NEAR.ranked) { box.innerHTML = `<p class="muted sm" style="padding:0 16px">Toca «Usar mi ubicación» (te pedirá permiso) o elige la plaza donde estás.</p>`; return; }
  box.innerHTML = NEAR.ranked.map((r, k) => {
    const n = S.stores.filter((s) => s.plaza === r.id).length, fav = nearFav(r.id);
    return `<article class="offer" style="margin:8px 16px"><b>${esc(r.plaza.name)}</b> ${k === 0 && r.km != null ? '<span class="tag solo">La más cercana</span>' : ""}
      <div class="sm muted">${r.km != null ? `A ${esc(GN.fmtKm(r.km))} en línea recta` : "No pude ubicarla en el mapa (sin distancia)"} · ${esc(r.plaza.address || "")} · ${n} tiendas en la app</div>
      ${fav.length ? `<div class="chips" style="margin:6px 0 0;gap:6px">${fav.map((s) => `<button class="chip" data-act="store" data-id="${esc(s.id)}">${esc(s.name)}${s.promo ? " · oferta" : ""}</button>`).join("")}</div>` : ""}
      <div class="post-act"><a class="chip" href="${esc(GN.dirUrl(r.plaza, r.ll))}" target="_blank" rel="noopener noreferrer">Cómo llegar</a><button class="chip" data-act="near-use" data-id="${esc(r.id)}">Armar combo aquí</button></div></article>`;
  }).join("");
}
async function nearRank(pos, msg) {
  const el = $("#nearMsg"); line(el, msg || "Ubicando las plazas…", "");
  NEAR.pos = pos; NEAR.ranked = (await GastaNear.rank(pos, Object.fromEntries(Object.entries(PLAZAS).filter(([, p]) => !p.virtual)), { gapMs: 1100 }));
  const miss = NEAR.ranked.filter((r) => r.km == null).length;
  line(el, miss ? `Listo. ${miss} plaza(s) sin ubicación en el mapa; aparecen al final.` : "Listo.", "ok"); drawNear(); if ($("#page-prices") && !$("#page-prices").hidden) drawEst();
}
async function nearLocate() {
  if (NEAR.busy) return; NEAR.busy = true; const el = $("#nearMsg"); line(el, "Pidiendo tu ubicación…", "");
  try { await nearRank(await GastaNear.locate()); } catch (err) { line(el, err.message, "err"); } finally { NEAR.busy = false; }
}
document.addEventListener("change", async (e) => {
  if (e.target.id !== "nearPick" || !e.target.value) return;
  const id = e.target.value, p = PLAZAS[id], ll = await GastaNear.plazaCenter(id, p);
  if (!ll) { NEAR.pos = null; NEAR.ranked = [{ id, plaza: p, ll: null, km: null }]; line($("#nearMsg"), "No pude ubicar esa plaza en el mapa, pero puedes armar un combo ahí.", ""); return drawNear(); }
  await nearRank({ lat: ll[0], lng: ll[1] }, "Calculando distancias desde " + p.name + "…");
});

// ---------- Notificaciones (campanita dentro de la app) ----------
const NPREF = { fav_offers: true, expiring: true, likes: true, community: true };
const NOTIF = { list: [], st: { read: {}, ts: {}, prefs: {} } };
const ymd = (d) => d.toISOString().slice(0, 10);
async function refreshNotifs() {
  try {
    NOTIF.st = await DB.getNotif();
    const st = NOTIF.st, pr = { ...NPREF, ...st.prefs }, now = Date.now(), out = [];
    const today = ymd(new Date()), tomorrow = ymd(new Date(now + 864e5));
    const mine = (o) => S.favs.includes(o.store_id) || S.stores.some((s) => S.favs.includes(s.id) && o.store_name && N(o.store_name) === N(s.name));
    for (const o of S.offers.filter(mine)) {
      const nm = esc(o.store_name || o.store_id);
      if (pr.fav_offers) out.push({ key: "offer:" + (o.id || o.store_id + o.text), type: "tag", text: `Oferta en ${nm}: ${esc(o.text)}`, go: "offers", ts: o.created_at ? Date.parse(o.created_at) : null });
      if (pr.expiring && (o.valid_until === today || o.valid_until === tomorrow)) out.push({ key: `exp:${o.id || o.text}:${o.valid_until}`, type: "clock", text: `${o.valid_until === today ? "Hoy termina" : "Mañana termina"} la oferta de ${nm}: ${esc(o.text)}`, go: "offers", ts: null });
    }
    if (pr.likes || pr.community) {
      const posts = await DB.listPosts().catch(() => []), me = S.session?.user?.id || "local";
      for (const p of posts) {
        if (pr.likes && p.user_id === me && (p.likes || 0) > 0) out.push({ key: `like:${p.id}:${p.likes}`, type: "heart", text: `A ${p.likes} ${p.likes === 1 ? "persona le gustó" : "personas les gustó"} tu publicación «${esc(p.title)}»`, go: "community", ts: null });
        if (pr.community && p.user_id !== me && p.kind === "oferta" && p.plaza === S.plaza && now - Date.parse(p.created_at) < 3 * 864e5) out.push({ key: "com:" + p.id, type: "users", text: `Nueva oferta en la comunidad: «${esc(p.title)}»${p.store ? ` (${esc(p.store)})` : ""}`, go: "community", ts: Date.parse(p.created_at) });
      }
    }
    let changed = false;
    for (const n of out) if (!st.ts[n.key]) { st.ts[n.key] = n.ts || now; changed = true; }
    for (const n of out) n.ts = st.ts[n.key];
    out.sort((a, b) => b.ts - a.ts); NOTIF.list = out.slice(0, 30);
    const keep = new Set(out.map((n) => n.key));
    for (const m of ["ts", "read"]) for (const k of Object.keys(st[m] || {})) if (!keep.has(k)) { delete st[m][k]; changed = true; }
    if (changed) await DB.saveNotif(st);
  } catch (e) { console.warn("notificaciones:", e.message); }
  drawBell();
  if (S.stack.at(-1) === "notifs") renderNotifs();
}
const unread = () => NOTIF.list.filter((n) => !NOTIF.st.read[n.key]).length;
function drawBell() { const n = unread(), b = $("#bellBadge"); b.hidden = !n; b.textContent = n > 9 ? "9+" : n; }
function renderNotifs() {
  const pr = { ...NPREF, ...NOTIF.st.prefs }, f = $("#notifPrefs");
  for (const k of Object.keys(NPREF)) f.elements[k].checked = !!pr[k];
  $("#notifList").innerHTML = NOTIF.list.length ? NOTIF.list.map((n) => `<button class="notif ${NOTIF.st.read[n.key] ? "" : "new"}" data-act="notif-go" data-k="${esc(n.key)}" data-go="${n.go}">${I.svg(n.type, 20)}<span>${n.text}<small class="muted">${esc(ago(new Date(n.ts).toISOString()))}</small></span></button>`).join("") : `<p class="empty">Todo al día. Aquí te avisaremos de ofertas de tus tiendas ⭐, actividad en tus publicaciones y novedades de la comunidad.</p>`;
}
document.addEventListener("change", async (e) => {
  if (e.target.form?.id !== "notifPrefs") return;
  NOTIF.st.prefs = Object.fromEntries(Object.keys(NPREF).map((k) => [k, e.target.form.elements[k].checked]));
  await DB.saveNotif(NOTIF.st); await refreshNotifs();
});
document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshNotifs(); });
setInterval(() => { if (!document.hidden) refreshNotifs(); }, 3 * 60 * 1000);

// ---------- Precios locales (crowdsourcing + referencias oficiales con fuente) ----------
const PR = { cat: "all", q: "", rows: [], votes: {}, reqs: [], open: new Set() };
const PCAT = { materiales: "Materiales", servicios: "Servicios", abarrotes: "Abarrotes", mercado: "Mercados y mayoreo", refacciones: "Refacciones", telas: "Telas y uniformes", otros: "Otros" };
const PUNITS = { materiales: ["pieza", "pie", "metro", "m²", "kg", "bulto", "litro"], servicios: ["trabajo", "hora", "m²", "metro", "pieza"], abarrotes: ["kg", "litro", "pieza", "paquete", "caja", "docena"], mercado: ["kg", "caja", "bulto", "pieza", "tonelada"], refacciones: ["pieza", "juego", "litro"], telas: ["metro", "pieza", "rollo"], otros: ["pieza", "kg", "hora", "trabajo"] };
// Referencias con fuente (no son de usuarios). Agrega aquí sólo datos publicados por fuentes oficiales o periodísticas, con fecha y enlace.
const PREF = [{ id: "ref-huevo", ref: true, category: "abarrotes", product: "Huevo blanco", unit: "kg", price: 28, place: "Central de Abasto de Aguascalientes", zone: "", seen_on: "2026-08-28", author: "SNIIM (Secretaría de Economía), vía El Imparcial", url: "https://www.elimparcial.com/mexico/2026/08/31/cuanto-cuesta-el-kilo-de-huevo-el-sniim-muestra-diferencias-de-hasta-23-pesos-entre-mercados-y-revela-donde-se-vende-mas-barato/" }];
const nz = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
const daysAgo = (d) => Math.max(0, Math.round((Date.now() - Date.parse(d + "T12:00:00")) / 864e5));
const median = (a) => { const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const mapUrl = (p) => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent([p.place, p.zone, "Aguascalientes"].filter(Boolean).join(" "));
const pesos = (n) => "$" + Number(n).toLocaleString("es-MX", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
async function renderPrices() {
  $("#prNote").textContent = S.cloud ? (S.session?.user ? "Precios que ven todos los usuarios. Son referencias de lo que alguien vio, no cotizaciones oficiales: confirma siempre con el negocio." : "Puedes consultar todo; para registrar, confirmar o pedir cotización, entra con tu cuenta.") : "Modo local: lo que registres se queda sólo en este dispositivo. Con la nube activada (Ajustes) todos ven los precios.";
  $("#prScanBox").hidden = !S.cloud;
  const opts = Object.entries(PCAT).map(([k, v]) => `<option value="${k}">${v}</option>`).join(""), keep = [$("#prCat").value, $("#reqCat").value]; $("#prCat").innerHTML = opts; $("#reqCat").innerHTML = opts; if (keep[0]) $("#prCat").value = keep[0]; if (keep[1]) $("#reqCat").value = keep[1];
  const f = $("#prForm"); if (!f.elements.seen_on.value) f.elements.seen_on.value = todayStr(); f.elements.seen_on.max = todayStr(); f.elements.seen_on.min = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
  syncUnits();
  try { [PR.rows, PR.votes, PR.reqs] = [await DB.listPrices(), await DB.myPriceVotes().catch(() => ({})), await DB.listRequests().catch(() => [])]; }
  catch (err) { $("#prList").innerHTML = `<p class="empty">No pude cargar los precios (${esc(err.message)}). ¿Ya corriste supabase/prices.sql?</p>`; return; }
  drawPrices();
}
function syncUnits() { $("#prUnits").innerHTML = (PUNITS[$("#prCat").value] || []).map((u) => `<option value="${esc(u)}">`).join(""); }
document.addEventListener("change", (e) => { if (e.target.id === "prCat") syncUnits(); });
document.addEventListener("input", (e) => { if (e.target.id === "storeQ" && S.storeView) { S.storeView.q = e.target.value; S.storeView.n = 60; drawStoreGrid(); return; } if (e.target.id === "prQ") { PR.q = e.target.value; PR.estN = 30; drawPrices(); } });
document.addEventListener("submit", (e) => { if (e.target.id === "prSearch" || e.target.id === "storeSearch") e.preventDefault(); });
function groupPrices() {
  const q = nz(PR.q), me = S.session?.user?.id || "local", map = new Map();
  for (const r of [...PR.rows, ...PREF]) {
    if (PR.cat !== "all" && r.category !== PR.cat) continue;
    if (q && !nz(r.product + " " + r.place + " " + (r.zone || "")).includes(q)) continue;
    if ((r.gone || 0) >= 3 && (r.gone || 0) > (r.still_ok || 0) && r.user_id !== me) continue;
    const k = nz(r.product) + "|" + nz(r.unit); if (!map.has(k)) map.set(k, { key: k, product: r.product, unit: r.unit, category: r.category, rows: [] }); map.get(k).rows.push(r);
  }
  return [...map.values()].map((g) => {
    g.rows.sort((a, b) => b.seen_on.localeCompare(a.seen_on) || a.price - b.price);
    const fresh = g.rows.filter((r) => daysAgo(r.seen_on) <= 90), base = fresh.length ? fresh : g.rows, ps = base.map((r) => +r.price);
    return { ...g, stale: !fresh.length, min: Math.min(...ps), max: Math.max(...ps), med: median(ps), n: base.length, cheapest: base.reduce((a, b) => (+b.price < +a.price ? b : a)), last: g.rows[0].seen_on };
  }).sort((a, b) => b.n - a.n || b.last.localeCompare(a.last));
}
function drawPrices() {
  $("#prCats").innerHTML = [["all", "Todo"], ...Object.entries(PCAT)].map(([k, l]) => `<button class="chip" data-act="pr-cat" data-k="${k}" aria-pressed="${PR.cat === k}">${esc(l)}</button>`).join("");
  const me = S.session?.user?.id || "local", gs = groupPrices();
  $("#prList").innerHTML = gs.length ? gs.map((g) => {
    const rng = g.n > 1 ? `${pesos(g.min)} – ${pesos(g.max)} · mediana ${pesos(g.med)}` : pesos(g.min);
    const rows = g.rows.map((r) => {
      const mine = r.user_id === me || (S.admin && S.cloud), age = daysAgo(r.seen_on);
      return `<div class="pr-row"><div><b>${pesos(r.price)}</b> <span class="muted">/ ${esc(r.unit)}</span> · ${esc(r.place)}${r.zone ? ", " + esc(r.zone) : ""}${r.ref ? ` <span class="btag k-idea">Referencia oficial</span>` : ""}${age > 90 ? ` <span class="btag k-oferta">Dato viejo</span>` : ""}
        <div class="sm muted">Visto ${age === 0 ? "hoy" : "hace " + age + " d"} · ${esc(r.author || "Anónimo")}${r.note ? " · " + esc(r.note) : ""}${r.ref ? ` · <a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">fuente</a>` : !r.ref ? ` · ${r.still_ok || 0} sigue así, ${r.gone || 0} ya cambió` : ""}</div></div>
        <div class="post-act">${r.ref ? "" : (!mine && r.user_id !== me ? `<button class="chip" data-act="pr-vote" data-id="${esc(r.id)}" data-ok="1" aria-pressed="${PR.votes[r.id] === true}">Sigue así</button><button class="chip" data-act="pr-vote" data-id="${esc(r.id)}" data-ok="0" aria-pressed="${PR.votes[r.id] === false}">Ya cambió</button>` : "")}<a class="chip" href="${esc(mapUrl(r))}" target="_blank" rel="noopener noreferrer">Mapa ${I.svg("external", 13)}</a>${r.ref ? "" : mine ? `<button class="chip" data-act="pr-del" data-id="${esc(r.id)}">${I.svg("trash", 15)}</button>` : `<button class="chip" data-act="pr-flag" data-id="${esc(r.id)}" aria-label="Reportar">${I.svg("flag", 15)}</button>`}</div></div>`;
    }).join("");
    return `<details class="pr-group" data-k="${esc(g.key)}" ${PR.open.has(g.key) ? "open" : ""}><summary><span><b>${esc(g.product)}</b> <span class="muted">por ${esc(g.unit)}</span><br><span class="sm">${rng} · ${g.n} ${g.n === 1 ? "precio" : "precios"}${g.stale ? " · datos viejos" : ""}</span></span><span class="btag">${esc(PCAT[g.category] || g.category)}</span></summary>
      <p class="sm" style="margin:6px 0">Más barato visto: <b>${esc(g.cheapest.place)}</b> a ${pesos(g.cheapest.price)}.</p>${rows}</details>`;
  }).join("") : `<p class="empty">${PR.q || PR.cat !== "all" ? "No hay precios con ese filtro." : "Aún no hay precios."} Registra el primero abajo, o pide una cotización.</p>`;
  $("#reqList").innerHTML = PR.reqs.length ? PR.reqs.map((r) => {
    const n = PR.rows.filter((x) => nz(x.product).includes(nz(r.product).split(" ")[0]) && x.category === r.category).length, mine = r.user_id === me || (S.admin && S.cloud);
    return `<div class="offer"><b>${esc(r.product)}</b><span class="btag" style="margin-left:6px">${esc(PCAT[r.category] || r.category)}</span><div class="sm muted">${esc(r.author || "Anónimo")} · ${esc(ago(r.created_at))}${r.zone ? " · " + esc(r.zone) : ""}${r.note ? " · " + esc(r.note) : ""}</div>
      <div class="post-act"><button class="chip" data-act="pr-answer" data-id="${esc(r.id)}">Responder con un precio</button>${mine ? `<button class="chip" data-act="pr-reqdel" data-id="${esc(r.id)}">${I.svg("trash", 15)}</button>` : ""}<span class="sm muted">${n ? n + " precio(s) parecido(s) ya registrado(s)" : ""}</span></div></div>`;
  }).join("") : `<p class="muted sm">No hay cotizaciones pendientes.</p>`;
  $("#prRefs").innerHTML = `<h3 style="margin:0 0 4px">Referencias oficiales (con fuente)</h3><p class="muted sm" style="margin:0 0 6px">Para abarrotes y productos básicos hay bases públicas gratuitas. Aquí sólo aparece lo que se pudo verificar; el resto lo aporta la gente. Para ver precios oficiales por tienda: <a href="http://qqp.profeco.gob.mx" target="_blank" rel="noopener noreferrer">Quién es Quién en los Precios (Profeco)</a>.</p>`;
  drawEst();
}
// ---- Referencias estimadas (locales.js): rangos aproximados con foto y dónde buscarlos ----
const mapQ = (q) => (window.GastaNear ? GastaNear.searchUrl(q, NEAR.pos) : "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q + " Aguascalientes"));
function drawEst() {
  const box = $("#prEst"), LC = window.GASTABOT_LOCALES; if (!box || !LC) return;
  const q = nz(PR.q), all = LC.ITEMS.filter((r) => (PR.cat === "all" || r.category === PR.cat) && (!q || nz(r.product + " " + (PCAT[r.category] || "") + " " + r.where.map((w) => w.label).join(" ")).includes(q)));
  const shown = all.slice(0, PR.estN || 30), store = { id: "local", name: "Precios locales", cats: ["otros"] };
  box.innerHTML = `<h3 style="margin:18px 16px 4px">Referencias estimadas</h3><p class="muted sm" style="margin:0 16px 8px">Rangos aproximados míos (nov-2026), <b>sin fuente oficial</b>: sólo para darte una idea. Cambian por negocio, calidad y temporada; confirma o pide cotización.</p>
    <div style="margin:0 16px 8px">${NEAR.pos ? `<span class="tag solo">Buscando cerca de ti</span>` : `<button class="chip" data-act="near-locate">Buscar cerca de mí</button>`}</div>
    <div class="menu-grid">${shown.map((r, k) => `<article class="dish est" style="--k:${Math.min(k, 12)};--h:150">${thumb(store, { name: r.product, cat: "otros", type: r.type, tags: [] }, "otros")}<div class="dish-t"><b>${esc(r.product)}</b><span class="est-p">~${pesos(r.min)} a ${pesos(r.max)} <span class="muted">por ${esc(r.unit)}</span></span>
      <span class="sm"><span class="tag solo">Estimado</span> ${esc(PCAT[r.category] || r.category)}</span>${r.note ? `<span class="desc">${esc(r.note)}</span>` : ""}
      <span class="sm muted">Dónde buscarlo:</span><span class="chips" style="margin:4px 0 0;gap:6px">${r.where.map((w) => `<a class="chip" href="${esc(mapQ(w.q))}" target="_blank" rel="noopener noreferrer">${esc(w.label)}</a>`).join("")}</span></div></article>`).join("")}</div>
    ${all.length > shown.length ? `<div style="padding:8px 16px"><button class="btn ghost" data-act="pr-est-more">Ver más (${all.length - shown.length} restantes)</button></div>` : ""}`;
}
document.addEventListener("toggle", (e) => { const d = e.target; if (d.classList?.contains("pr-group")) d.open ? PR.open.add(d.dataset.k) : PR.open.delete(d.dataset.k); }, true);
document.addEventListener("submit", async (e) => {
  if (e.target.id === "prForm") {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)), msg = $("#prMsg");
    const price = Number(f.price); if (!(price > 0 && price <= 1e6)) return line(msg, "Pon un precio válido.", "err");
    try { await DB.addPrices([{ category: f.category, product: f.product.trim().slice(0, 80), unit: f.unit.trim().slice(0, 30), price, place: f.place.trim().slice(0, 60), zone: f.zone.trim().slice(0, 60) || null, note: f.note.trim().slice(0, 200) || null, seen_on: f.seen_on }]); e.target.reset(); line(msg, "Guardado. ¡Gracias!", "ok"); await renderPrices(); }
    catch (err) { line(msg, err.message, "err"); }
  }
  if (e.target.id === "reqForm") {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)), msg = $("#reqMsg");
    try { await DB.addRequest({ category: f.category, product: f.product.trim().slice(0, 100), zone: f.zone.trim().slice(0, 60) || null, note: f.note.trim().slice(0, 200) || null }); e.target.reset(); line(msg, "Publicada.", "ok"); await renderPrices(); }
    catch (err) { line(msg, err.message, "err"); }
  }
  if (e.target.id === "prBatch") {
    e.preventDefault(); const el = e.target.elements, rows = [];
    $$("#prBatch .pb-row").forEach((r) => { if (r.querySelector("[name=use]").checked) rows.push({ category: el.category.value, product: r.querySelector("[name=product]").value.trim().slice(0, 80), unit: r.querySelector("[name=unit]").value.trim().slice(0, 30) || "pieza", price: Number(r.querySelector("[name=price]").value), place: el.place.value.trim().slice(0, 60), zone: el.zone.value.trim().slice(0, 60) || null, seen_on: el.seen_on.value }); });
    const bad = rows.filter((r) => r.product.length < 2 || !(r.price > 0 && r.price <= 1e6)), msg = $("#prScanMsg");
    if (!rows.length) return line(msg, "Marca al menos un renglón.", "err"); if (bad.length) return line(msg, "Revisa nombre y precio de los renglones marcados.", "err"); if (el.place.value.trim().length < 2) return line(msg, "Pon el nombre del negocio.", "err");
    try { await DB.addPrices(rows); e.target.hidden = true; e.target.innerHTML = ""; line(msg, `Guardados ${rows.length} precios. ¡Gracias!`, "ok"); await renderPrices(); } catch (err) { line(msg, err.message, "err"); }
  }
});
document.addEventListener("change", async (e) => {
  if (e.target.id !== "prPhoto" || !e.target.files?.[0]) return;
  const msg = $("#prScanMsg"), box = $("#prBatch"); line(msg, "Leyendo la lista…", ""); box.hidden = true;
  try {
    const r = await DB.scanOffer(await shrink(e.target.files[0]), "image/jpeg", "precios");
    if (!r.is_prices) return line(msg, "No pude leer precios en esa imagen. Puedes registrarlos a mano.", "err");
    box.innerHTML = `<p class="sm muted">Revisa y corrige: la lectura puede tener errores. Se guardan sólo los renglones marcados.</p>
      <label>Categoría<select name="category">${Object.entries(PCAT).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></label>
      <label>Negocio<input name="place" maxlength="60" value="${esc(r.place || "")}" required /></label><label>Zona (opcional)<input name="zone" maxlength="60" /></label>
      <label>¿Cuándo lo viste?<input name="seen_on" type="date" value="${todayStr()}" max="${todayStr()}" required /></label>
      ${r.items.map((x) => `<div class="pb-row"><input type="checkbox" name="use" checked aria-label="Guardar"><input name="product" maxlength="80" value="${esc(x.product)}"><input name="unit" maxlength="30" value="${esc(x.unit)}" style="max-width:84px"><input name="price" type="number" step="0.01" min="0.01" value="${esc(x.price)}" style="max-width:96px"></div>`).join("")}
      <button class="primary" type="submit">Guardar renglones marcados</button>`;
    box.hidden = false; line(msg, `Leí ${r.items.length} renglones. Nada se guarda hasta que confirmes.`, "ok");
  } catch (err) { line(msg, err.message, "err"); }
  e.target.value = "";
});

// ---------- Comunidad ----------
const COM = { kind: "all", sort: "new", posts: [], likes: new Set(), votes: {} };
const todayStr = () => new Date().toISOString().slice(0, 10);
const fmtD = (d) => new Date(d + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" });
function syncUntil() { const f = $("#comForm"), of = f.elements.kind.value === "oferta", u = f.elements.valid_until; u.required = of; u.min = todayStr(); u.max = new Date(Date.now() + 120 * 864e5).toISOString().slice(0, 10); }
document.addEventListener("change", (e) => { if (e.target.name === "kind" && e.target.form?.id === "comForm") syncUntil(); });
const KIND = { oferta: "Oferta", lugar: "Lugar", idea: "Idea" };
const ago = (iso) => { const m = Math.max(0, (Date.now() - Date.parse(iso)) / 6e4); return m < 1 ? "ahora" : m < 60 ? `hace ${Math.floor(m)} min` : m < 1440 ? `hace ${Math.floor(m / 60)} h` : `hace ${Math.floor(m / 1440)} d`; };
async function renderCommunity() {
  const cloud = S.cloud, u = S.session?.user; syncUntil(); $("#comScanRow").hidden = !S.cloud;
  $("#comNote").textContent = !cloud ? "Estás en modo local: lo que publiques se queda sólo en este dispositivo. Con la nube activada (Ajustes) todos ven las publicaciones." : u ? "Publicaciones de todos los usuarios. Sé amable y no compartas datos personales." : "Puedes leer todo; para publicar, dar me gusta o reportar, entra con tu cuenta.";
  $("#comStores").innerHTML = [...new Set(S.stores.map((x) => x.name.replace(/\s*\(.*\)\s*$/, "")))].sort().map((n) => `<option value="${esc(n)}">`).join("");
  try { [COM.posts, COM.likes, COM.votes] = [await DB.listPosts(), new Set(await DB.myLikes().catch(() => [])), await DB.myVotes().catch(() => ({}))]; } catch (err) { COM.posts = []; $("#comList").innerHTML = `<p class="empty">No pude cargar la comunidad (${esc(err.message)}). ¿Ya corriste supabase/community.sql?</p>`; return; }
  drawCommunity();
}
function drawCommunity() {
  $("#comKinds").innerHTML = [["all", "Todo"], ["oferta", "Ofertas"], ["lugar", "Lugares"], ["idea", "Ideas"]].map(([k, l]) => `<button class="chip" data-act="com-kind" data-k="${k}" aria-pressed="${COM.kind === k}">${l}</button>`).join("");
  $("#comSort").innerHTML = [["new", "Recientes"], ["top", "Más votadas"]].map(([k, l]) => `<button class="chip" data-act="com-sort" data-k="${k}" aria-pressed="${COM.sort === k}">${l}</button>`).join("");
  const me = S.session?.user?.id || "local";
  let list = COM.posts.filter((p) => COM.kind === "all" || p.kind === COM.kind);
  if (COM.sort === "top") list = list.slice().sort((a, b) => (b.likes || 0) - (a.likes || 0) || Date.parse(b.created_at) - Date.parse(a.created_at));
  $("#comList").innerHTML = list.length ? list.map((p) => {
    const mine = p.user_id === me || S.admin && S.cloud, liked = COM.likes.has(p.id);
    return `<article class="post"><div class="post-top"><span class="btag k-${esc(p.kind)}">${esc(KIND[p.kind] || p.kind)}</span><span class="sm muted">${esc(p.author || "Anónimo")} · ${esc(ago(p.created_at))}</span></div>
      <h3>${esc(p.title)}</h3>${p.body ? `<p>${esc(p.body)}</p>` : ""}${p.store ? `<p class="sm muted">${I.svg("tag", 14)} ${esc(p.store)}${p.plaza ? ", " + esc(plazaName(p.plaza)) : ""}</p>` : ""}
      ${p.kind === "oferta" && p.valid_until ? `<p class="sm"><b>Vigente hasta ${esc(fmtD(p.valid_until))}</b> · <span class="muted">${p.still_ok || 0} confirman, ${p.gone || 0} dicen que ya no</span></p>` : ""}
      ${p.kind === "oferta" && !mine && p.user_id !== me ? `<div class="post-act"><span class="sm muted">¿Sigue vigente?</span><button class="chip" data-act="com-vote" data-id="${esc(p.id)}" data-ok="1" aria-pressed="${COM.votes[p.id] === true}">Sí</button><button class="chip" data-act="com-vote" data-id="${esc(p.id)}" data-ok="0" aria-pressed="${COM.votes[p.id] === false}">Ya no</button></div>` : ""}
      <div class="post-act"><button class="chip" data-act="com-like" data-id="${esc(p.id)}" aria-pressed="${liked}" aria-label="Me gusta">${I.svg("heart", 15)} ${p.likes || 0}</button>
      ${mine ? `<button class="chip" data-act="com-del" data-id="${esc(p.id)}">${I.svg("trash", 15)} Borrar</button>` : `<button class="chip" data-act="com-report" data-id="${esc(p.id)}">${I.svg("flag", 15)} Reportar</button>`}</div></article>`;
  }).join("") : `<p class="empty">Aún no hay publicaciones${COM.kind === "all" ? "" : " de este tipo"}. ¡Sé el primero en compartir algo!</p>`;
}
// Foto -> JPEG reducido (máx. 1280 px) en base64 sin prefijo; la foto no se guarda en ningún lado
function shrink(file, max = 1280) {
  return new Promise((ok, no) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => { const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); ok(c.toDataURL("image/jpeg", 0.8).split(",")[1]); };
    img.onerror = () => { URL.revokeObjectURL(url); no(new Error("No pude abrir esa imagen.")); };
    img.src = url;
  });
}
document.addEventListener("change", async (e) => {
  if (e.target.id !== "comPhoto" || !e.target.files?.[0]) return;
  const msg = $("#comScanMsg"), f = $("#comForm"); line(msg, "Leyendo la oferta…", "");
  try {
    const r = await DB.scanOffer(await shrink(e.target.files[0]), "image/jpeg");
    if (!r.is_offer) return line(msg, "No vi una oferta en esa imagen. Puedes llenarla a mano.", "err");
    f.elements.kind.value = "oferta"; f.elements.title.value = r.title || ""; f.elements.body.value = r.body || ""; f.elements.store.value = r.store || ""; f.elements.valid_until.value = r.valid_until || ""; syncUntil();
    line(msg, `Listo (lectura ${r.confidence}). Revisa los datos${r.valid_until ? "" : " y pon la fecha, que no se leyó"}: la lectura puede tener errores. Nada se publica hasta que toques «Publicar».`, "ok");
  } catch (err) { line(msg, err.message, "err"); }
  e.target.value = "";
});
document.addEventListener("submit", async (e) => {
  if (e.target.id !== "comForm") return;
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target)), t = f.title.trim();
  if (t.length < 3) return line($("#comMsg"), "Escribe un título de al menos 3 letras.", "err");
  try {
    if (f.kind === "oferta" && !f.valid_until) return line($("#comMsg"), "Pon hasta cuándo es válida la oferta.", "err");
    await DB.addPost({ kind: f.kind, ...(f.kind === "oferta" ? { valid_until: f.valid_until } : {}), title: t.slice(0, 80), body: (f.body || "").trim().slice(0, 400) || null, store: (f.store || "").trim().slice(0, 60) || null, plaza: S.plaza });
    e.target.reset(); line($("#comMsg"), "Publicado. ¡Gracias por compartir!", "ok"); await renderCommunity();
  } catch (err) { line($("#comMsg"), err.message, "err"); }
});

document.addEventListener("submit", async (e) => {
  if (e.target.id !== "profForm") return;
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target));
  if (e.target.elements.email_digest) f.email_digest = e.target.elements.email_digest.checked;
  try { await DB.saveProfile({ ...(S.profile || {}), ...f }); S.profile = { ...(S.profile || {}), ...f }; line($("#profMsg"), "Perfil guardado.", "ok"); renderHero(); } catch (err) { line($("#profMsg"), err.message, "err"); }
});

// ---------- Agregar producto por link / tienda ----------
async function fetchLink() {
  const f = $("#prodForm"), url = f.elements.url.value.trim(), msg = $("#addMsg");
  if (!url) return line(msg, "Pega primero el link del producto.", "err");
  line(msg, "Buscando datos…");
  try {
    const p = await GastaLink.fetchProduct(url);
    if (p.name) f.elements.name.value = p.name.slice(0, 90);
    if (p.price) f.elements.price.value = Math.round(p.price);
    if (p.image) f.elements.img.value = p.image;
    const host = hostOf(url)?.replace(/^www\d*\./, "") || "";
    const st = S.stores.find((s) => s.site && host && hostOf(s.site)?.replace(/^www\d*\./, "").split(".")[0] === host.split(".")[0]);
    if (st) f.elements.storeId.value = st.id;
    const pv = $("#linkPreview"); pv.hidden = false;
    pv.innerHTML = `${safeUrl(p.image) ? `<img src="${esc(p.image)}" alt="" referrerpolicy="no-referrer">` : ""}<div><b>${esc(p.name || "Sin nombre")}</b><br><span class="muted">${p.price ? money(p.price) : "No encontré el precio"}</span></div>`;
    const missing = [!p.price && "precio", !p.image && "imagen", !p.name && "nombre"].filter(Boolean);
    line(msg, missing.length ? `Falta ${missing.join(" y ")}: complétalo a mano.` : "Datos listos. Revisa y guarda.", missing.length ? "" : "ok");
  } catch (err) { line(msg, err.message, "err"); }
}
$("#prodForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target)), s = S.stores.find((x) => x.id === f.storeId), msg = $("#addMsg");
  if (!s) return line(msg, "Elige una tienda.", "err");
  const price = Math.round(+f.price);
  const item = { name: f.name.trim(), cat: f.cat, min: price, max: price, tags: N(f.name).split(/[^a-z0-9ñ]+/).filter((w) => w.length > 2), exact: true, estimated: false, capturedAt: new Date().toISOString().slice(0, 10), ...(safeUrl(f.img) ? { img: f.img } : {}), ...(safeUrl(f.url) ? { url: f.url } : {}) };
  const items = E.itemsOf(s).filter((i) => i.name !== item.name).concat(item);
  try {
    await DB.upsertStores(S.settings.city || "aguascalientes", [{ id: s.id, name: s.name, plaza: s.plaza, cats: [...new Set([...(s.cats || []), f.cat])], min: s.min, max: s.max, site: s.site, verified: s.verified, source: s.source || "manual", items }]);
    e.target.reset(); $("#linkPreview").hidden = true; await loadAll(); renderAdd(); line(msg, `Guardé «${item.name}» en ${s.name}. Ya sale en comparaciones.`, "ok"); toast("Producto guardado");
  } catch (err) { line(msg, err.message + (S.cloud ? " (en modo nube solo un admin puede agregar productos)" : ""), "err"); }
});
$("#storeForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = new FormData(e.target), name = f.get("name").trim(), msg = $("#addMsg");
  const cats = f.get("cats").split(",").map((c) => N(c.trim())).filter(Boolean);
  const store = { id: `u-${f.get("plaza")}-${N(name).replace(/[^a-z0-9]+/g, "-")}`, name, plaza: f.get("plaza"), cats, min: +f.get("min"), max: Math.max(+f.get("min"), +f.get("max")), site: f.get("site") || null, verified: false, source: "manual" };
  try { await DB.upsertStores(S.settings.city || "aguascalientes", [store]); e.target.reset(); await loadAll(); renderAdd(); line(msg, `Guardé «${name}».`, "ok"); }
  catch (err) { line(msg, err.message + (S.cloud ? " (en modo nube solo un admin puede agregar tiendas)" : ""), "err"); }
});

// ---------- Ofertas, ajustes, sincronización ----------
$("#offerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target)), s = S.stores.find((x) => x.id === f.storeId);
  try { await DB.addOffer({ store_id: f.storeId, store_name: s?.name, text: f.text.trim(), valid_until: f.valid_until }); e.target.reset(); await loadAll(); renderOffers(); line($("#offerMsg"), "Oferta publicada.", "ok"); }
  catch (err) { line($("#offerMsg"), err.message, "err"); }
});
$("#setForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  await DB.saveSettings({ ...S.settings, ...Object.fromEntries(new FormData(e.target)), llm: e.target.elements.llm.checked });
  await loadAll(); line($("#setMsg"), "Ajustes guardados.", "ok");
});
async function sync(kind) {
  const msg = $("#setMsg");
  if (!S.plaza) return line(msg, "Elige una plaza específica arriba.", "err");
  line(msg, "Buscando tiendas…");
  try {
    const list = kind === "google"
      ? await GastaPlaces.fetchPlazaStores({ apiKey: S.settings.placesKey, plazaId: S.plaza, plaza: PLAZAS[S.plaza], cityName: CITIES[S.settings.city || "aguascalientes"].name })
      : await GastaOSM.fetchPlazaStores({ plazaId: S.plaza, plaza: PLAZAS[S.plaza] });
    if (!list.length) return line(msg, "No encontré tiendas para esa plaza con esa fuente.", "err");
    await DB.upsertStores(S.settings.city || "aguascalientes", list); await loadAll();
    line(msg, `Se sincronizaron ${list.length} negocios. Los rangos son estimados: revísalos.`, "ok");
  } catch (err) { line(msg, err.message, "err"); }
}
$("#syncBtn").addEventListener("click", () => sync("google"));
$("#osmBtn").addEventListener("click", () => sync("osm"));
$("#resetBtn").addEventListener("click", async () => { if (confirm("¿Borrar todos los datos de gastabot en este navegador? Incluye chats, favoritos y claves.")) { await DB.clear(); location.reload(); } });

// Si una imagen no carga, se queda el ícono de la categoría
document.addEventListener("error", (e) => { if (e.target.tagName === "IMG" && e.target.closest(".thumb")) e.target.remove(); }, true);

// ---------- Inicio ----------
(async function init() {
  $$("[data-icon]").forEach((el) => (el.innerHTML = I.svg(el.dataset.icon, el.classList.contains("chev") ? 14 : 20)));
  await loadAll();
  S.chat = newChat();
  $("#plazaSel").innerHTML = `<option value="">Todas las plazas</option>` + Object.entries(PLAZAS).map(([id, p]) => `<option value="${id}">${esc(p.name)}</option>`).join("");
  S.plaza = S.settings.plaza ?? S.profile?.plaza ?? "altaria"; if (S.plaza && !PLAZAS[S.plaza]) S.plaza = "altaria";
  $("#plazaSel").value = S.plaza;
  const b0 = +S.settings.lastBudget || +S.profile?.budget || 0;
  if (b0) { S.budget = b0; $("#budgetIn").value = b0.toLocaleString("es-MX"); }
  renderBudgetBar(); renderThread(); renderHero(); GastaPhotos.watch();
})();
