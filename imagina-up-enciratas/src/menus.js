// Menús con productos concretos. Se aplican sobre las tiendas de stores.js.
// X(...)  = precio de referencia publicado (exacto, con fuente y fecha).
// E(...)  = estimado mío por rango (se muestra con «~»). No son precios oficiales.
// Los precios cambian por sucursal y canal (mostrador, app, reparto): confirma en la tienda.
(function (root) {
  const D = root.GASTABOT_DATA || require("./stores.js");
  const X = (name, price, emoji, desc, tags = [], kind = "combo", cat = "comida") =>
    ({ name, cat, min: price, max: price, exact: true, emoji, desc, kind, tags, estimated: false });
  const E = (name, min, max, emoji, desc, tags = [], kind = "solo", cat = "comida") =>
    ({ name, cat, min, max, emoji, desc, kind, tags, estimated: true });

  const P = (name, min, max, desc, tags = [], cat = "ropa") =>
    ({ name, cat, min, max, emoji: "", desc, kind: "solo", tags, estimated: true });

  const SRC = "Precios de referencia tomados de prensa y apps de reparto (consultados nov-2026). Cambian por sucursal y canal.";

  const MENUS = {
    "burger-king-altaria": { brand: "#E8590C", items: [
      E("Whopper (sola)", 115, 145, "🍔", "Hamburguesa de res a la parrilla, sin papas ni refresco", ["whopper", "hamburguesa"], "solo"),
      X("Combo Whopper", 179, "🍔", "Whopper + papas + refresco", ["whopper", "hamburguesa", "combo"]),
      X("Combo Whopper + pay o 4 nuggets", 199, "🍔", "Whopper con queso + papas + refresco + pay de manzana o 4 nuggets", ["whopper", "hamburguesa", "combo"]),
      X("Combo Whopper doble con queso", 239, "🍔", "Doble carne, papas y refresco", ["whopper", "hamburguesa", "combo", "doble"]),
      X("Combo King de Pollo", 134, "🐔", "Sándwich de pollo + papas + refresco", ["pollo", "king de pollo", "combo"]),
      X("Combo Long Rodeo", 134, "🍔", "Long Rodeo + papas + refresco", ["rodeo", "hamburguesa", "combo"]),
      X("King Antojo", 109, "🍟", "Promo individual", ["promo"]),
      X("Baby Burgers x3", 159, "🍔", "3 mini hamburguesas", ["hamburguesa", "mini"], "solo")
    ] },
    "mcdonald-s-altaria": { brand: "#F2B705", ink: "#3B2A00", items: [
      E("Big Mac (sola)", 100, 125, "🍔", "Hamburguesa sola, sin papas ni refresco", ["big mac", "hamburguesa"], "solo"),
      X("Big Mac + papas medianas", 89, "🍔", "Promo «Mc para Todos»", ["big mac", "hamburguesa", "combo", "papas"]),
      E("McTrío Big Mac mediano", 169, 175, "🍔", "Big Mac + papas + refresco medianos", ["big mac", "hamburguesa", "combo", "mctrio"], "combo"),
      X("McTrío Big Mac mediano + hamburguesa con queso", 129, "🍔", "Dos hamburguesas, papas y refresco", ["big mac", "hamburguesa", "combo", "mctrio"]),
      X("McNuggets 6 piezas + papas grandes", 79, "🍗", "Promo «Mc para Todos»", ["nuggets", "pollo", "combo", "papas"]),
      X("2 Big Mac + 2 refrescos medianos", 159, "🍔", "Para dos", ["big mac", "hamburguesa", "combo"]),
      X("Sundae de chocolate + papas chicas", 35, "🍦", "Antojo dulce y salado", ["helado", "sundae", "postre", "papas"], "combo")
    ] },
    "starbucks-altaria": { brand: "#0F6B4C", items: [
      X("Espresso Americano", 61, "☕", "Precio lista 2026 (tamaño base)", ["americano", "cafe", "espresso"], "solo", "cafe"),
      X("Latte", 76, "☕", "Precio lista 2026 (tamaño base)", ["latte", "cafe"], "solo", "cafe"),
      X("Caramel Macchiato", 88, "🥛", "Precio lista 2026 (tamaño base)", ["caramel", "macchiato", "cafe"], "solo", "cafe"),
      X("Latte, cappuccino o macchiato Alto con app", 49, "☕", "Promo con Starbucks Rewards (Pickup en app) hasta 31-dic-2026", ["latte", "cafe", "oferta", "cappuccino"], "solo", "cafe"),
      X("2 bebidas Alto (promo)", 99, "☕", "Latte, cappuccino, mocha, frappuccino y más; promo por tiempo limitado", ["latte", "cafe", "oferta", "frappuccino"], "combo", "cafe"),
      E("Frappuccino", 95, 125, "🧋", "Frappuccino tamaño Grande", ["frappuccino", "frappe", "cafe"], "solo", "cafe")
    ] },
    "domino-s-altaria": { brand: "#1D5FA8", items: [
      X("Pizza mediana original (reparto)", 189, "🍕", "1 ingrediente; hasta 4 por $50 más", ["pizza", "mediana"], "solo"),
      X("2 pizzas medianas masa croissant", 299, "🍕", "1 ingrediente cada una (referencia de reparto)", ["pizza", "croissant", "combo"]),
      X("Pizza sartén + 2 baitz + 1 papa", 379, "🍕", "Pizza sartén de 1 a 4 ingredientes", ["pizza", "sarten", "combo"]),
      X("Croissant Rolls", 69, "🥐", "Complemento", ["croissant", "complemento"], "solo")
    ] },
    "kfc-altaria": { brand: "#C8102E", items: [
      X("Combo Kruncher", 89, "🍗", "Sándwich + papas + refresco (precio según zona: $89 a $129)", ["kruncher", "pollo", "combo"]),
      X("Hamburguesa Big Krunch", 149, "🍔", "Sola", ["big krunch", "hamburguesa", "pollo"], "solo"),
      X("La Secreta Burger", 169, "🍔", "Burger de pollo original", ["secreta", "hamburguesa", "pollo"], "solo"),
      X("Combo La Secreta Burger", 199, "🍔", "Burger + papas + refresco", ["secreta", "hamburguesa", "pollo", "combo"]),
      X("Mega Box Big Krunch + pieza", 209, "🍗", "Big Krunch, pieza de pollo, papas y refresco", ["big krunch", "pollo", "combo"]),
      X("Pop Corn mediano", 79, "🍿", "Pollo estilo palomitas", ["pop corn", "pollo", "snack"], "solo"),
      X("2 Apple Pies", 50, "🥧", "Postre", ["postre", "pay"], "solo")
    ] },
    "carl-s-jr-altaria": { brand: "#D4202C", items: [
      X("Combo Famous Star con queso", 189, "🍔", "1 carne, papas chicas y refresco", ["famous star", "hamburguesa", "combo"]),
      X("Combo Super Star con queso", 229, "🍔", "2 carnes, papas chicas y refresco", ["super star", "hamburguesa", "combo", "doble"]),
      X("Combo Western Bacon Cheeseburger", 209, "🍔", "Con aros de cebolla, papas chicas y refresco", ["western bacon", "hamburguesa", "combo"]),
      X("Spicy Western Bacon Cheeseburger (sola)", 111, "🍔", "Sola", ["western bacon", "hamburguesa", "spicy"], "solo"),
      X("Combo Honey Mustard Chicken Tender", 175, "🐔", "Sándwich de pollo + papas chicas + refresco", ["pollo", "tender", "combo"]),
      X("Combo Hand Breaded Bacon Swiss", 259, "🐔", "Pollo empanizado con tocino + papas + refresco", ["pollo", "bacon", "combo"]),
      X("Snack Pack", 239, "🍟", "Para compartir", ["compartir", "snack", "combo"])
    ] },
    "subway-altaria": { brand: "#2E7D32", src: "Rappi (sucursales CDMX), nov-2026", items: [
      X("Sub Atún combo", 143, "", "Sub de atún + papas + refresco", ["sandwich", "subway", "atun", "combo"]),
      X("Sub Carne y Queso combo", 195, "", "Sub de carne y queso + papas + refresco", ["sandwich", "subway", "combo"]),
      X("Sub Crunchy Steak & Bacon combo (#13)", 180, "", "Sub con steak y tocino + papas + refresco", ["sandwich", "subway", "combo"]),
      X("Maxi combo (promo)", 154, "", "Promoción de reparto; antes $220", ["sandwich", "subway", "combo", "promo"]),
      X("Subway Series footlong combo", 232, "", "Footlong de la línea Subway Series + papas + refresco", ["sandwich", "subway", "footlong", "combo"]),
      X("Footlong Italiano B.M.T.", 206, "", "30 cm, sólo el sándwich", ["sandwich", "subway", "footlong"], "solo"),
      X("Footlong Chicken & Bacon Ranch", 219, "", "30 cm, sólo el sándwich", ["sandwich", "subway", "footlong", "pollo"], "solo"),
      X("Sub milanesa mexicana 15 cm", 83, "", "Sándwich individual", ["sandwich", "subway"], "solo")
    ] },
    "wendy-s-altaria": { brand: "#C8102E", src: "Prensa (apertura Reforma, ago-2026): SDP Noticias, Crónica y Merca2.0", items: [
      X("Dave's Single", 165, "", "Hamburguesa sencilla, tamaño regular", ["wendys", "hamburguesa", "dave"], "solo"),
      X("Dave's Double", 205, "", "Doble carne, tamaño regular", ["wendys", "hamburguesa", "dave", "doble"], "solo"),
      X("Dave's Triple", 255, "", "Triple carne, tamaño regular", ["wendys", "hamburguesa", "dave", "triple"], "solo"),
      X("Baconator", 215, "", "Doble carne con tocino", ["wendys", "hamburguesa", "baconator"], "solo"),
      X("Big Bacon Classic", 175, "", "Hamburguesa con tocino", ["wendys", "hamburguesa"], "solo"),
      E("Combo Dave's Single", 230, 260, "", "Hamburguesa + papas + refresco (en reparto: $256)", ["wendys", "hamburguesa", "combo"], "combo")
    ] },
    "chili-s-altaria": { brand: "#B71C1C", src: "fastfoodsmenu.com (carta Chili's México), nov-2026", items: [
      X("Boneless 5 pzs + papas", 189, "", "Boneless con papas", ["chilis", "boneless", "pollo", "combo"]),
      X("Alitas 5 pzs + papas", 189, "", "Alitas con papas", ["chilis", "alitas", "pollo", "combo"]),
      X("Combo para ti", 249, "", "Combo individual", ["chilis", "combo"]),
      X("Combo 1 persona", 299, "", "Platillo + bebida", ["chilis", "combo"]),
      X("10 Boneless + 5 gratis + Coca", 299, "", "Para compartir", ["chilis", "boneless", "pollo", "combo"]),
      X("10 Alitas + 5 gratis + Coca", 309, "", "Para compartir", ["chilis", "alitas", "pollo", "combo"]),
      X("Burger & Wings combo", 339, "", "Hamburguesa + alitas", ["chilis", "hamburguesa", "alitas", "combo"]),
      X("Triple Dipper", 389, "", "Tres entradas a elegir", ["chilis", "combo"]),
      X("Oldtimer con queso", 249, "", "Hamburguesa clásica", ["chilis", "hamburguesa"], "solo"),
      X("Mushroom Swiss", 259, "", "Hamburguesa con hongos y queso suizo", ["chilis", "hamburguesa"], "solo"),
      X("Bacon Burger", 259, "", "Hamburguesa con tocino", ["chilis", "hamburguesa"], "solo"),
      X("Sweet & Smokey Pineapple", 279, "", "Hamburguesa con piña", ["chilis", "hamburguesa"], "solo"),
      X("Crispers", 299, "", "Tiras de pollo crujiente", ["chilis", "pollo"], "solo"),
      X("Classic Nachos", 219, "", "Entrada para compartir", ["chilis", "nachos"], "solo"),
      X("Southwestern Eggrolls", 229, "", "Entrada", ["chilis", "entrada"], "solo"),
      X("Baby Back Ribs 1/2", 439, "", "Media orden de costillas", ["chilis", "costillas"], "solo"),
      X("Molten Chocolate Cake", 229, "", "Postre de chocolate caliente", ["chilis", "postre", "pastel"], "solo", "postres"),
      X("Colossal Cheesecake", 205, "", "Postre", ["chilis", "postre", "cheesecake"], "solo", "postres")
    ] },
    "italianni-s-altaria": { brand: "#8E1B1B", src: "fastfoodsmenu.com (carta Italianni's), nov-2026", items: [
      X("Paquete Panzerotti", 199, "", "Paquete individual", ["italianni", "panzerotti", "combo", "pizza"]),
      X("Combo Per Te", 285, "", "Paquete individual", ["italianni", "combo", "pasta"]),
      X("Duo Italiano", 325, "", "Paquete para dos", ["italianni", "combo", "pasta"]),
      X("Celebrazione (2 personas)", 705, "", "Paquete para compartir", ["italianni", "combo"]),
      X("Fettuccini Alfredo", 193, "", "Pasta", ["italianni", "pasta"], "solo"),
      X("Spaghetti Bolognese", 245, "", "Pasta", ["italianni", "pasta"], "solo"),
      X("Pasta al Forno", 275, "", "Pasta gratinada", ["italianni", "pasta"], "solo"),
      X("Spaghetti con albóndigas", 295, "", "Pasta", ["italianni", "pasta"], "solo"),
      X("Lasagna Biancini", 385, "", "Lasaña", ["italianni", "pasta", "lasagna"], "solo"),
      X("Pizza Margherita", 225, "", "Pizza", ["italianni", "pizza"], "solo"),
      X("Pizza Peperoni", 225, "", "Pizza", ["italianni", "pizza"], "solo"),
      X("Pizza Cuatro Quesos", 245, "", "Pizza", ["italianni", "pizza"], "solo"),
      X("Pollo Milanese", 295, "", "Plato fuerte", ["italianni", "pollo"], "solo"),
      X("Panna Cotta", 229, "", "Postre", ["italianni", "postre"], "solo", "postres"),
      X("Pane d'Aglio", 155, "", "Pan de ajo para compartir", ["italianni", "entrada"], "solo")
    ] },
    "sushi-roll-altaria": { brand: "#C2185B", src: "fastfoodsmenu.com (carta Sushi Roll), nov-2026", items: [
      X("Filadelfia Roll (salmón)", 125, "", "Rollo clásico con queso crema", ["sushi", "roll", "filadelfia"], "solo"),
      X("Temaki clásico", 125, "", "Cono de alga", ["sushi", "temaki"], "solo"),
      X("California Roll", 143, "", "Salmón o camarón", ["sushi", "roll"], "solo"),
      X("Kiuri Roll", 143, "", "Rollo envuelto en pepino", ["sushi", "roll"], "solo"),
      X("Avocado Roll", 151, "", "Rollo con aguacate", ["sushi", "roll"], "solo"),
      X("Queso Roll", 158, "", "Rollo con queso", ["sushi", "roll"], "solo"),
      X("Tempura Roll", 175, "", "Rollo empanizado", ["sushi", "roll", "tempura"], "solo"),
      X("Dragon Roll", 195, "", "Rollo especial", ["sushi", "roll"], "solo"),
      X("Yakimeshi de pollo", 116, "", "Arroz frito", ["sushi", "arroz", "pollo"], "solo"),
      X("Edamames", 106, "", "Entrada", ["sushi", "entrada"], "solo"),
      X("Teriyaki de pollo", 190, "", "Plato fuerte", ["sushi", "pollo"], "solo"),
      X("Poke bowl", 263, "", "Bowl con pescado y verduras", ["sushi", "poke", "bowl"], "solo"),
      E("Combo 2 rolls", 250, 340, "", "Dos rollos del menú regular", ["sushi", "roll", "combo"], "combo")
    ] },
    "liverpool-altaria": { src: "Liverpool.com.mx y Sears.com.mx (precios web, nov-2026); donde dice «~» es rango estimado", items: [
      P("Playera Gap cuello redondo", 349, 489, "Hombre, precio web con descuento", ["playera", "gap"], "ropa"),
      P("Sudadera Gap", 479, 1119, "Hombre o mujer; varía por modelo", ["sudadera", "gap"], "ropa"),
      P("Jeans Gap slim", 899, 1019, "Hombre, precio web con descuento", ["jeans", "gap"], "ropa"),
      P("Jeans Levi's 501", 870, 910, "Lavado claro u obscuro; lista $1,299", ["jeans", "levis", "501"], "ropa"),
      P("Playera Levi's", 329, 549, "Manga corta", ["playera", "levis"], "ropa"),
      P("Chamarra de mezclilla Levi's", 1959, 2799, "Hombre", ["chamarra", "levis"], "ropa"),
      P("Pantalón chino Gap", 1119, 1399, "Hombre, algodón", ["pantalon", "gap"], "ropa"),
      P("Tenis Vans Old Skool", 1250, 1800, "Hombre o mujer", ["tenis", "vans"], "calzado"),
      P("Tenis K-Swiss", 804, 2060, "Mujer; varía por modelo", ["tenis", "kswiss"], "calzado"),
      P("Zapato de tacón mujer", 1386, 2518, "Vestir", ["zapato", "tacon"], "calzado"),
      P("Perfume Good Girl 80 ml", 2300, 3700, "Carolina Herrera; $2,309 de lista en Bodega Aurrerá, $3,690 en Palacio de Hierro", ["perfume", "good girl"], "perfumes"),
      P("Perfume Bleu de Chanel EDP 100 ml", 3220, 3650, "Chanel.com/mx lo lista en $3,650", ["perfume", "bleu", "chanel"], "perfumes"),
      P("Perfume Versace Dylan Blue 100 ml", 2200, 3000, "Sears lo lista en $3,000", ["perfume", "versace", "dylan blue"], "perfumes"),
      P("Perfume de diseñador (50 ml)", 900, 1800, "Línea accesible", ["perfume"], "perfumes"),
      P("Body mist", 250, 600, "Bruma corporal", ["perfume", "body mist"], "perfumes")
    ] },
    "sears-altaria": { src: "Sears.com.mx (precio web, nov-2026); «~» es rango estimado", items: [
      X("Jeans Levi's 501", 869, "", "Corte recto; lista $1,299", ["jeans", "levis", "501"], "solo", "ropa"),
      X("Perfume Versace Dylan Blue EDT 100 ml", 3000, "", "Precio publicado en Sears.com.mx", ["perfume", "versace", "dylan blue"], "solo", "perfumes"),
      P("Playera básica", 300, 800, "Varias marcas", ["playera"], "ropa"),
      P("Sudadera", 600, 1500, "Varias marcas", ["sudadera"], "ropa"),
      P("Pantalón casual", 500, 1500, "Varias marcas", ["pantalon"], "ropa"),
      P("Chamarra", 800, 2200, "Ligera o de invierno", ["chamarra"], "ropa"),
      P("Tenis casuales", 700, 2000, "Varias marcas", ["tenis"], "calzado"),
      P("Zapatos de vestir", 800, 2200, "Hombre", ["zapato"], "calzado"),
      P("Perfume de diseñador (50 ml)", 900, 2500, "Varias marcas", ["perfume"], "perfumes"),
      P("Set de perfume", 600, 1800, "Estuche de regalo", ["perfume", "regalo"], "perfumes")
    ] },
    "sephora-altaria": { src: "Rangos estimados a partir de precios de lista en México (Chanel.com/mx, Palacio de Hierro, Bodega Aurrerá, Sears)", items: [
      P("Perfume Good Girl 80 ml", 2300, 3700, "Carolina Herrera", ["perfume", "good girl"], "perfumes"),
      P("Perfume Versace Dylan Blue 100 ml", 2200, 3000, "Versace", ["perfume", "versace", "dylan blue"], "perfumes"),
      P("Perfume Libre 50 ml", 1900, 2800, "Yves Saint Laurent", ["perfume", "libre"], "perfumes"),
      P("Perfume Sauvage 60 ml", 2200, 3200, "Dior", ["perfume", "sauvage"], "perfumes"),
      P("Perfume de nicho (30 ml)", 1800, 3500, "Fragancia de autor", ["perfume"], "perfumes"),
      P("Body mist", 250, 600, "Bruma corporal", ["perfume", "body mist"], "perfumes"),
      P("Set de perfumes miniatura", 500, 1500, "Para probar varios", ["perfume", "regalo"], "perfumes"),
      P("Labial", 250, 700, "Mate o cremoso", ["labial", "maquillaje"], "belleza"),
      P("Base de maquillaje", 400, 1200, "Cobertura media", ["base", "maquillaje"], "belleza"),
      P("Máscara de pestañas", 300, 800, "Volumen", ["mascara", "maquillaje"], "belleza"),
      P("Crema hidratante facial", 300, 1500, "Skincare", ["crema", "skincare"], "belleza"),
      P("Sérum facial", 450, 1800, "Skincare", ["serum", "skincare"], "belleza")
    ] },
    "levis-altaria": { src: "Referencias de Liverpool.com.mx y Sears.com.mx (nov-2026); «~» es rango estimado", items: [
      P("Jeans 501 original", 1100, 1500, "Lista $1,299 en tiendas departamentales", ["jeans", "501"], "ropa"),
      P("Jeans 511 slim", 1100, 1600, "Corte ajustado", ["jeans", "511"], "ropa"),
      P("Playera con logo", 329, 549, "Manga corta", ["playera"], "ropa"),
      P("Sudadera", 900, 1600, "Con capucha o cuello redondo", ["sudadera"], "ropa"),
      P("Chamarra de mezclilla", 1959, 2799, "Trucker", ["chamarra"], "ropa"),
      P("Cartera", 685, 979, "Piel o sintética", ["cartera"], "ropa")
    ] },
    "hm-altaria": { src: "Rangos estimados (sin lista de precios publicada para esta sucursal)", items: [
      P("Playera básica", 149, 299, "Algodón", ["playera"], "ropa"),
      P("Sudadera con capucha", 399, 799, "Unisex", ["sudadera"], "ropa"),
      P("Jeans", 499, 999, "Varios cortes", ["jeans"], "ropa"),
      P("Vestido", 399, 899, "Casual", ["vestido"], "ropa"),
      P("Chamarra", 699, 1499, "Ligera", ["chamarra"], "ropa"),
      P("Camisa casual", 299, 599, "Manga larga", ["camisa"], "ropa")
    ] },
    "zara-altaria": { src: "Rangos estimados (sin lista de precios publicada para esta sucursal)", items: [
      P("Playera", 299, 599, "Algodón", ["playera"], "ropa"),
      P("Sudadera", 599, 1099, "Cuello redondo o capucha", ["sudadera"], "ropa"),
      P("Jeans", 699, 1299, "Varios cortes", ["jeans"], "ropa"),
      P("Vestido", 799, 1799, "Casual o de fiesta", ["vestido"], "ropa"),
      P("Chamarra", 1199, 2499, "Ligera o abrigo", ["chamarra"], "ropa"),
      P("Zapatos", 899, 1999, "Casual", ["zapato"], "calzado")
    ] },
    "bershka-altaria": { src: "Rangos estimados (sin lista de precios publicada para esta sucursal)", items: [
      P("Playera", 150, 450, "Estampada o lisa", ["playera"], "ropa"),
      P("Sudadera", 350, 800, "Oversize", ["sudadera"], "ropa"),
      P("Jeans", 450, 900, "Baggy o recto", ["jeans"], "ropa"),
      P("Pantalón cargo", 450, 900, "Casual", ["pantalon", "cargo"], "ropa"),
      P("Vestido", 350, 800, "Casual", ["vestido"], "ropa"),
      P("Tenis", 600, 1200, "Casual", ["tenis"], "calzado")
    ] },
    "pull-bear-altaria": { src: "Rangos estimados (sin lista de precios publicada para esta sucursal)", items: [
      P("Playera", 150, 450, "Estampada o lisa", ["playera"], "ropa"),
      P("Sudadera", 350, 800, "Con capucha", ["sudadera"], "ropa"),
      P("Jeans", 450, 900, "Recto o baggy", ["jeans"], "ropa"),
      P("Pantalón jogger", 350, 700, "Casual", ["pantalon"], "ropa"),
      P("Chamarra", 600, 1400, "Ligera", ["chamarra"], "ropa")
    ] },
    "american-eagle-altaria": { src: "Liverpool.com.mx (precios web, nov-2026); «~» es rango estimado", items: [
      P("Jeans skinny lavado desgastado", 1399, 1999, "Hombre; lista $1,999 en Liverpool", ["jeans"], "ropa"),
      P("Jeans bota lavado obscuro", 1049, 1499, "Hombre; lista $1,499 en Liverpool", ["jeans"], "ropa"),
      P("Playera cuello redondo", 349, 699, "Algodón", ["playera"], "ropa"),
      P("Sudadera", 799, 1500, "Con capucha", ["sudadera"], "ropa"),
      P("Camisa casual", 599, 1100, "Manga larga", ["camisa"], "ropa")
    ] },
    "vans-altaria": { src: "MercadoLibre y Liverpool (nov-2026); «~» es rango estimado", items: [
      P("Tenis Old Skool", 1250, 1800, "Clásicos; ML $1,221 a $1,558", ["tenis", "old skool"], "calzado"),
      P("Tenis SK8-Hi", 1399, 1900, "Botín; ML $1,399", ["tenis", "sk8"], "calzado"),
      P("Tenis Authentic", 1100, 1600, "Bajos", ["tenis"], "calzado"),
      P("Tenis Old Skool Stackform", 1600, 2300, "Plataforma mujer", ["tenis", "stackform"], "calzado"),
      P("Playera con logo", 400, 700, "Algodón", ["playera"], "ropa"),
      P("Sudadera", 800, 1500, "Con capucha", ["sudadera"], "ropa"),
      P("Mochila", 600, 1200, "Diario", ["mochila"], "ropa")
    ] },
    "adidas-altaria": { src: "Rangos estimados; promedio de tenis de marca en México ≈ $1,600 (Statista/Preciosmundi, dic-2023)", items: [
      P("Tenis Samba", 1900, 2800, "Clásico urbano", ["tenis", "samba"], "calzado"),
      P("Tenis Superstar", 1800, 2600, "Punta de concha", ["tenis", "superstar"], "calzado"),
      P("Tenis Campus", 1700, 2500, "Gamuza", ["tenis", "campus"], "calzado"),
      P("Tenis de running", 1500, 3000, "Entrenamiento", ["tenis", "running"], "calzado"),
      P("Playera deportiva", 400, 900, "Algodón o poliéster", ["playera"], "ropa"),
      P("Sudadera", 900, 1800, "Con capucha", ["sudadera"], "ropa"),
      P("Pants jogger", 700, 1500, "Entrenamiento", ["pantalon", "pants"], "ropa")
    ] },
    "puma-altaria": { src: "Rangos estimados; promedio de tenis de marca en México ≈ $1,600 (Statista/Preciosmundi, dic-2023)", items: [
      P("Tenis Suede", 1400, 2200, "Clásico", ["tenis", "suede"], "calzado"),
      P("Tenis de running", 1200, 2800, "Entrenamiento", ["tenis", "running"], "calzado"),
      P("Tenis Speedcat", 1900, 2800, "Estilo retro", ["tenis"], "calzado"),
      P("Playera deportiva", 400, 900, "Con logo", ["playera"], "ropa"),
      P("Sudadera", 800, 1800, "Con capucha", ["sudadera"], "ropa"),
      P("Shorts deportivos", 400, 900, "Entrenamiento", ["pantalon", "shorts"], "ropa")
    ] },
    "skechers-altaria": { src: "Rangos estimados (sin lista de precios publicada para esta sucursal)", items: [
      P("Tenis para caminar", 1200, 2200, "Plantilla acolchada", ["tenis"], "calzado"),
      P("Tenis de running", 1500, 2800, "Entrenamiento", ["tenis", "running"], "calzado"),
      P("Tenis sin agujetas", 1300, 2400, "Slip-on", ["tenis"], "calzado"),
      P("Zapato casual", 1200, 2300, "Diario", ["zapato"], "calzado"),
      P("Sandalia", 700, 1500, "Verano", ["sandalia"], "calzado")
    ] },
    "flexi-altaria": { src: "Rangos estimados (sin lista de precios publicada para esta sucursal)", items: [
      P("Zapato casual hombre", 900, 1700, "Piel", ["zapato"], "calzado"),
      P("Zapato de vestir hombre", 1000, 1900, "Piel", ["zapato"], "calzado"),
      P("Tenis casual", 800, 1500, "Diario", ["tenis"], "calzado"),
      P("Flat mujer", 700, 1300, "Comodidad", ["zapato", "flat"], "calzado"),
      P("Sandalia mujer", 600, 1200, "Verano", ["sandalia"], "calzado"),
      P("Bota", 1100, 2200, "Piel", ["bota"], "calzado")
    ] },
    "gong-cha-altaria": { brand: "#7A4B2A", items: [
      E("Té con leche + perlas", 65, 95, "🧋", "Bebida mediana", ["te", "boba", "perlas", "milk tea"], "solo", "cafe")
    ] },
    "cinepolis-altaria": { brand: "#1565C0", items: [
      E("Boleto de cine", 70, 110, "🎟️", "Entrada general (varía por sala y día)", ["boleto", "cine", "pelicula"], "solo", "entretenimiento"),
      E("Combo palomitas + refresco", 140, 210, "🍿", "Combo individual", ["palomitas", "cine", "combo"], "combo", "comida")
    ] }
  };

  MENUS["liverpool-villasuncion"] = MENUS["liverpool-altaria"];

  for (const s of D.STORES) {
    const m = MENUS[s.id];
    if (!m) continue;
    if (m.brand) { s.brand = m.brand; s.brandInk = m.ink || "#fff"; }
    s.menu = true;
    s.menuNote = m.src ? m.src + ". Cambian por sucursal y canal." : SRC;
    const keep = (s.items || []).filter((i) => !(i.estimated && ["Comida", "Café / bebida", "Comida preparada"].includes(i.name)) && i.exact);
    const cats = new Set(m.items.map((i) => i.cat));
    s.items = m.items.concat(keep);
    s.cats = [...new Set(s.cats.concat([...cats]))];
  }

  // Emoji y color por categoría para todo lo que no tenga foto ni emoji propio
  const CAT_EMOJI = { ropa: "👕", calzado: "👟", perfumes: "🧴", belleza: "💄", comida: "🍔", cafe: "☕", postres: "🍨", super: "🛒", juguetes: "🧸", regalos: "🎁", deportes: "🏃", hogar: "🛋️", decoracion: "🪴", tecnologia: "🎧", entretenimiento: "🎬", mascotas: "🐾", opticas: "👓", papeleria: "✏️", otros: "🛍️" };
  const CAT_HUE = { ropa: 215, calzado: 200, perfumes: 285, belleza: 330, comida: 24, cafe: 30, postres: 345, super: 140, juguetes: 50, regalos: 8, deportes: 165, hogar: 35, decoracion: 100, tecnologia: 230, entretenimiento: 265, mascotas: 20, opticas: 190, papeleria: 55, otros: 150 };
  const api = { MENUS, CAT_EMOJI, CAT_HUE };
  root.GASTABOT_MENUS = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
