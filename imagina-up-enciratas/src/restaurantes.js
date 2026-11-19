// Restaurantes y comida local de Aguascalientes (v2.5): lugares con nombre y tipos de negocio, baratos y variados.
// Honestidad de los datos:
//  - Los lugares CON NOMBRE están mencionados en fuentes públicas (se indica cuál en cada uno). De ellos sólo se toma qué tipo de comida
//    se les menciona; los PRECIOS NO son los de su menú: son rangos ESTIMADOS míos (nov-2026) para ese platillo en la ciudad.
//  - Los «tipos de negocio» (taquerías, fondas, loncherías…) NO son un lugar específico: juntan lo que suelen ofrecer y su rango de precio.
//  - Todo va marcado «Estimado» (~) y «?» (por confirmar). Confirma en el lugar antes de ir.
(function (root) {
  const D = root.GASTABOT_DATA || require("./stores.js");
  D.PLAZAS.locales = {
    name: "Restaurantes locales", city: "aguascalientes", virtual: true,
    aliases: ["restaurantes locales", "comida local", "negocios de comida", "fonda", "fondas", "taqueria", "taquerias", "cenaduria", "cenadurias"],
    site: null, address: "Varias zonas de Aguascalientes", osmName: null
  };

  // E(nombre, mín, máx, emoji, descripción, etiquetas, tipo, categoría)
  const E = (name, min, max, emoji, desc, tags = [], kind = "solo", cat = "comida") => ({ name, cat, min, max, emoji, desc, kind, tags, estimated: true });
  const REL = "Precios ESTIMADOS por mí (nov-2026) para este tipo de platillo; no son el menú del negocio. Confirma en el lugar.";

  // [id, nombre, color, fuente, dirección o null, mención (qué se dice del lugar), items]
  const NAMED = [
    ["birria-los-toriles", "Birria Los Toriles", "#8C3B1E", "Mexico News Daily (State by Plate: birria estilo Aguascalientes)", null,
      "Birriería de Aguascalientes; birria estilo Ags, con el consomé aparte.", [
      E("Tacos de birria (orden de 3)", 75, 130, "🌮", "Tres tacos de birria de borrego; el consomé se sirve aparte", ["birria", "tacos", "borrego"], "combo"),
      E("Plato de birria con consomé", 110, 180, "🍲", "Porción de birria con tortillas, cebolla, cilantro y salsa", ["birria", "plato", "consome"], "combo"),
      E("Consomé de birria", 35, 65, "🥣", "Caldo de la cocción, con chile y limón", ["consome", "birria", "caldo"], "solo")]],
    ["las-planchitas", "Las Planchitas", "#9A5B2A", "Grupo Animal (7 lugares para comer en Aguascalientes)", null,
      "Barbacoa: se recomiendan los tacos, el consomé y la torta de barbacoa.", [
      E("Tacos de barbacoa (orden de 3)", 60, 110, "🌮", "Barbacoa de borrego en tortilla de maíz", ["barbacoa", "tacos", "borrego"], "combo"),
      E("Torta de barbacoa", 55, 95, "🥪", "Bolillo relleno de barbacoa", ["torta", "barbacoa"], "combo"),
      E("Consomé de barbacoa", 35, 65, "🥣", "Caldo de barbacoa con garbanzo", ["consome", "barbacoa", "caldo"], "solo")]],
    ["carnitas-mora", "Carnitas Mora", "#B5651D", "Grupo Animal (7 lugares para comer en Aguascalientes)", null,
      "Carnitas: tacos de carnitas.", [
      E("Tacos de carnitas (orden de 3)", 60, 105, "🌮", "Cerdo cocido en su grasa, con cebolla y cilantro", ["carnitas", "tacos", "cerdo"], "combo"),
      E("Carnitas, ¼ de kilo", 80, 130, "🥩", "Surtida o maciza, con tortillas y salsa", ["carnitas", "cerdo", "kilo"], "combo"),
      E("Torta de carnitas", 55, 90, "🥪", "Bolillo con carnitas y salsa", ["torta", "carnitas"], "solo")]],
    ["lechon-pascualito", "Lechón Pascualito", "#A4442A", "Grupo Animal (7 lugares para comer en Aguascalientes)", null,
      "Lechón (cerdo joven al horno), platillo muy consumido en Ags.", [
      E("Torta de lechón", 60, 110, "🥪", "Bolillo con lechón y salsa", ["torta", "lechon", "cerdo"], "combo"),
      E("Tacos de lechón (orden de 3)", 70, 120, "🌮", "Lechón en tortilla de maíz", ["lechon", "tacos", "cerdo"], "combo")]],
    ["taqueando", "Taqueando", "#C2571A", "Tus Buenas Noticias (mejores tacos en fin de semana, ago-2025)", "Av. Francisco I. Madero 479, Zona Centro",
      "Taquería en el Centro.", [
      E("Tacos (orden de 3)", 60, 110, "🌮", "Tacos de la casa; pregunta por los guisos del día", ["tacos", "taqueria"], "combo"),
      E("Quesadilla con carne", 50, 90, "🧀", "Tortilla con queso y carne", ["quesadilla", "queso"], "solo")]],
    ["reyes-del-taco-central", "Los Reyes del Taco Central", "#B8441B", "Tus Buenas Noticias (mejores tacos en fin de semana, ago-2025)", null,
      "Taquería: tacos de carne asada.", [
      E("Tacos de carne asada (orden de 3)", 60, 105, "🌮", "Carne asada en tortilla de maíz", ["tacos", "asada", "carne asada"], "combo"),
      E("Taco de carne asada (pieza)", 20, 35, "🌮", "Una pieza, para completar", ["taco", "asada"], "solo")]],
    ["tacos-manuel", "Tacos Manuel", "#A8431F", "Tus Buenas Noticias (mejores tacos en fin de semana, ago-2025)", null,
      "Taquería.", [
      E("Tacos (orden de 3)", 55, 100, "🌮", "Orden de tacos de la casa", ["tacos", "taqueria"], "combo")]],
    ["cenaduria-esthela", "Cenaduría Esthela", "#7A3E24", "Carta.menu (opiniones de comensales)", null,
      "Cenaduría de comida típica; según comensales el pozole se acaba temprano.", [
      E("Pozole", 75, 120, "🍲", "Caldo de maíz con carne, lechuga, rábano y tostadas", ["pozole", "caldo"], "combo"),
      E("Enchiladas (orden)", 75, 120, "🫔", "Enchiladas típicas, con crema y queso", ["enchiladas"], "combo"),
      E("Tostadas (orden de 2)", 45, 80, "🥙", "Tostadas con pollo o carne", ["tostadas"], "solo")]],
    ["restaurant-mitla", "Restaurant Mitla", "#8A5A2B", "Carta.menu (opiniones de comensales)", null,
      "Restaurante de cocina típica mexicana, descrito como más asequible.", [
      E("Comida del día (completa)", 90, 150, "🍽️", "Sopa, plato fuerte, arroz y tortillas; confirma qué hay hoy", ["comida corrida", "menu del dia", "comida"], "combo"),
      E("Plato fuerte mexicano", 85, 140, "🍛", "Guisado típico con arroz y frijoles", ["guisado", "plato"], "solo")]],
    ["gorditas-mis-hermanas", "Gorditas Mis Hermanas", "#9C6B2E", "Uber Eats (listado de Aguascalientes)", null,
      "Gorditas; aparece en reparto a domicilio.", [
      E("Gorditas (orden de 3)", 60, 100, "🫓", "Masa de maíz rellena de guisado o chicharrón", ["gorditas", "chicharron"], "combo"),
      E("Gordita (pieza)", 20, 35, "🫓", "Una pieza rellena a elegir", ["gordita"], "solo")]],
    ["taquitos-barbacoa-las-margaritas", "Taquitos de Barbacoa Las Margaritas", "#9A5B2A", "Uber Eats (listado de Aguascalientes)", null,
      "Taquitos de barbacoa; aparece en reparto a domicilio.", [
      E("Taquitos de barbacoa (orden)", 55, 95, "🌮", "Taquitos de barbacoa con cebolla y salsa", ["barbacoa", "taquitos"], "combo"),
      E("Consomé", 30, 55, "🥣", "Caldo de barbacoa", ["consome", "barbacoa"], "solo")]],
    ["tacos-los-mixes", "Desayunos y Tacos Los Mixes", "#B06A22", "Uber Eats (listado de Aguascalientes)", null,
      "Desayunos y tacos; aparece en reparto a domicilio.", [
      E("Desayuno (chilaquiles o huevos)", 65, 110, "🍳", "Con frijoles y café; confirma la carta del día", ["desayuno", "chilaquiles", "huevos"], "combo"),
      E("Tacos (orden de 3)", 55, 95, "🌮", "Tacos de guisado o carne", ["tacos"], "combo")]]
  ];

  // Tipos de negocio (no son un lugar específico)
  const GEN = [
    ["tacos-barrio", "Tacos y antojitos de barrio (tipo de negocio)", "#C2571A", "Taquerías, puestos y antojitos: tacos al pastor, de guisado («de color»), de canasta, quesadillas, flautas, sopes y burritos.", [
      E("Tacos al pastor (orden de 3)", 45, 90, "🌮", "Cerdo adobado con piña, cebolla y cilantro", ["pastor", "tacos", "taquerias"], "combo"),
      E("Tacos de guisado «de color» (orden de 3)", 40, 75, "🌮", "Picadillo, rajas con crema, papas con chorizo o huevo en salsa", ["guisado", "tacos", "color"], "combo"),
      E("Tacos de canasta (orden de 5)", 35, 60, "🌮", "Papa, frijol o chicharrón, suaves y baratos", ["canasta", "tacos"], "solo"),
      E("Quesadilla", 35, 70, "🧀", "Con queso y guisado, a la plancha", ["quesadilla", "queso"], "solo"),
      E("Flautas o taquitos dorados (orden)", 55, 90, "🌯", "Tortilla enrollada y frita con crema y salsa", ["flautas", "taquitos dorados"], "combo"),
      E("Sopes (orden de 2)", 45, 80, "🫓", "Masa gruesa con frijol, guisado, lechuga y queso", ["sopes"], "solo"),
      E("Burrito de guisado", 45, 80, "🌯", "Tortilla de harina con guisado a elegir", ["burrito"], "solo")]],
    ["fonda-corrida", "Fondas y comida corrida (tipo de negocio)", "#8A5A2B", "Menú del día con sopa, guisado, arroz, frijoles y agua: de lo más barato para comer completo.", [
      E("Comida corrida completa", 80, 140, "🍽️", "Sopa, arroz, guisado del día, frijoles, tortillas y agua", ["comida corrida", "menu del dia", "comida"], "combo"),
      E("Guisado con arroz y frijoles", 65, 110, "🍛", "Plato fuerte sin sopa ni postre", ["guisado", "arroz"], "solo"),
      E("Sopa del día", 30, 55, "🥣", "Sopa de pasta, arroz o verduras", ["sopa"], "solo"),
      E("Chiles rellenos con arroz", 90, 150, "🫑", "Chile relleno de queso o picadillo en caldillo", ["chile relleno", "chiles rellenos"], "combo"),
      E("Caldo de pollo", 70, 110, "🍲", "Con verduras, arroz y tortillas", ["caldo", "pollo"], "combo")]],
    ["fin-de-semana", "Pozole, menudo y birria de fin de semana (tipo de negocio)", "#8C3B1E", "Cenadurías y birriería que sacan estos caldos y platos fuertes, sobre todo sábado y domingo.", [
      E("Pozole rojo o de lengua", 80, 160, "🍲", "Caldo de maíz con carne; el de lengua cuesta más", ["pozole", "lengua"], "combo"),
      E("Menudo", 80, 130, "🍲", "Caldo de pancita con chile, orégano y limón", ["menudo", "mondongo"], "combo"),
      E("Birria al plato", 110, 180, "🥘", "Con consomé, tortillas y salsa", ["birria", "plato"], "combo"),
      E("Tacos de birria (orden de 3)", 75, 130, "🌮", "Con consomé aparte", ["birria", "tacos"], "combo")]],
    ["tortas-lonches", "Tortas, lonches y hot dogs (tipo de negocio)", "#A8431F", "Loncherías y carritos: tortas, hot dogs y hamburguesas de carrito, de las opciones más económicas.", [
      E("Torta de milanesa o jamón", 55, 95, "🥪", "Bolillo con carne, aguacate, jitomate y frijol", ["torta", "milanesa", "jamon"], "combo"),
      E("Torta de carnitas o barbacoa", 55, 90, "🥪", "Bolillo con guisado de carne", ["torta", "carnitas", "barbacoa"], "combo"),
      E("Hot dog de carrito", 25, 50, "🌭", "Salchicha con cebolla, jitomate, mayonesa y catsup", ["hot dog", "hotdog"], "solo"),
      E("Jocho (hot dog con tocino)", 40, 70, "🌭", "Salchicha envuelta en tocino con aderezos", ["jocho", "hot dog", "tocino"], "solo"),
      E("Hamburguesa de carrito", 45, 80, "🍔", "Con carne, jamón, queso y verdura", ["hamburguesa", "carrito"], "solo")]],
    ["gorditas-tamales", "Gorditas, chiqueadas y tamales (tipo de negocio)", "#9C6B2E", "Puestos y cocinas de masa: gorditas (en Ags, «chiqueadas»), tamales y atole.", [
      E("Gorditas chiqueadas (orden de 3)", 60, 100, "🫓", "De chicharrón, carnitas, queso o guisado", ["gorditas", "chiqueadas", "chicharron"], "combo"),
      E("Tamales (orden de 2)", 30, 55, "🫔", "Rajas con queso, puerco o dulce", ["tamales", "tamal"], "solo"),
      E("Atole o champurrado (vaso)", 20, 35, "☕", "Para acompañar el tamal", ["atole", "champurrado"], "solo", "cafe")]],
    ["esquites-antojos", "Esquites, elotes y bebidas típicas (tipo de negocio)", "#B8A21E", "Puestos de plaza y de esquina: chascas (esquites), elotes y bebidas como tejuino y aguas frescas.", [
      E("Vaso de esquites o chascas", 30, 55, "🥣", "Granos de elote con mayonesa, queso y chile", ["esquites", "chascas", "chaskas"], "solo"),
      E("Elote asado o hervido", 25, 45, "🌽", "En mazorca con mayonesa, queso y chile", ["elote", "mazorca"], "solo"),
      E("Tejuino (vaso)", 20, 40, "🥤", "Bebida fermentada de maíz con limón y sal", ["tejuino"], "solo", "cafe"),
      E("Agua fresca (vaso grande)", 20, 35, "🥤", "Horchata, jamaica o limón", ["agua fresca", "horchata", "jamaica"], "solo", "cafe")]],
    ["pollo-asado", "Pollo asado y rostizado (tipo de negocio)", "#C4811F", "Pollerías al carbón o rostizado, buenas para comer en familia sin gastar mucho.", [
      E("Pollo entero con arroz y tortillas", 180, 280, "🍗", "Rinde para 3 o 4 personas", ["pollo asado", "pollo", "entero"], "combo"),
      E("Medio pollo con guarniciones", 100, 160, "🍗", "Con arroz, tortillas y salsa", ["pollo asado", "medio pollo"], "combo"),
      E("Cuarto de pollo con guarnición", 70, 110, "🍗", "Pierna y muslo o pechuga con arroz", ["pollo asado", "cuarto"], "solo")]],
    ["mariscos-baratos", "Mariscos económicos (tipo de negocio)", "#2A7C8A", "Puestos y mariscos de barrio: tostadas, cócteles y tacos de pescado o camarón.", [
      E("Tostada de ceviche", 35, 65, "🥙", "Pescado en limón con jitomate, cebolla y aguacate", ["ceviche", "tostada"], "solo"),
      E("Cóctel de camarón (chico)", 90, 150, "🍤", "Camarón en salsa con jitomate, cebolla y aguacate", ["coctel", "camaron", "camarones"], "combo"),
      E("Tacos de pescado o camarón (orden de 3)", 70, 130, "🌮", "Capeados o a la plancha con col y salsa", ["tacos", "pescado", "camaron"], "combo")]],
    ["desayunos-barrio", "Desayunos y café de barrio (tipo de negocio)", "#B07A33", "Desayunos mexicanos con café, pan o jugo, a buen precio.", [
      E("Chilaquiles con huevo o pollo", 65, 110, "🍳", "Rojos o verdes, con crema, queso y frijoles", ["chilaquiles", "desayuno"], "combo"),
      E("Huevos al gusto con frijoles", 55, 95, "🍳", "Con chorizo, jamón o a la mexicana; incluye tortillas", ["huevos", "desayuno"], "combo"),
      E("Molletes (orden de 2)", 45, 80, "🥖", "Bolillo con frijol, queso y pico de gallo", ["molletes"], "solo"),
      E("Café de olla", 20, 40, "☕", "Con canela y piloncillo", ["cafe de olla", "cafe"], "solo", "cafe"),
      E("Pan dulce con café", 25, 50, "🥐", "Una pieza de pan de panadería con café", ["pan dulce", "cafe", "concha"], "solo", "cafe")]],
    ["postres-antojos", "Postres y antojos (tipo de negocio)", "#D4568A", "Churrerías, neverías y puestos de antojo para cerrar la comida sin gastar mucho.", [
      E("Churros (orden)", 30, 60, "🥨", "Con azúcar y canela; con chocolate cuestan más", ["churros", "churro"], "solo", "postres"),
      E("Nieve de garrafa (copa)", 25, 50, "🍨", "De sabores de fruta o leche", ["nieve", "helado"], "solo", "postres"),
      E("Paleta de hielo o crema", 18, 35, "🍧", "De fruta natural o de leche", ["paleta", "helado"], "solo", "postres"),
      E("Fresas o plátanos con crema", 50, 90, "🍓", "Fruta con crema, leche condensada y granola", ["fresas con crema", "platanos con crema"], "solo", "postres")]]
  ];

  const MAPQ = { "tacos-barrio": "taquería", "fonda-corrida": "comida corrida", "fin-de-semana": "pozole menudo birria", "tortas-lonches": "tortas lonchería", "gorditas-tamales": "gorditas tamales",
    "esquites-antojos": "esquites elotes", "pollo-asado": "pollo asado", "mariscos-baratos": "mariscos", "desayunos-barrio": "desayunos chilaquiles", "postres-antojos": "churros nieves" };
  const mk = (id, name, brand, note, items, extra) => ({
    id: id + "-locales", plaza: "locales", name, cats: [...new Set(items.map((i) => i.cat))], verified: false, site: null, promo: null, source: "web",
    items, menu: true, local: true, anyPlaza: true, brand, brandInk: "#fff", menuNote: note, ...extra
  });
  const stores = [];
  for (const [id, name, brand, src, addr, mention, items] of NAMED)
    stores.push(mk(id, name, brand, `Lugar mencionado en ${src}. ${mention} ${REL}`, items, { address: addr || null, named: true, mapq: name }));
  for (const [id, name, brand, what, items] of GEN)
    stores.push(mk(id, name, brand, `No es un lugar específico: ${what} ${REL} Usa «Buscar cerca de mí» para encontrar uno.`, items, { generic: true, mapq: MAPQ[id] }));

  const have = new Set(D.STORES.map((s) => s.id));
  let n = 0;
  for (const s of stores) if (!have.has(s.id)) { D.STORES.push(s); n++; }
  const api = { count: n, stores };
  root.GASTABOT_LOCALFOOD = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
