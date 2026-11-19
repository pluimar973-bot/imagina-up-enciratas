// Producto por link: lee los metadatos públicos de la página (imagen, nombre, precio) para guardar un
// producto ESPECÍFICO con precio real. Funciona sólo en sitios que publican esos metadatos (og:image,
// product:price, JSON-LD). Muchas tiendas con páginas dinámicas o anti-bots no los entregan:
// en ese caso el formulario deja escribir precio e imagen a mano.
(function (root) {
  const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();
  const num = (v) => {
    if (v == null) return null;
    const n = parseFloat(String(v).replace(/[^0-9.,]/g, "").replace(/,(?=\d{3}(\D|$))/g, "").replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  function walkLd(node, out) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach((n) => walkLd(n, out));
    if (node["@graph"]) walkLd(node["@graph"], out);
    const type = [].concat(node["@type"] || []).join(",");
    if (/Product/i.test(type)) out.products.push(node);
    if (node.offers) walkLd(node.offers, out);
    if (/Offer/i.test(type) || node.price != null || node.lowPrice != null) out.offers.push(node);
  }

  function parseProduct(html, url) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const meta = (sel) => clean(doc.querySelector(sel)?.getAttribute("content"));
    const ld = { products: [], offers: [] };
    doc.querySelectorAll('script[type="application/ld+json"]').forEach((s) => { try { walkLd(JSON.parse(s.textContent), ld); } catch {} });

    const p = ld.products[0] || {}, o = ld.offers[0] || {};
    let image = meta('meta[property="og:image"]') || meta('meta[name="twitter:image"]') || (Array.isArray(p.image) ? p.image[0] : p.image);
    if (image && typeof image === "object") image = image.url;
    try { if (image) image = new URL(image, url).href; } catch {}

    const price = num(meta('meta[property="product:price:amount"]')) || num(meta('meta[property="og:price:amount"]')) || num(meta('meta[itemprop="price"]')) || num(o.price) || num(o.lowPrice);
    const name = clean(p.name) || meta('meta[property="og:title"]') || clean(doc.querySelector("title")?.textContent);
    const currency = meta('meta[property="product:price:currency"]') || meta('meta[property="og:price:currency"]') || o.priceCurrency || null;
    const site = meta('meta[property="og:site_name"]');
    return { name: name || null, image: image || null, price, currency, site: site || null, url };
  }

  // Pide permiso SÓLO para el sitio del link (se necesita un clic del usuario) y lo lee.
  async function fetchProduct(url, { fetchImpl = fetch, requestPermission = true } = {}) {
    let u;
    try { u = new URL(url); } catch { throw new Error("El link no es válido."); }
    if (!/^https?:$/.test(u.protocol)) throw new Error("Usa un link http o https.");
    if (requestPermission && typeof chrome !== "undefined" && chrome.permissions?.request) {
      const ok = await chrome.permissions.request({ origins: [`${u.origin}/*`] });
      if (!ok) throw new Error("Sin permiso para leer ese sitio. Acéptalo o escribe los datos a mano.");
    }
    const res = await fetchImpl(u.href, { credentials: "omit", redirect: "follow" });
    if (!res.ok) throw new Error(`El sitio respondió ${res.status}. Escribe los datos a mano.`);
    const out = parseProduct(await res.text(), u.href);
    if (!out.image && !out.price && !out.name) throw new Error("No encontré datos del producto en esa página. Escribe los datos a mano.");
    return out;
  }

  const api = { parseProduct, fetchProduct, num };
  root.GastaLink = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
