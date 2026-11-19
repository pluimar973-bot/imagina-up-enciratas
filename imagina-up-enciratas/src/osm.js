// Descubrimiento GRATIS (sin tarjeta ni API key) con OpenStreetMap vía Overpass API.
// Límite: en México muchas tiendas de plazas no están mapeadas, así que trae MENOS que Google.
// Útil para completar la base; revisa lo que llegue (rangos = estimados por categoría).
(function (root) {
  const ENDPOINT = "https://overpass-api.de/api/interpreter";

  // Etiquetas de OSM -> categoría de GastaBot
  const SHOP_TO_CAT = {
    clothes: "ropa", fashion: "ropa", boutique: "ropa", department_store: "ropa", shoes: "calzado",
    perfumery: "perfumes", cosmetics: "belleza", beauty: "belleza", hairdresser: "belleza",
    supermarket: "super", convenience: "super", bakery: "postres", confectionery: "postres", ice_cream: "postres",
    electronics: "tecnologia", mobile_phone: "tecnologia", computer: "tecnologia",
    furniture: "hogar", houseware: "hogar", interior_decoration: "decoracion", variety_store: "regalos",
    sports: "deportes", gift: "regalos", jewelry: "regalos", toys: "juguetes", games: "entretenimiento",
    stationery: "papeleria", books: "papeleria", pet: "mascotas"
  };
  const AMENITY_TO_CAT = { restaurant: "comida", fast_food: "comida", food_court: "comida", bar: "comida", pub: "comida", cafe: "cafe", ice_cream: "postres", cinema: "entretenimiento" };

  // Rango de ticket ESTIMADO por categoría (MXN). Ajusta a tu criterio.
  const CAT_RANGE = {
    ropa: [250, 1200], calzado: [500, 1800], perfumes: [600, 3000], belleza: [150, 900], comida: [100, 400], cafe: [40, 110],
    postres: [40, 150], super: [150, 1200], tecnologia: [150, 3000], hogar: [300, 3000], decoracion: [150, 800], deportes: [500, 2500],
    regalos: [50, 600], juguetes: [150, 1500], entretenimiento: [80, 400], papeleria: [50, 500], mascotas: [100, 800]
  };

  const slug = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const esc = (s) => String(s).replace(/[\\"]/g, "");

  function buildQuery(plaza) {
    const around = plaza.center ? `nwr(around:350,${plaza.center[0]},${plaza.center[1]})` : null;
    const wanted = `["name"]["shop"];`, amen = `["name"]["amenity"~"restaurant|fast_food|food_court|bar|pub|cafe|ice_cream|cinema"];`;
    const parts = [
      `nwr["shop"="mall"]["name"~"${esc(plaza.osmName)}",i]->.m;`,
      `.m map_to_area->.a;`,
      `(`,
      `  nwr(area.a)${wanted}`, `  nwr(area.a)${amen}`,
      `  nwr(around.m:200)${wanted}`, `  nwr(around.m:200)${amen}`,
      around ? `  ${around}${wanted}\n  ${around}${amen}` : "",
      `);`
    ];
    return `[out:json][timeout:25];\n${parts.filter(Boolean).join("\n")}\nout tags center 300;`;
  }

  function mapElement(el, plazaId) {
    const t = el.tags || {};
    const name = t.name;
    if (!name || t.shop === "mall") return null;
    const cat = SHOP_TO_CAT[t.shop] || AMENITY_TO_CAT[t.amenity];
    if (!cat) return null;
    const [min, max] = CAT_RANGE[cat];
    return {
      id: `o-${plazaId}-${slug(name)}`, name, plaza: plazaId, cats: [cat], min, max,
      site: t.website || t["contact:website"] || null, phone: t.phone || t["contact:phone"] || null,
      hours: t.opening_hours ? [t.opening_hours] : null, verified: false, promo: null, source: "osm"
    };
  }

  async function fetchPlazaStores({ plazaId, plaza, fetchImpl = fetch }) {
    const res = await fetchImpl(ENDPOINT, {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "data=" + encodeURIComponent(buildQuery(plaza))
    });
    if (!res.ok) throw new Error(`Overpass respondió ${res.status}. Intenta de nuevo en un minuto.`);
    const data = await res.json();
    const out = new Map();
    for (const el of data.elements || []) { const s = mapElement(el, plazaId); if (s) out.set(s.id, s); }
    return [...out.values()];
  }

  const api = { fetchPlazaStores, buildQuery, mapElement, SHOP_TO_CAT, AMENITY_TO_CAT, CAT_RANGE };
  root.GastaOSM = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
