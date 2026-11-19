// «Cerca de mí» (v2.4): ordena las plazas por distancia y arma enlaces de mapa centrados en tu ubicación.
// Privacidad: tu ubicación se queda en la memoria de esta pestaña (no se guarda, no se manda a ningún servidor de GastaBot).
// Las coordenadas de las plazas salen de: `center` en stores.js (Espacio y Centro) o, si no hay, de una búsqueda de su
// dirección en OpenStreetMap (Nominatim, sin clave) que se guarda 90 días en el dispositivo. Si una plaza no se puede ubicar,
// aparece sin distancia (no se inventan coordenadas). La distancia es en línea recta, no por calles.
(function (root) {
  const KEY = "gb_geo_v1", TTL = 90 * 864e5, CITY = [21.8808, -102.2961], MAX_KM = 30;
  let cache = {};
  try { cache = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { cache = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch {} };
  const rad = (d) => (d * Math.PI) / 180;
  // Distancia en km entre dos puntos [lat, lng] (fórmula de haversine)
  function km(a, b) {
    const dLat = rad(b[0] - a[0]), dLng = rad(b[1] - a[1]);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  const fmtKm = (k) => (k < 1 ? Math.max(50, Math.round((k * 1000) / 50) * 50) + " m" : (k < 10 ? k.toFixed(1) : Math.round(k)) + " km");

  // Ubicación del dispositivo (pide permiso al usuario). Devuelve { lat, lng, acc } o lanza Error con mensaje en español.
  function locate(opts = {}) {
    return new Promise((res, rej) => {
      if (!root.navigator || !navigator.geolocation) return rej(new Error("Tu navegador no permite obtener la ubicación."));
      if (root.isSecureContext === false) return rej(new Error("El navegador sólo da la ubicación en páginas seguras (https). Abre GastaBot desde su enlace https o instálala como app, o elige tu plaza a mano."));
      navigator.geolocation.getCurrentPosition(
        (p) => res({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }),
        (e) => rej(new Error(e && e.code === 1 ? "No diste permiso de ubicación. Puedes elegir tu plaza a mano." : e && e.code === 3 ? "Tardó demasiado en ubicarte. Intenta de nuevo o elige tu plaza a mano." : "No pude obtener tu ubicación. Elige tu plaza a mano.")),
        { enableHighAccuracy: false, timeout: opts.timeout || 12000, maximumAge: 120000 }
      );
    });
  }

  // Coordenadas de una plaza: `center` fijo, caché, o búsqueda de su dirección. Devuelve [lat, lng] o null.
  async function plazaCenter(id, plaza, fetchImpl) {
    if (plaza.center) return plaza.center;
    const c = cache[id]; if (c && Date.now() - c.ts < TTL && c.ll) return c.ll;
    if (!plaza.geoQ) return null;
    const f = fetchImpl || (root.fetch && root.fetch.bind(root)); if (!f) return null;
    try {
      const r = await f("https://nominatim.openstreetmap.org/search?" + new URLSearchParams({ format: "jsonv2", limit: "1", countrycodes: "mx", q: plaza.geoQ }), { headers: { Accept: "application/json" } });
      if (!r.ok) return null;
      const j = await r.json(), hit = j && j[0]; if (!hit) return null;
      const ll = [Number(hit.lat), Number(hit.lon)];
      if (!isFinite(ll[0]) || !isFinite(ll[1]) || km(ll, CITY) > MAX_KM) return null; // fuera de la ciudad: se descarta
      cache[id] = { ll, ts: Date.now() }; save(); return ll;
    } catch { return null; }
  }

  // Plazas ordenadas por distancia a `pos` ({lat,lng}). Las que no se pudieron ubicar van al final sin distancia.
  async function rank(pos, plazas, opts = {}) {
    const out = [], ids = Object.keys(plazas);
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i], p = plazas[id];
      const needNet = !p.center && !(cache[id] && Date.now() - cache[id].ts < TTL);
      if (needNet && opts.gapMs && i) await new Promise((r) => setTimeout(r, opts.gapMs)); // Nominatim pide ~1 consulta por segundo
      const ll = await plazaCenter(id, p, opts.fetchImpl);
      out.push({ id, plaza: p, ll, km: ll ? km([pos.lat, pos.lng], ll) : null });
    }
    return out.sort((a, b) => (a.km == null) - (b.km == null) || a.km - b.km);
  }

  // Enlaces (sin clave): cómo llegar a una plaza y búsqueda de un tipo de negocio cerca de tu ubicación
  // Cómo llegar: se manda la dirección (Google la resuelve mejor que unas coordenadas aproximadas de OpenStreetMap)
  const dirUrl = (plaza, ll) => "https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=" + encodeURIComponent(plaza.geoQ || (plaza.name + ", " + (plaza.address || "") + ", Aguascalientes"));
  const searchUrl = (q, pos) => pos ? "https://www.google.com/maps/search/" + encodeURIComponent(q) + "/@" + pos.lat.toFixed(5) + "," + pos.lng.toFixed(5) + ",14z" : "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q + " Aguascalientes");

  const api = { km, fmtKm, locate, plazaCenter, rank, dirUrl, searchUrl, CITY };
  root.GastaNear = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
