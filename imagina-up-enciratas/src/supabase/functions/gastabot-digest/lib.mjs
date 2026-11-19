// Lógica pura del correo de recomendaciones (se prueba con Node y corre en Deno/Supabase).
// Qué manda: por cada tienda favorita (⭐) del usuario → ofertas vigentes, algunos productos de esa tienda
// y «opciones parecidas de otras marcas» (etiquetadas como tal). Precios ESTIMADOS salvo los marcados exactos.
export const norm = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
export const money = (n) => "$" + Math.round(n).toLocaleString("es-MX");
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const est = (i) => Math.round(i.min + (i.max - i.min) * 0.35);
export const brandName = (s) => String(s?.name ?? "").replace(/\s*\(.*\)\s*$/, "").trim();
export const sameBrand = (a, b) => norm(brandName(a)) === norm(brandName(b));
const safeUrl = (u) => (/^https?:\/\//i.test(String(u ?? "")) ? String(u) : "");

// Hasta n productos repartidos por precio (barato, medio, caro) sin repetir nombre
export function spread(items, n) {
  const arr = [...new Map(items.map((i) => [i.name, i])).values()].sort((a, b) => est(a) - est(b));
  if (arr.length <= n) return arr;
  return [...new Set(Array.from({ length: n }, (_, k) => arr[Math.round((k * (arr.length - 1)) / (n - 1))]))];
}
const offersOf = (store, offers, today) => (offers || []).filter((o) => (o.store_id === store.id || (o.store_name && norm(o.store_name) === norm(store.name))) && String(o.valid_until) >= today);

// favIds: ids de tiendas favoritas; stores: catálogo completo; offers: ofertas; today: "YYYY-MM-DD"
export function recommend({ favIds, stores, offers = [], today, perStore = 3, similarN = 2, maxStores = 6 }) {
  const byId = new Map(stores.map((s) => [s.id, s]));
  const favs = [...new Set(favIds)].map((id) => byId.get(id)).filter((s) => s && (s.items || []).length).slice(0, maxStores);
  const sections = favs.map((s) => {
    const items = spread(s.items, perStore);
    const cats = new Set(s.items.map((i) => i.cat));
    // opciones parecidas: otras marcas de la misma plaza, misma categoría, un producto por marca, precio cercano
    const mine = items.length ? items.reduce((a, i) => a + est(i), 0) / items.length : 0;
    const sims = [];
    for (const o of stores) {
      if (o.id === s.id || sameBrand(o, s) || o.plaza !== s.plaza || favs.some((f) => sameBrand(f, o))) continue;
      const cand = (o.items || []).filter((i) => cats.has(i.cat));
      if (!cand.length) continue;
      const best = cand.slice().sort((a, b) => Math.abs(Math.log(est(a) / Math.max(mine, 1))) - Math.abs(Math.log(est(b) / Math.max(mine, 1))))[0];
      sims.push({ store: o, item: best, d: Math.abs(Math.log(est(best) / Math.max(mine, 1))) });
    }
    sims.sort((a, b) => a.d - b.d || (b.store.verified | 0) - (a.store.verified | 0));
    return { store: s, offers: offersOf(s, offers, today), items, similar: sims.slice(0, similarN) };
  });
  return { sections, skipped: [...new Set(favIds)].length - favs.length };
}

const itemRow = (i, tag = "") => `<tr><td style="padding:4px 0;font-size:14px;color:#121512">${esc(i.name)}${tag}</td><td align="right" style="padding:4px 0;font-size:14px;font-weight:600;color:#0F5C44;white-space:nowrap">${i.exact ? "" : "~"}${money(est(i))}</td></tr>`;
export function renderEmail(rec, { name = "", unsubUrl = "", appUrl = "" } = {}) {
  const hi = name ? `Hola ${esc(name.split(" ")[0])},` : "Hola,";
  const names = rec.sections.map((x) => brandName(x.store));
  const subject = `GastaBot: recomendaciones de ${names.slice(0, 3).join(", ")}${names.length > 3 ? " y más" : ""}`;
  const blocks = rec.sections.map((x) => {
    const link = safeUrl(x.store.site);
    const offers = x.offers.map((o) => `<p style="margin:6px 0;padding:8px 10px;background:#FDEFE3;border-radius:8px;font-size:13px;color:#7A3305"><b>Oferta:</b> ${esc(o.text)} (hasta ${esc(o.valid_until)})</p>`).join("");
    const sims = x.similar.length ? `<p style="margin:12px 0 4px;font-size:12px;color:#6C736E">Opciones parecidas de <b>otras marcas</b> (no son de ${esc(brandName(x.store))}, quizá te gusten):</p><table width="100%" cellpadding="0" cellspacing="0">${x.similar.map((r) => itemRow(r.item, ` <span style="color:#6C736E;font-size:12px">· ${esc(brandName(r.store))}</span> <span style="background:#FDEFE3;color:#7A3305;font-size:11px;padding:1px 6px;border-radius:99px">Otra marca</span>`)).join("")}</table>` : "";
    return `<div style="margin:0 0 18px;padding:14px;border:1px solid #E3E6E2;border-radius:12px"><h3 style="margin:0 0 6px;font-size:16px">${esc(brandName(x.store))}${link ? ` <a href="${esc(link)}" style="font-size:12px;color:#167A5B;font-weight:400">sitio</a>` : ""}</h3>${offers}<table width="100%" cellpadding="0" cellspacing="0">${x.items.map((i) => itemRow(i)).join("")}</table>${sims}</div>`;
  }).join("");
  const html = `<div style="max-width:560px;margin:auto;font-family:Segoe UI,Arial,sans-serif;color:#121512"><h2 style="margin:0 0 6px">Tus tiendas favoritas ⭐</h2><p style="margin:0 0 14px;color:#6C736E">${hi} esto te recomendamos hoy.</p>${blocks}<p style="font-size:12px;color:#6C736E">Los precios con «~» son estimados por rango, no precios oficiales: confirma en la tienda.${appUrl ? ` <a href="${esc(appUrl)}" style="color:#167A5B">Abrir GastaBot</a>.` : ""}</p>${unsubUrl ? `<p style="font-size:12px;color:#6C736E">¿Ya no los quieres? <a href="${esc(unsubUrl)}" style="color:#167A5B">Dejar de recibir estos correos</a> (o apágalo en Ajustes › Perfil).</p>` : ""}</div>`;
  const text = [hi, "", "Tus tiendas favoritas:", ...rec.sections.flatMap((x) => ["", brandName(x.store), ...x.offers.map((o) => `  Oferta: ${o.text} (hasta ${o.valid_until})`), ...x.items.map((i) => `  - ${i.name}: ${i.exact ? "" : "~"}${money(est(i))}`), ...(x.similar.length ? ["  Otras marcas (no son de " + brandName(x.store) + "):", ...x.similar.map((r) => `  - ${r.item.name} (${brandName(r.store)}): ${r.item.exact ? "" : "~"}${money(est(r.item))}`)] : [])]), "", "Precios con ~ son estimados.", unsubUrl ? "Dejar de recibir: " + unsubUrl : ""].join("\n");
  return { subject, html, text };
}

// ¿Le toca recibir? weekly = 7 días, monthly = 30 (con 12 h de margen para que el cron diario no se salte un día)
export function isDue(profile, now = Date.now(), force = false) {
  if (!profile.email_digest) return false;
  if (force || !profile.last_digest) return true;
  const days = profile.digest_freq === "monthly" ? 30 : 7;
  return now - Date.parse(profile.last_digest) >= days * 864e5 - 12 * 36e5;
}
export const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
export async function sign(secret, userId) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(userId)));
}
export const validUuid = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s ?? ""));
