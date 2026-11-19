// Tecnología (v2.6): audífonos, cargadores, celulares y accesorios para tiendas de plaza.
// Los precios son RANGOS ESTIMADOS míos (nov-2026) por tipo de producto; no son precios de lista ni cotizaciones.
// Cambian por marca, modelo, capacidad y promoción: confirma modelo y precio en la tienda.
(function (root) {
  const D = root.GASTABOT_DATA || require("./stores.js");
  const T = (name, min, max, emoji, desc, tags) => ({ name, cat: "tecnologia", min, max, emoji, desc, kind: "solo", tags, estimated: true });
  const AUD = [
    T("Audífonos inalámbricos (earbuds Bluetooth)", 300, 1500, "🎧", "Con estuche de carga; la batería y el sonido cambian por marca", ["audifonos", "inalambricos", "bluetooth", "earbuds"]),
    T("Audífonos de diadema Bluetooth", 400, 2500, "🎧", "Almohadillas grandes, buena batería y micrófono", ["audifonos", "diadema", "bluetooth"]),
    T("Audífonos con cable", 80, 400, "🎧", "Conector 3.5 mm o USB-C, con micrófono", ["audifonos", "cable", "manos libres"])
  ];
  const CARG = [
    T("Cargador de pared USB-C 20 W", 150, 700, "🔌", "Carga rápida para celular; pregunta por la compatibilidad", ["cargador", "usb-c", "carga rapida", "20w"]),
    T("Cable USB-C de 1 m", 80, 400, "🔌", "Carga y datos; mejor si es de marca certificada", ["cable", "usb-c", "cargador"]),
    T("Batería portátil (power bank) 10,000 mAh", 350, 900, "🔋", "Da 2 a 3 cargas de un celular", ["power bank", "bateria portatil", "cargador"]),
    T("Cargador inalámbrico", 250, 900, "🔌", "Base de carga para celulares compatibles", ["cargador", "inalambrico"]),
    T("Cargador de auto USB", 120, 400, "🔌", "Para encendedor del auto, con una o dos salidas", ["cargador", "auto"])
  ];
  const CEL = [
    T("Celular Android de entrada", 2000, 4500, "📱", "Para redes, llamadas y fotos básicas", ["celular", "android", "smartphone", "entrada"]),
    T("Celular Android de gama media", 4500, 10000, "📱", "Mejor cámara, pantalla y batería", ["celular", "android", "smartphone", "gama media"]),
    T("Celular de gama alta", 12000, 30000, "📱", "Los modelos más recientes de cada marca", ["celular", "smartphone", "gama alta", "iphone"])
  ];
  const EXTRA = [
    T("Bocina Bluetooth portátil", 300, 1800, "🔊", "Resistente a salpicaduras en los modelos medios", ["bocina", "bluetooth", "speaker"]),
    T("Smartwatch o banda de actividad", 600, 6000, "⌚", "Pasos, sueño y notificaciones", ["smartwatch", "reloj", "banda"]),
    T("Funda y mica para celular", 80, 500, "📱", "Protección básica para pantalla y cuerpo", ["funda", "mica", "protector"])
  ];
  const SETS = {
    "steren-altaria": AUD.concat(CARG, EXTRA), "steren-espacio": AUD.concat(CARG, EXTRA),
    "samsung-altaria": [T("Galaxy Buds (audífonos inalámbricos)", 1200, 3200, "🎧", "Audífonos true wireless de Samsung", ["audifonos", "buds", "samsung"]), T("Cargador Samsung 25 W", 350, 800, "🔌", "Carga rápida USB-C", ["cargador", "samsung", "25w"])].concat(CEL.slice(0, 2), [EXTRA[1]]),
    "huawei-altaria": [T("Huawei FreeBuds (audífonos inalámbricos)", 700, 2800, "🎧", "Audífonos true wireless", ["audifonos", "freebuds", "huawei"])].concat(CEL.slice(0, 2), [EXTRA[1], CARG[0]]),
    "macstore-altaria": [T("AirPods (según modelo)", 2400, 6800, "🎧", "Audífonos inalámbricos de Apple", ["audifonos", "airpods", "apple"]), T("iPhone (según modelo)", 12000, 32000, "📱", "Cambia mucho por modelo y capacidad", ["iphone", "celular", "apple"]), T("Cargador USB-C 20 W Apple", 450, 800, "🔌", "Carga rápida", ["cargador", "apple", "usb-c"]), T("Cable USB-C a Lightning", 300, 700, "🔌", "Carga y datos", ["cable", "lightning", "apple"])],
    "telcel-altaria": [T("Celular de entrada con plan o prepago", 1500, 4500, "📱", "Equipos Telcel; el precio cambia con el plan", ["celular", "telcel", "prepago", "plan"]), T("Celular de gama media con plan", 4500, 12000, "📱", "Con renta mensual o pago de contado", ["celular", "telcel", "plan"]), AUD[0], CARG[1]],
    "liverpool-altaria": AUD.concat(CARG.slice(0, 3), CEL, [EXTRA[0], EXTRA[1]]), "liverpool-villasuncion": AUD.concat(CARG.slice(0, 3), CEL, [EXTRA[0], EXTRA[1]]),
    "coppel-altaria": AUD.slice(0, 2).concat(CARG.slice(0, 3), CEL.slice(0, 2), [EXTRA[0]]), "coppel-espacio": AUD.slice(0, 2).concat(CARG.slice(0, 3), CEL.slice(0, 2), [EXTRA[0]]),
    "sears-altaria": AUD.slice(0, 2).concat(CARG.slice(0, 3), CEL.slice(0, 2), [EXTRA[0]]),
    "fashioncel-altaria": AUD.concat(CARG, [EXTRA[2]]), "happy-case-altaria": [EXTRA[2], CARG[1], CARG[0], AUD[2]], "longcase-altaria": [EXTRA[2], CARG[1], CARG[0]], "la-casa-de-las-carcasas-altaria": [EXTRA[2], CARG[1], CARG[0]]
  };
  const NOTE = "Tecnología: rangos ESTIMADOS por mí (nov-2026) por tipo de producto; confirma modelo y precio en la tienda.";
  let n = 0;
  // Limpieza: etiquetas de celular mal puestas en calzado/ropa (p. ej. «Galaxy» en un tenis)
  for (const s of D.STORES) for (const i of s.items || []) if (i.cat !== "tecnologia" && i.tags) i.tags = i.tags.filter((g) => !["celular", "smartphone", "samsung"].includes(g));
  for (const s of D.STORES) {
    const list = SETS[s.id]; if (!list) continue;
    const have = new Set((s.items || []).map((i) => i.name));
    const add = list.filter((i) => !have.has(i.name)).map((i) => ({ ...i }));
    s.items = (s.items || []).concat(add); n += add.length;
    s.cats = [...new Set((s.cats || []).concat(["tecnologia"]))]; s.menu = true;
    s.menuNote = (s.menuNote ? s.menuNote + " " : "") + NOTE;
  }
  const api = { count: n };
  root.GASTABOT_TECNO = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
