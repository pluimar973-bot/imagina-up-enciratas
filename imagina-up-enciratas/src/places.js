// Descubrimiento automático de tiendas con Google Places API (New) — Text Search.
// Necesitas una API key de Google Cloud con "Places API (New)" habilitada (y restringida a tu uso).
// Google NO da precios de productos: sólo datos del negocio y, a veces, priceLevel. Por eso los
// rangos por producto siguen viniendo de nuestra base (items) o de lo que capture el admin/tienda.
(function (root) {
  const FIELDS = [
    "places.id", "places.displayName", "places.types", "places.primaryTypeDisplayName", "places.formattedAddress",
    "places.websiteUri", "places.nationalPhoneNumber", "places.rating", "places.userRatingCount", "places.priceLevel",
    "places.regularOpeningHours.weekdayDescriptions", "nextPageToken"
  ].join(",");

  // Tipos de Google -> categorías de GastaBot
  const TYPE_TO_CAT = {
    clothing_store: "ropa", shoe_store: "calzado", cosmetics_store: "belleza", beauty_salon: "belleza",
    restaurant: "comida", fast_food_restaurant: "comida", meal_takeaway: "comida", food_court: "comida",
    cafe: "cafe", coffee_shop: "cafe", bakery: "postres", ice_cream_shop: "postres", dessert_shop: "postres",
    supermarket: "super", grocery_store: "super", electronics_store: "tecnologia", cell_phone_store: "tecnologia",
    home_goods_store: "hogar", furniture_store: "hogar", sporting_goods_store: "deportes", gift_shop: "regalos",
    jewelry_store: "regalos", toy_store: "juguetes", department_store: "ropa"
  };

  // Nivel de precio de Google -> rango de ticket ESTIMADO por compra (MXN). Ajusta a tu criterio.
  const PRICE_TIER = {
    PRICE_LEVEL_INEXPENSIVE: [50, 300], PRICE_LEVEL_MODERATE: [200, 900],
    PRICE_LEVEL_EXPENSIVE: [600, 2500], PRICE_LEVEL_VERY_EXPENSIVE: [1500, 6000]
  };
  const DEFAULT_RANGE = [150, 900];

  const slug = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  function mapPlace(p, plazaId) {
    const cats = [...new Set((p.types || []).map((t) => TYPE_TO_CAT[t]).filter(Boolean))];
    const [min, max] = PRICE_TIER[p.priceLevel] || DEFAULT_RANGE;
    const name = p.displayName?.text || "Sin nombre";
    return {
      id: `g-${plazaId}-${slug(name)}`, googleId: p.id, name, plaza: plazaId,
      cats: cats.length ? cats : ["ropa"], // si Google no trae categoría útil, el admin la corrige
      min, max, site: p.websiteUri || null, phone: p.nationalPhoneNumber || null,
      rating: p.rating || null, ratingCount: p.userRatingCount || null, priceLevel: p.priceLevel || null,
      hours: p.regularOpeningHours?.weekdayDescriptions || null, address: p.formattedAddress || null,
      verified: false, promo: null, source: "google", needsReview: !cats.length
    };
  }

  // Trae tiendas de una plaza. Filtra por addressHint (p. ej. "849" para Altaria) para no traer negocios de afuera.
  async function fetchPlazaStores({ apiKey, plazaId, plaza, cityName, maxPages = 3, fetchImpl = fetch }) {
    if (!apiKey) throw new Error("Falta la API key de Google Places (Ajustes).");
    const out = new Map();
    for (const q of [`tiendas en ${plaza.name} ${cityName}`, `restaurantes y cafés en ${plaza.name} ${cityName}`]) {
      let pageToken, pages = 0;
      do {
        const res = await fetchImpl("https://places.googleapis.com/v1/places:searchText", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": FIELDS },
          body: JSON.stringify({ textQuery: q, languageCode: "es", regionCode: "MX", pageSize: 20, ...(pageToken ? { pageToken } : {}) })
        });
        if (!res.ok) throw new Error(`Google Places respondió ${res.status}: ${(await res.text()).slice(0, 200)}`);
        const data = await res.json();
        for (const p of data.places || []) {
          const addr = p.formattedAddress || "";
          if (plaza.addressHint && !addr.toLowerCase().includes(plaza.addressHint.toLowerCase())) continue;
          const s = mapPlace(p, plazaId);
          out.set(s.id, s);
        }
        pageToken = data.nextPageToken; pages++;
      } while (pageToken && pages < maxPages);
    }
    return [...out.values()];
  }

  const api = { fetchPlazaStores, mapPlace, TYPE_TO_CAT, PRICE_TIER };
  root.GastaPlaces = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
