// BASE SEMILLA v0.3 — Ciudad › Plaza › Tienda › Productos (rangos)
// - Los RANGOS de precio por producto son ESTIMACIONES (estimated:true), no precios reales.
// - verified:true  = la tienda aparece en 2+ fuentes públicas (o en el sitio oficial de la marca/plaza).
// - verified:false = aparece en una sola fuente o falta confirmar -> se muestra con «?».
// - needsReview:true = no está claro qué vende; corrige la categoría en «Agregar».
// v1.8 (2026-11-19): plazas Galerías y Centro, con pocas tiendas y TODAS sin verificar; no se inventan locales.
// Fuentes (consultadas 2026-11-18): cc-altaria.mx, notas de Líder Empresarial/Modaes (Altaria),
// tiendasinfo.mx, allux.com.mx, dondeirdecompras.com, sitio de Steren (Espacio y Villasunción).
// Los directorios pueden estar desactualizados: confirma en la tienda.
(function (root) {
  const CITIES = { aguascalientes: { name: "Aguascalientes" } };

  const PLAZAS = {
    altaria: { name: "Altaria", city: "aguascalientes", aliases: ["altaria", "altaría"], site: "https://cc-altaria.mx", address: "Blvd. a Zacatecas 849, Trojes de Alonso", addressHint: "849", osmName: "Altaria", geoQ: "Centro Comercial Altaria, Blvd. a Zacatecas 849, Aguascalientes" },
    villasuncion: { name: "Villasunción", city: "aguascalientes", aliases: ["villasuncion", "villasunción", "villa asuncion", "villa asunción"], site: null, address: "Centro Comercial Villasunción", addressHint: "Villasunci", osmName: "Villasunci", geoQ: "Centro Comercial Villasunción, Aguascalientes" },
    espacio: { name: "Espacio Aguascalientes", city: "aguascalientes", aliases: ["espacio", "espacio aguascalientes"], site: null, address: "Av. Tecnológico 120, Ojocaliente", addressHint: "Tecnol", osmName: "Espacio", center: [21.879831, -102.2615], geoQ: "Espacio Aguascalientes, Av. Tecnológico 120, Aguascalientes" },
    galerias: { name: "Galerías Aguascalientes", city: "aguascalientes", aliases: ["galerias", "galerías", "galerias aguascalientes"], site: null, address: "Av. Independencia 2351, Trojes de Alonso", addressHint: "2351", osmName: "Galerías", geoQ: "Centro Comercial Galerías, Av. Independencia 2351, Aguascalientes" },
    centro: { name: "Centro", city: "aguascalientes", aliases: ["centro historico", "centro histórico", "en el centro", "del centro", "plaza patria", "el parian", "parián", "calle madero", "calle nieto"], site: null, address: "Zona Centro (Plaza Patria: José Ma. Chávez 123; El Parián: Rivero y Gutiérrez 101)", addressHint: "", osmName: "Plaza Patria", center: [21.8808, -102.2961], geoQ: "Plaza de la Patria, Zona Centro, Aguascalientes" },
  };

  const it = (name, cat, min, max, tags = []) => ({ name, cat, min, max, tags, estimated: true });
  const S = (id, plaza, name, cats, verified, site, items, extra = {}) =>
    ({ id: `${id}-${plaza}`, plaza, name, cats, verified, site, promo: null, items, source: "web", ...extra });

  const STORES = [
    // ---------------- ALTARIA ----------------
    S("zara", "altaria", "Zara", ["ropa", "calzado"], true, "https://www.zara.com/mx", [it("Playera", "ropa", 350, 700, ["playera", "camiseta"]), it("Sudadera", "ropa", 700, 1300, ["sudadera", "hoodie"]), it("Pantalón", "ropa", 600, 1200, ["pantalon", "jeans"]), it("Vestido", "ropa", 700, 1500, ["vestido"]), it("Zapatos", "calzado", 900, 1800, ["zapatos"])]),
    S("hm", "altaria", "H&M", ["ropa"], true, "https://www2.hm.com/es_mx", [it("Playera", "ropa", 150, 400, ["playera", "camiseta"]), it("Sudadera", "ropa", 400, 900, ["sudadera", "hoodie"]), it("Pantalón", "ropa", 400, 900, ["pantalon", "jeans"]), it("Vestido", "ropa", 400, 1000, ["vestido"])]),
    S("levis", "altaria", "Levi's", ["ropa"], false, "https://www.levi.com.mx", [it("Playera", "ropa", 400, 800, ["playera"]), it("Jeans", "ropa", 1000, 1900, ["jeans", "pantalon"]), it("Chamarra", "ropa", 1800, 3500, ["chamarra"])]),
    S("sephora", "altaria", "Sephora", ["perfumes", "belleza"], true, "https://www.sephora.mx", [it("Perfume", "perfumes", 700, 3500), it("Maquillaje", "belleza", 250, 1200, ["labial", "base"]), it("Skincare", "belleza", 300, 1500, ["serum"])]),
    S("lego", "altaria", "LEGO Store", ["juguetes", "regalos"], true, "https://www.lego.com/es-mx", [it("Set pequeño", "juguetes", 200, 600), it("Set mediano", "juguetes", 800, 2000), it("Set grande", "juguetes", 2500, 6000), it("Detalle de regalo", "regalos", 200, 600)]),
    S("salomon", "altaria", "Salomon", ["deportes", "calzado", "ropa"], true, "https://www.salomon.com/es-mx", [it("Tenis outdoor", "calzado", 2500, 4500), it("Playera deportiva", "ropa", 700, 1400, ["playera"]), it("Chamarra", "deportes", 2500, 5000, ["chamarra"])]),
    S("lacomer", "altaria", "La Comer", ["super", "comida"], true, "https://www.lacomer.com.mx", [it("Despensa", "super", 200, 1500), it("Comida preparada", "comida", 100, 300)]),
    S("cantia", "altaria", "Cantia", ["hogar", "decoracion"], true, null, [it("Cojín / detalle", "decoracion", 200, 600), it("Lámpara", "hogar", 500, 2000), it("Mueble", "hogar", 2500, 9000)]),
    S("santaclara", "altaria", "Santa Clara", ["cafe", "postres", "comida"], true, "https://www.coca-cola.com/mx/es/brands/santa-clara/encuentralas", [it("Café / bebida", "cafe", 40, 90), it("Postre", "postres", 40, 120), it("Snack", "comida", 50, 150)]),
    S("telcel", "altaria", "Telcel (Centro de Atención)", ["tecnologia"], true, "https://www.telcel.com", [it("Accesorio / cargador", "tecnologia", 150, 600), it("Celular", "tecnologia", 2500, 20000)]),

    // ---------------- ESPACIO AGUASCALIENTES ----------------
    S("soriana", "espacio", "Soriana", ["super", "comida"], true, "https://www.soriana.com", [it("Despensa", "super", 200, 1500), it("Comida preparada", "comida", 80, 250)]),
    S("cinepolis", "espacio", "Cinépolis", ["entretenimiento", "comida"], true, "https://www.cinepolis.com", [it("Boleto de cine", "entretenimiento", 80, 170), it("Combo de palomitas", "comida", 120, 260)]),
    S("coppel", "espacio", "Coppel", ["ropa", "calzado", "tecnologia", "hogar"], true, "https://www.coppel.com", [it("Playera", "ropa", 200, 500, ["playera"]), it("Pantalón", "ropa", 350, 800, ["pantalon", "jeans"]), it("Tenis", "calzado", 500, 1300), it("Celular / electrónica", "tecnologia", 1500, 9000), it("Hogar", "hogar", 300, 4000)]),
    S("delsol", "espacio", "Del Sol", ["ropa", "calzado"], true, null, [it("Playera", "ropa", 250, 600, ["playera"]), it("Pantalón", "ropa", 400, 900, ["pantalon", "jeans"]), it("Zapatos", "calzado", 500, 1200, ["zapatos"])], { needsReview: true }),
    S("toks", "espacio", "Toks", ["comida", "cafe", "postres"], true, "https://www.toks.com.mx", [it("Comida / desayuno", "comida", 150, 380), it("Café", "cafe", 50, 110), it("Postre", "postres", 70, 160)]),
    S("steren", "espacio", "Steren", ["tecnologia"], true, "https://www.steren.com.mx", [it("Accesorio / cable", "tecnologia", 100, 600), it("Audífonos", "tecnologia", 200, 1500), it("Electrónica", "tecnologia", 500, 5000)]),
    S("officedepot", "espacio", "Office Depot", ["papeleria", "tecnologia"], false, "https://www.officedepot.com.mx", [it("Papelería / útiles", "papeleria", 50, 500), it("Accesorio de cómputo", "tecnologia", 200, 2000)]),
    S("gameplanet", "espacio", "GamePlanet", ["entretenimiento", "tecnologia"], false, "https://www.gameplanet.com", [it("Videojuego", "entretenimiento", 600, 1500), it("Accesorio gamer", "tecnologia", 300, 2000)]),
    S("innovasport", "espacio", "Innovasport", ["deportes", "calzado", "ropa"], false, "https://www.innovasport.com", [it("Tenis deportivos", "calzado", 1200, 3500), it("Playera deportiva", "ropa", 400, 900, ["playera"]), it("Ropa deportiva", "deportes", 500, 1800)]),
    S("flexi", "espacio", "Flexi", ["calzado"], false, "https://www.flexi.com.mx", [it("Zapatos", "calzado", 700, 1500, ["zapatos"])]),
    S("miniso", "espacio", "Miniso", ["regalos"], false, "https://www.miniso.com.mx", [it("Detalle / regalo", "regalos", 50, 400)]),
    S("reduced", "espacio", "Reduced (outlet)", ["ropa"], false, null, [it("Playera", "ropa", 150, 400, ["playera"]), it("Sudadera", "ropa", 300, 700, ["sudadera", "hoodie"]), it("Pantalón", "ropa", 300, 700, ["pantalon", "jeans"])]),
    S("quarry", "espacio", "Quarry", ["ropa"], false, null, [it("Prenda", "ropa", 300, 1200)], { needsReview: true }),
    S("moka", "espacio", "Moka Blue Cafetería Gourmet", ["cafe", "postres"], false, null, [it("Café", "cafe", 50, 110), it("Postre", "postres", 60, 130)]),
    S("francachela", "espacio", "Francachela", ["comida"], false, null, [it("Pizza / comida", "comida", 120, 350)]),
    S("chapultepec", "espacio", "Cervecería Chapultepec", ["comida"], false, null, [it("Cerveza / botana", "comida", 100, 400)]),
    S("suburbia", "espacio", "Suburbia", ["ropa", "calzado"], false, "https://www.suburbia.com.mx", [it("Playera", "ropa", 200, 500, ["playera"]), it("Pantalón", "ropa", 350, 800, ["pantalon", "jeans"]), it("Zapatos", "calzado", 400, 1200, ["zapatos"])]),

    // ---------------- VILLASUNCIÓN (una sola fuente: confirma en la plaza) ----------------
    S("liverpool", "villasuncion", "Liverpool", ["ropa", "calzado", "perfumes", "hogar", "tecnologia"], false, "https://www.liverpool.com.mx", [it("Playera", "ropa", 400, 900, ["playera"]), it("Sudadera", "ropa", 700, 1800, ["sudadera", "hoodie"]), it("Pantalón", "ropa", 600, 1800, ["pantalon", "jeans"]), it("Vestido", "ropa", 900, 2500, ["vestido"]), it("Zapatos", "calzado", 800, 2500, ["zapatos"]), it("Perfume", "perfumes", 600, 3000), it("Hogar", "hogar", 300, 4000), it("Electrónica", "tecnologia", 500, 20000)]),
    S("flexi", "villasuncion", "Flexi", ["calzado"], false, "https://www.flexi.com.mx", [it("Zapatos", "calzado", 700, 1500, ["zapatos"])]),
    S("lob", "villasuncion", "LOB", ["calzado"], false, null, [it("Zapatos", "calzado", 600, 1500, ["zapatos"])], { needsReview: true }),
    S("marcoviali", "villasuncion", "Marco Viali", ["ropa"], false, null, [it("Traje / prenda formal", "ropa", 1500, 4500, ["traje"]), it("Camisa", "ropa", 500, 1200, ["camisa"])]),
    S("verso", "villasuncion", "Verso", ["ropa"], false, null, [it("Prenda", "ropa", 300, 1200)], { needsReview: true }),
    S("cindirela", "villasuncion", "Cindirela Boutique", ["ropa"], false, null, [it("Vestido / blusa", "ropa", 300, 1200, ["vestido"])]),
    S("dogcats", "villasuncion", "Dog & Cats", ["mascotas"], false, null, [it("Accesorios / alimento", "mascotas", 100, 800)]),
    S("goc", "villasuncion", "GOC", ["belleza"], false, null, [it("Maquillaje", "belleza", 100, 500, ["labial", "base"])]),
    S("flormar", "villasuncion", "Flormar", ["belleza"], false, "https://www.flormar.com.mx", [it("Maquillaje", "belleza", 150, 600, ["labial", "base"])]),

    // ---------------- GALERÍAS AGUASCALIENTES (Av. Independencia 2351; power center frente a Altaria) ----------------
    // Fuentes (2026-11-19): dondeirdecompras.com, Yelp, Secretaría de Cultura (SIC), directorio AT&T. Una sola fuente por tienda -> verified:false.
    S("homedepot", "galerias", "The Home Depot", ["hogar", "decoracion"], false, "https://www.homedepot.com.mx", [it("Herramienta / ferretería", "hogar", 100, 1500), it("Decoración / iluminación", "decoracion", 150, 1200), it("Material de jardín", "hogar", 80, 800)]),
    S("terrazza", "galerias", "Terrazza Italiana", ["comida"], false, null, [it("Pasta / pizza", "comida", 150, 380), it("Bebida", "cafe", 40, 110), it("Postre", "postres", 70, 160)]),
    S("mmcinemas", "galerias", "MMCinemas", ["entretenimiento", "comida"], false, null, [it("Boleto de cine", "entretenimiento", 70, 150), it("Combo de palomitas", "comida", 110, 240)]),
    S("att", "galerias", "AT&T (tienda)", ["tecnologia"], false, "https://www.att.com.mx", [it("Accesorio / cargador", "tecnologia", 120, 600), it("Celular", "tecnologia", 2000, 20000)]),

    // ---------------- CENTRO (comercio local) ----------------
    // Aquí hay poco porque casi no hay directorios confiables de locales pequeños. NO se inventan negocios: agrega los que conozcas en «Agregar».
    // Fuentes: México Desconocido (calles Madero y Nieto), Wanderlog (Plaza Patria), Sección Amarilla/Wikipedia (direcciones).
    S("villaazul", "centro", "Mariscos Villa Azul (Plaza Patria)", ["comida"], false, null, [it("Platillo de mariscos", "comida", 150, 400), it("Bebida", "cafe", 30, 90)]),
    S("nieto", "centro", "Deshilados y artesanías (calle Nieto)", ["regalos", "ropa"], false, null, [it("Deshilado / bordado", "regalos", 100, 800), it("Artesanía", "regalos", 50, 500)], { needsReview: true }),
    S("madero", "centro", "Cafés de la calle Madero", ["cafe", "postres"], false, null, [it("Café", "cafe", 40, 100), it("Postre", "postres", 50, 130)], { needsReview: true }),
  ];


  // ====== ALTARIA — directorio oficial (lista pegada por el usuario, 2026-11-18) ======
  // Tipo + nivel de precio (A=accesible, B=medio, C=premium) -> productos con rango ESTIMADO.
  // Marcas cuya categoría no es evidente: needsReview:true. Marcas que no reconozco: cat "otros".
  const _slug = (x) => String(x).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const R = { A: [[150, 450], [350, 800], [350, 900]], B: [[400, 900], [800, 1800], [800, 1800]], C: [[900, 2200], [1800, 4500], [1500, 4500]] };
  const SH = { A: [500, 1200], B: [1200, 2800], C: [2500, 8000] };
  const FD = { A: [90, 220], B: [200, 550], C: [450, 1200] };
  const ropaItems = (t) => [it("Playera", "ropa", ...R[t][0], ["playera", "camiseta"]), it("Sudadera", "ropa", ...R[t][1], ["sudadera", "hoodie"]), it("Pantalón", "ropa", ...R[t][2], ["pantalon", "jeans"])];
  const BUILD = {
    ropa: (t) => ({ cats: ["ropa"], items: ropaItems(t) }),
    bebe: (t) => ({ cats: ["ropa"], items: [it("Prenda de bebé / niño", "ropa", 150, 600)] }),
    calz: (t) => ({ cats: ["calzado"], items: [it("Zapatos / tenis", "calzado", ...SH[t], ["zapatos"])] }),
    depo: (t) => ({ cats: ["calzado", "ropa", "deportes"], items: [it("Tenis", "calzado", ...SH[t]), it("Playera deportiva", "ropa", ...R[t][0], ["playera"]), it("Sudadera", "ropa", ...R[t][1], ["sudadera", "hoodie"])] }),
    comida: (t) => ({ cats: ["comida"], items: [it("Comida", "comida", ...FD[t])] }),
    cafe: () => ({ cats: ["cafe"], items: [it("Café / bebida", "cafe", 40, 120)] }),
    postre: () => ({ cats: ["postres"], items: [it("Postre / helado", "postres", 40, 170)] }),
    belleza: () => ({ cats: ["belleza"], items: [it("Maquillaje / cuidado", "belleza", 150, 1500, ["labial", "base"])] }),
    salon: () => ({ cats: ["belleza"], items: [it("Corte / peinado", "belleza", 250, 1500)] }),
    joya: (t) => ({ cats: ["regalos"], items: [it("Joyería / accesorio", "regalos", t === "C" ? 1500 : 600, t === "C" ? 9000 : 4500)] }),
    tec: () => ({ cats: ["tecnologia"], items: [it("Accesorio / carcasa", "tecnologia", 100, 600)] }),
    tecG: () => ({ cats: ["tecnologia"], items: [it("Accesorio", "tecnologia", 150, 800), it("Celular / dispositivo", "tecnologia", 2500, 25000)] }),
    hogar: (t) => ({ cats: ["hogar"], items: [it("Mueble / colchón", "hogar", t === "C" ? 15000 : 3000, t === "C" ? 80000 : 20000)] }),
    ent: () => ({ cats: ["entretenimiento"], items: [it("Entrada / juegos", "entretenimiento", 80, 450)] }),
    juguete: () => ({ cats: ["juguetes"], items: [it("Juguete", "juguetes", 150, 1500)] }),
    regalo: () => ({ cats: ["regalos"], items: [it("Regalo / detalle", "regalos", 80, 600)] }),
    optica: () => ({ cats: ["opticas"], items: [it("Lentes / armazón", "opticas", 800, 5000)] }),
    depor: () => ({ cats: ["deportes"], items: [it("Artículo / suplemento / membresía", "deportes", 300, 1800)] }),
    dept: () => ({ cats: ["ropa", "calzado", "hogar", "tecnologia"], items: [it("Playera", "ropa", 300, 800, ["playera"]), it("Sudadera", "ropa", 600, 1500, ["sudadera", "hoodie"]), it("Pantalón", "ropa", 500, 1500, ["pantalon", "jeans"]), it("Zapatos", "calzado", 600, 2000, ["zapatos"]), it("Hogar", "hogar", 300, 4000), it("Electrónica", "tecnologia", 500, 15000)] }),
    otros: () => ({ cats: ["otros"], items: [it("Compra (categoría por confirmar)", "otros", 100, 1000)] })
  };
  // [nombre, tipo, nivel, revisar?]
  const ALTARIA_DIR = [
    ["Adidas", "depo", "B"], ["Adolfo Dominguez", "ropa", "C"], ["Al sabor de la especial plus", "comida", "A", 1], ["American Eagle", "ropa", "B"],
    ["Argentina Express", "comida", "A", 1], ["AT&T", "tecG", "B"], ["Ben&Frank", "ropa", "B", 1], ["Berlin", "otros", "B", 1], ["Bershka", "ropa", "A"],
    ["Bimba y Lola", "joya", "C", 1], ["Bizarro", "otros", "B", 1], ["Blossom", "otros", "B", 1], ["Bobois", "hogar", "C", 1], ["Boss", "ropa", "C"],
    ["Brantano", "calz", "B", 1], ["Burger King", "comida", "A"], ["C&A", "ropa", "A"], ["Calvin Klein", "ropa", "C"], ["Calzado efe", "calz", "A"],
    ["Calzedonia", "ropa", "B", 1], ["Carbon parrilla de barrio", "comida", "B"], ["Carl's Jr.", "comida", "A"], ["Carter's", "bebe", "B"], ["Champolines", "comida", "B", 1],
    ["Chili's", "comida", "B"], ["Chilim Balam", "comida", "B"], ["Christie's XXI", "otros", "B", 1], ["Cinépolis", "ent", "B"], ["Cinnabon", "postre", "B"],
    ["Colchones Atlas", "hogar", "A"], ["Coppel", "dept", "A"], ["Coqueta y Audaz", "ropa", "A", 1], ["Creysi", "otros", "A", 1], ["Crocs", "calz", "B"],
    ["Cuadra", "calz", "C"], ["Cute as a bug", "bebe", "B", 1], ["Dairy Queen", "postre", "A"], ["Danyyo", "otros", "A", 1], ["Deportes Martí", "depor", "B"],
    ["Dione", "otros", "B", 1], ["Diva", "otros", "B", 1], ["Divots", "otros", "B", 1], ["DO&BE", "otros", "A", 1], ["Domino's", "comida", "A"],
    ["Deportenis", "depo", "A"], ["DP Street", "otros", "A", 1], ["El Gaucho Tradicional", "comida", "B"], ["El Globo", "postre", "A"], ["El Rincón del Pozole", "comida", "A"],
    ["Europiel", "calz", "B", 1], ["Fashioncel", "tec", "A"], ["Flaming Wings", "comida", "A"], ["Flexi", "calz", "B"], ["Frequent Flyer", "regalo", "B", 1],
    ["Froze", "postre", "A"], ["Gamers", "ent", "B", 1], ["Gelato", "postre", "B"], ["Gilio", "otros", "B", 1], ["GNC", "depor", "B"],
    ["Go Baby", "bebe", "B", 1], ["Gong Cha", "cafe", "A"], ["Gonvil", "otros", "B", 1], ["Guess", "ropa", "C"], ["Gui Parrilla Coreana", "comida", "B"],
    ["Häagen-Dazs", "postre", "B"], ["Happy Case", "tec", "A"], ["Huawei", "tecG", "B"], ["Innovasport", "depo", "B"], ["Insalati & Co", "comida", "B"],
    ["Invictus", "otros", "B", 1], ["Italianni's", "comida", "B"], ["Juguetrón", "juguete", "B"], ["Julio", "calz", "B", 1], ["KFC", "comida", "A"],
    ["Kumo", "comida", "B", 1], ["La Casa de las Carcasas", "tec", "A"], ["La Crêpe Parisienne", "comida", "B"], ["La Crepería", "comida", "B"], ["La Michoacana", "postre", "A"],
    ["Lacoste", "ropa", "C"], ["Las Gordibuenas", "comida", "A", 1], ["Lionesse", "otros", "B", 1], ["Liverpool", "dept", "B"], ["LOB", "calz", "B", 1],
    ["Longcase", "tec", "A"], ["Los de Asada", "comida", "A"], ["Luna", "otros", "B", 1], ["Luxury Muebles", "hogar", "C", 1], ["MAC Cosmetics", "belleza", "C"],
    ["Macroplay", "ent", "B", 1], ["MacStore", "tecG", "C"], ["Maja", "otros", "B", 1], ["Mango", "ropa", "B"], ["Massimo Dutti", "ropa", "C"],
    ["Matcha Amour", "cafe", "B"], ["McDonald's", "comida", "A"], ["Men's Fashion", "ropa", "B", 1], ["Miniso", "regalo", "A"], ["Monkey Papas", "comida", "A", 1],
    ["Muebles Dico", "hogar", "A"], ["Necaxa", "otros", "B", 1], ["New Era", "ropa", "B", 1], ["Nohmcha", "cafe", "B"], ["Nutrisa", "postre", "A"],
    ["Ópticas América", "optica"], ["Ópticas Lux", "optica"], ["Ópticas Plaza", "optica"], ["Oysho", "ropa", "A"], ["Pandora", "joya", "B"],
    ["Piccolo Ludo", "ent"], ["PlayCity", "ent"], ["Psycho Bunny", "ropa", "C"], ["Pull & Bear", "ropa", "A"], ["Puma", "depo", "B"],
    ["Recórcholis", "ent"], ["Regalos Elyon", "regalo"], ["Río Grande", "otros", "B", 1], ["Roberts", "otros", "B", 1], ["Sally Beauty", "belleza"],
    ["Samsung", "tecG", "B"], ["Sanborns", "comida", "B", 1], ["Sato", "otros", "B", 1], ["Scapino", "otros", "B", 1], ["Sears", "dept", "B"],
    ["Sebastian Coiffure", "salon"], ["Sphera", "otros", "B", 1], ["Shasa", "otros", "B", 1], ["Skechers", "calz", "B"], ["Smart Bamboo", "otros", "B", 1],
    ["Smart Riders", "otros", "B", 1], ["Solei", "otros", "B", 1], ["Sports World", "depor", "B"], ["Springfield", "ropa", "A"], ["Starbucks", "cafe"],
    ["Steren", "tec", "A"], ["Stop", "otros", "B", 1], ["Stradivarius", "ropa", "A"], ["Subway", "comida", "A"], ["Sunglass Hut", "optica"],
    ["Sushi Mizaki", "comida", "B"], ["Sushi Roll", "comida", "B"], ["Sushi Tai", "comida", "B"], ["TAF", "otros", "B", 1], ["The North Face", "ropa", "C"],
    ["Timberland", "calz", "C"], ["Todo Moda", "ropa", "A", 1], ["Tommy Hilfiger", "ropa", "C"], ["Tous", "joya", "C"], ["Toutens", "otros", "B", 1],
    ["Trebola", "otros", "B", 1], ["Trender", "otros", "B", 1], ["Tszhangs", "otros", "B", 1], ["UGG", "calz", "C"], ["Vans", "depo", "B"],
    ["Vinevera", "otros", "B", 1], ["Wendy's", "comida", "A"], ["Women'secret", "ropa", "B"], ["Zata Selection", "otros", "B", 1]
  ];
  const _have = new Set(STORES.map((s) => s.id));
  for (const [name, type, tier = "B", review] of ALTARIA_DIR) {
    const id = `${_slug(name)}-altaria`;
    if (_have.has(id)) continue;
    const b = BUILD[type](tier);
    STORES.push({ id, plaza: "altaria", name, cats: b.cats, verified: true, site: null, promo: null, items: b.items, source: "altaria-directorio", ...(review ? { needsReview: true } : {}) });
    _have.add(id);
  }
  // Levi's y Steren ya estaban: quedan confirmados por el directorio oficial.
  for (const s of STORES) if (s.plaza === "altaria" && ["levis-altaria"].includes(s.id)) s.verified = true;

  // Palabras clave -> categoría
  const CATEGORIES = {
    ropa: ["ropa", "playera", "camisa", "pantalon", "pantalón", "vestido", "chamarra", "outfit", "jeans", "sudadera", "hoodie", "traje"],
    calzado: ["zapato", "tenis", "calzado", "botas", "bota", "botin", "botín", "botines", "sandalia", "sandalias", "tacon", "tacón", "tacones", "mocasin", "mocasín", "mocasines", "balerina", "flats", "pantufla", "zapatilla", "zapatillas"],
    perfumes: ["perfume", "fragancia", "colonia"],
    belleza: ["maquillaje", "skincare", "belleza", "cosmético", "cosmetico", "crema"],
    comida: ["comida", "comer", "restaurante", "hambre", "cenar", "desayuno", "antoja", "antojo", "tacos", "hamburguesa", "pizza", "cerveza", "whopper", "big mac", "nuggets", "pollo", "sushi", "combo", "papas"],
    cafe: ["cafe", "café", "frappe", "frappé", "latte"],
    postres: ["postre", "helado", "pastel", "dulce"],
    super: ["super", "súper", "despensa", "mandado"],
    juguetes: ["juguete", "lego", "armar"],
    regalos: ["regalo", "detalle", "cumpleaños", "joyeria", "joyería", "pulsera", "collar", "arete"],
    deportes: ["deporte", "gym", "correr", "running", "outdoor", "senderismo"],
    hogar: ["hogar", "mueble", "casa", "cojin", "cojín", "lampara", "lámpara"],
    decoracion: ["decoracion", "decoración", "decorar"],
    tecnologia: ["celular", "cargador", "audifonos", "audífonos", "tecnologia", "tecnología", "gadget", "cable"],
    entretenimiento: ["cine", "pelicula", "película", "entretenimiento", "videojuego", "videojuegos", "juegos"],
    mascotas: ["mascota", "mascotas", "perro", "gato"],
    opticas: ["lentes", "optica", "óptica", "armazon", "armazón", "gafas"],
    papeleria: ["papeleria", "papelería", "oficina", "utiles", "útiles", "escuela"]
  };

  root.GASTABOT_DATA = { CITIES, PLAZAS, STORES, CATEGORIES };
  if (typeof module !== "undefined") module.exports = root.GASTABOT_DATA;
})(typeof window !== "undefined" ? window : globalThis);
