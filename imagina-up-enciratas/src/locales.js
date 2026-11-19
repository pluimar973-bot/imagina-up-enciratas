// Referencias ESTIMADAS para Precios locales (v2.3). Son rangos aproximados míos (nov-2026) a partir de precios
// de lista en México; NO son cotizaciones ni datos oficiales: cambian por negocio, calidad y temporada.
// Sirven para tener una idea antes de preguntar. Los precios reales de la gente (con fecha) aparecen arriba.
// Formato: [categoría, producto, unidad, mínimo, máximo, tipo de foto, [dónde buscarlo], nota opcional]
(function (root) {
  // Dónde buscarlo: etiqueta + búsqueda en el mapa. Sólo hay nombres propios donde una fuente pública los confirma.
  const W = {
    mad: ["Maderías y aserraderos", "maderería"], fer: ["Ferreterías", "ferretería"], mat: ["Materiales para construcción", "materiales para construcción"],
    hd: ["Home Depot", "Home Depot"], ceda: ["Central de Abasto de Aguascalientes", "Central de Abasto"], teran: ["Mercado Jesús Terán", "Mercado Jesús Terán"],
    merc: ["Mercados municipales", "mercado municipal"], abar: ["Abarrotes de barrio", "abarrotes"], sup: ["Súper y mayoreo", "supermercado"],
    torti: ["Tortillerías", "tortillería"], pan: ["Panaderías", "panadería"], carn: ["Carnicerías", "carnicería"], poll: ["Pollerías", "pollería"], verd: ["Verdulerías y fruterías", "verdulería"],
    crem: ["Cremerías", "cremería"], pint: ["Tiendas de pinturas", "tienda de pinturas"], plom: ["Casas de plomería", "materiales de plomería"], herr: ["Herrerías y aceros", "herrería"],
    vidr: ["Vidrierías", "vidriería"], tapi: ["Tapicerías", "tapicería"], carp: ["Carpinterías", "carpintería"], mecan: ["Talleres mecánicos", "taller mecánico"],
    refac: ["Refaccionarias", "refaccionaria"], llant: ["Llanteras", "llantera"], tela: ["Mercerías y casas de telas", "mercería telas"], unif: ["Tiendas de uniformes", "uniformes escolares"],
    plomero: ["Plomeros (servicio)", "plomero"], elec: ["Electricistas", "electricista"], zap: ["Reparación de calzado", "reparación de calzado"], cerr: ["Cerrajerías", "cerrajería"],
    cost: ["Costureras y sastrerías", "sastrería costura"], gas: ["Gaseras", "gas LP"], hielo: ["Hielo y depósitos", "venta de hielo"], tinaco: ["Casas de materiales y plomería", "tinacos"]
  };
  const L = [
    // ---- Abarrotes ----
    ["abarrotes", "Huevo blanco", "kg", 38, 55, "huevo", ["abar", "sup", "ceda"], "En Central de Abasto suele salir más barato por caja"],
    ["abarrotes", "Tortilla de maíz", "kg", 20, 28, "pan", ["torti", "abar"]],
    ["abarrotes", "Frijol", "kg", 30, 45, "granos", ["abar", "sup", "ceda"]], ["abarrotes", "Arroz", "kg", 25, 38, "granos", ["abar", "sup", "ceda"]],
    ["abarrotes", "Azúcar estándar", "kg", 24, 34, "granos", ["abar", "sup", "ceda"]], ["abarrotes", "Harina de maíz (Maseca)", "kg", 18, 26, "granos", ["abar", "sup"]],
    ["abarrotes", "Harina de trigo", "kg", 20, 32, "granos", ["abar", "sup"]], ["abarrotes", "Sal", "kg", 12, 20, "granos", ["abar", "sup"]],
    ["abarrotes", "Aceite vegetal", "litro", 38, 58, "aceite", ["abar", "sup"]], ["abarrotes", "Leche entera", "litro", 24, 31, "leche", ["abar", "sup"]],
    ["abarrotes", "Queso fresco", "kg", 120, 190, "leche", ["crem", "merc", "sup"]], ["abarrotes", "Crema", "litro", 60, 95, "leche", ["crem", "sup"]],
    ["abarrotes", "Pan blanco (bolillo)", "pieza", 2.5, 5, "pan", ["pan", "abar"]], ["abarrotes", "Pan dulce", "pieza", 8, 18, "pan", ["pan"]],
    ["abarrotes", "Pan de caja grande", "pieza", 45, 70, "pan", ["abar", "sup"]], ["abarrotes", "Pasta para sopa", "paquete", 8, 15, "granos", ["abar", "sup"]],
    ["abarrotes", "Atún en lata", "pieza", 17, 30, "granos", ["abar", "sup"]], ["abarrotes", "Refresco 600 ml", "pieza", 17, 25, "refresco", ["abar", "sup"]],
    ["abarrotes", "Refresco 2 litros", "pieza", 30, 45, "refresco", ["abar", "sup"]], ["abarrotes", "Agua purificada 1.5 L", "pieza", 12, 19, "refresco", ["abar", "sup"]],
    ["abarrotes", "Garrafón de agua 20 L (recarga)", "pieza", 30, 50, "refresco", ["abar", "hielo"]], ["abarrotes", "Papel higiénico 12 rollos", "paquete", 70, 125, "super", ["sup", "abar"]],
    ["abarrotes", "Detergente en polvo", "kg", 38, 70, "super", ["sup", "abar"]], ["abarrotes", "Jabón para trastes", "litro", 40, 75, "super", ["sup", "abar"]],
    // ---- Mercado y mayoreo ----
    ["mercado", "Jitomate", "kg", 18, 40, "verdura", ["verd", "teran", "ceda"]], ["mercado", "Cebolla blanca", "kg", 18, 35, "verdura", ["verd", "teran", "ceda"]],
    ["mercado", "Papa", "kg", 22, 40, "verdura", ["verd", "teran", "ceda"]], ["mercado", "Limón", "kg", 20, 60, "verdura", ["verd", "teran", "ceda"], "Cambia mucho por temporada"],
    ["mercado", "Aguacate Hass", "kg", 55, 115, "verdura", ["verd", "teran", "ceda"], "Cambia mucho por temporada"], ["mercado", "Chile jalapeño", "kg", 30, 65, "verdura", ["verd", "teran", "ceda"]],
    ["mercado", "Zanahoria", "kg", 15, 28, "verdura", ["verd", "teran", "ceda"]], ["mercado", "Plátano", "kg", 20, 34, "verdura", ["verd", "teran", "ceda"]],
    ["mercado", "Manzana", "kg", 40, 75, "verdura", ["verd", "teran", "ceda"]], ["mercado", "Naranja", "kg", 15, 32, "verdura", ["verd", "teran", "ceda"]],
    ["mercado", "Pechuga de pollo", "kg", 95, 155, "carne", ["poll", "carn", "sup"]], ["mercado", "Pierna y muslo de pollo", "kg", 60, 100, "carne", ["poll", "carn", "sup"]],
    ["mercado", "Carne molida de res", "kg", 150, 220, "carne", ["carn", "sup"]], ["mercado", "Bistec de res", "kg", 190, 290, "carne", ["carn", "sup"]],
    ["mercado", "Chuleta de cerdo", "kg", 110, 170, "carne", ["carn", "sup"]],
    // ---- Materiales ----
    ["materiales", "Tablón de pino 2x4x8 pies", "pieza", 140, 280, "madera", ["mad", "hd", "mat"], "Directorios en línea listan Maderería Los Bosques de Aguascalientes y Maderera del Nazas (Av. de la Convención Sur 1427); confirma que sigan abiertas"],
    ["materiales", "Tabla de pino 1x8x8 pies", "pieza", 150, 290, "madera", ["mad", "hd", "mat"]], ["materiales", "Polín 4x4x8 pies", "pieza", 160, 320, "madera", ["mad", "mat"]],
    ["materiales", "Triplay de pino 6 mm (1.22x2.44 m)", "pieza", 330, 480, "madera", ["mad", "hd", "mat"], "Referencia en línea: triplay 5 mm desde unos $377 (MercadoLibre, nov-2026)"],
    ["materiales", "Triplay de pino 12 mm (1.22x2.44 m)", "pieza", 650, 950, "madera", ["mad", "hd", "mat"], "Referencia en línea: unos $865 de pino importado (MercadoLibre, nov-2026)"],
    ["materiales", "Triplay de pino 15 mm (1.22x2.44 m)", "pieza", 620, 1150, "madera", ["mad", "hd", "mat"], "Referencia en línea: oferta de $620 en Home Depot (ago-2026)"],
    ["materiales", "MDF 15 mm (1.22x2.44 m)", "pieza", 550, 950, "madera", ["mad", "hd", "mat"]], ["materiales", "Cemento gris 50 kg", "bulto", 230, 300, "cemento", ["mat", "hd", "fer"]],
    ["materiales", "Mortero 50 kg", "bulto", 130, 200, "cemento", ["mat", "hd"]], ["materiales", "Cal hidratada 25 kg", "bulto", 90, 150, "cemento", ["mat"]],
    ["materiales", "Yeso 40 kg", "bulto", 100, 170, "cemento", ["mat", "hd"]], ["materiales", "Arena", "m³", 350, 650, "cemento", ["mat"], "Por viaje; el flete cambia por distancia"],
    ["materiales", "Grava", "m³", 450, 750, "cemento", ["mat"], "Por viaje; el flete cambia por distancia"], ["materiales", "Tabique rojo recocido", "millar", 4000, 7500, "cemento", ["mat"]],
    ["materiales", "Block de concreto 15x20x40", "pieza", 12, 22, "cemento", ["mat", "hd"]], ["materiales", "Varilla 3/8\" (12 m)", "pieza", 190, 290, "varilla", ["mat", "herr", "hd"]],
    ["materiales", "Alambrón", "kg", 22, 34, "varilla", ["mat", "herr"]], ["materiales", "Alambre recocido", "kg", 28, 45, "varilla", ["mat", "fer"]], ["materiales", "Clavos", "kg", 35, 65, "varilla", ["fer", "mat", "hd"]],
    ["materiales", "Malla electrosoldada 6x6-10/10", "hoja", 650, 1050, "varilla", ["mat", "herr"]], ["materiales", "Perfil tubular (PTR) 6 m", "pieza", 300, 650, "varilla", ["herr"]],
    ["materiales", "Tubo PVC sanitario 4\" (6 m)", "pieza", 190, 330, "tuberia", ["plom", "hd", "mat"]], ["materiales", "Tubo PVC hidráulico 1/2\" (6 m)", "pieza", 80, 160, "tuberia", ["plom", "hd", "mat"]],
    ["materiales", "Tinaco 1,100 L", "pieza", 1700, 2900, "tuberia", ["tinaco", "hd", "mat"]], ["materiales", "Pintura vinílica 19 L", "cubeta", 800, 1900, "pintura", ["pint", "hd", "fer"]],
    ["materiales", "Impermeabilizante 19 L", "cubeta", 900, 2000, "pintura", ["pint", "hd", "mat"]], ["materiales", "Esmalte", "galón", 350, 700, "pintura", ["pint", "fer", "hd"]],
    ["materiales", "Thinner", "litro", 40, 75, "pintura", ["pint", "fer"]], ["materiales", "Vidrio claro 3 mm", "m²", 300, 580, "varilla", ["vidr"]],
    ["materiales", "Cable calibre 12 (100 m)", "rollo", 1200, 1900, "varilla", ["fer", "hd"]], ["materiales", "Foco LED 9 W", "pieza", 25, 65, "varilla", ["fer", "sup", "hd"]],
    // ---- Servicios ----
    ["servicios", "Tapizar silla de comedor", "pieza", 250, 480, "servicio", ["tapi"], "Normalmente incluye mano de obra y espuma; la tela cambia el precio"],
    ["servicios", "Tapizar sala de 3 piezas", "trabajo", 4500, 9500, "servicio", ["tapi"], "Depende de la tela y del estado del mueble"],
    ["servicios", "Reja o portón de herrería", "m²", 1200, 2400, "servicio", ["herr"]], ["servicios", "Plomero: reparar fuga", "trabajo", 300, 750, "servicio", ["plomero"]],
    ["servicios", "Electricista: visita", "trabajo", 300, 750, "servicio", ["elec"]], ["servicios", "Pintar paredes (mano de obra)", "m²", 40, 95, "servicio", ["pint"]],
    ["servicios", "Cambio de chapa o llave", "trabajo", 150, 450, "servicio", ["cerr"]], ["servicios", "Dobladillo o ajuste de ropa", "pieza", 40, 100, "servicio", ["cost"]],
    ["servicios", "Cambio de suela de calzado", "par", 150, 320, "servicio", ["zap"]], ["servicios", "Carpintería: mueble a la medida", "m²", 2500, 6000, "servicio", ["carp"], "Muy variable: pide dos o tres cotizaciones con el mismo diseño"],
    ["servicios", "Corte de madera o triplay", "corte", 20, 70, "servicio", ["mad", "carp"]],
    // ---- Refacciones ----
    ["refacciones", "Aceite de motor sintético 5W-30", "litro", 120, 230, "refaccion", ["refac", "sup", "mecan"]], ["refacciones", "Filtro de aceite", "pieza", 70, 210, "refaccion", ["refac"]],
    ["refacciones", "Balatas delanteras", "juego", 350, 950, "refaccion", ["refac", "mecan"]], ["refacciones", "Batería de auto 12 V", "pieza", 1600, 2900, "refaccion", ["refac", "sup"]],
    ["refacciones", "Bujías", "pieza", 90, 230, "refaccion", ["refac"]], ["refacciones", "Llanta rin 14-15", "pieza", 1100, 2300, "refaccion", ["llant"]],
    ["refacciones", "Anticongelante", "galón", 130, 270, "refaccion", ["refac", "sup"]], ["refacciones", "Limpiaparabrisas", "par", 150, 380, "refaccion", ["refac", "sup"]],
    // ---- Telas y uniformes ----
    ["telas", "Manta cruda", "metro", 25, 48, "tela", ["tela"]], ["telas", "Popelina", "metro", 35, 70, "tela", ["tela"]], ["telas", "Mezclilla", "metro", 80, 160, "tela", ["tela"]],
    ["telas", "Gabardina", "metro", 60, 115, "tela", ["tela"]], ["telas", "Lycra", "metro", 70, 145, "tela", ["tela"]], ["telas", "Forro", "metro", 25, 55, "tela", ["tela"]],
    ["telas", "Tela para tapicería", "metro", 120, 380, "tela", ["tela", "tapi"]], ["telas", "Pantalón o falda de uniforme escolar", "pieza", 250, 480, "tela", ["unif"]],
    ["telas", "Bata blanca", "pieza", 250, 480, "tela", ["unif", "tela"]],
    // ---- Otros ----
    ["otros", "Gas LP (tanque de 20 kg)", "recarga", 450, 580, "refaccion", ["gas"], "El gas LP tiene precio máximo regulado; cambia cada semana"], ["otros", "Hielo", "bolsa", 25, 50, "refresco", ["hielo", "abar"]]
  ];
  const ITEMS = L.map((r, i) => ({ id: "est-" + i, category: r[0], product: r[1], unit: r[2], min: r[3], max: r[4], type: r[5], where: r[6].map((k) => ({ k, label: W[k][0], q: W[k][1] })), note: r[7] || "" }));
  const api = { ITEMS, W, DATE: "2026-11-19" };
  root.GASTABOT_LOCALES = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
