// Identidad visual de cada producto (v1.1): qué ES el producto (tacón, bota, polo…), cómo buscarlo en fotos
// y qué variedad ofrece cada tienda. Sin dependencias; navegador y Node.
//
// Por qué existe: antes todo el calzado se buscaba como «sneakers» y toda la ropa como «t-shirt», así que
// un tacón de Liverpool salía con un tenis de portada. Ahora cada producto tiene un TIPO exacto y la foto
// solo se acepta si su título/descripción coincide con ese tipo (si ninguna coincide, se queda la ilustración).
//
// Los tipos de cada tienda (LINEUP) salen de las categorías públicas de sus catálogos en línea
// (consultadas 2026-11-19: Liverpool, Flexi, Cuadra, Zara, Mango…) y, donde no pude verlas, del giro de la marca.
// Los PRECIOS siguen siendo estimaciones: cada tipo toma un tramo del rango de la tienda.
(function (root) {
  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  // [clave, nombre, ilustración, consultas (inglés, de la más a la menos específica), debe(regex), no debe(regex), tramo de precio, etiquetas, descripción]
  const T = {};
  const def = (key, label, art, q, must, not, p, tags, d) => { T[key] = { key, label, art, q, must: must ? new RegExp(must, "i") : null, not: not ? new RegExp(not, "i") : null, p, tags, d }; };
  const NOSHOE = "sneaker|trainer|running|football|soccer|cleat|ski|skate";

  // ---------- Calzado ----------
  def("tacones", "Tacones", "heel", ["high heels shoes", "stiletto heels", "women pumps shoes"], "heel|stiletto|pump", NOSHOE + "|boot|sandal.*flat", [0.3, 0.9], ["tacon", "tacones", "zapatilla", "zapatillas"], "Zapatillas con tacón para vestir, de piel o sintético. Altura y tipo de tacón por confirmar en tienda.");
  def("botas", "Botas", "boot", ["leather boots", "knee high boots", "women boots fashion"], "boot", NOSHOE + "|cowboy hat|rain|rubber", [0.3, 0.9], ["bota", "botas"], "Bota de caña media o alta. Revisa material (piel o sintético) y suela.");
  def("botines", "Botines", "boot", ["ankle boots", "chelsea boots", "booties shoes"], "ankle|chelsea|bootie|boot", NOSHOE + "|rain|rubber", [0.25, 0.85], ["botin", "botines", "bota"], "Bota corta a la altura del tobillo, versátil para diario.");
  def("bota_vaquera", "Botas vaqueras", "cowboy", ["cowboy boots", "western boots leather"], "cowboy|western|boot", NOSHOE + "|hat", [0.3, 1], ["bota", "botas", "vaquera", "vaqueras", "texana"], "Bota vaquera tradicional, normalmente de piel, con tacón escalonado y punta redondeada o cuadrada.");
  def("tenis_casual", "Tenis casuales", "sneaker", ["white sneakers", "casual sneakers shoes", "canvas sneakers"], "sneaker|trainer|shoe", "heel|boot|sandal|football|soccer|cleat|skate|running|dress|oxford|loafer", [0.15, 0.7], ["tenis", "sneakers"], "Tenis de uso diario, de lona, piel o sintético; pensados para comodidad más que para entrenar.");
  def("tenis_dep", "Tenis deportivos", "sneaker", ["running shoes", "athletic shoes sport", "training shoes sneakers"], "running|trainer|athletic|sport|sneaker|shoe", "heel|boot|sandal|football|soccer|cleat|dress|oxford|loafer", [0.2, 0.9], ["tenis", "deportivos", "running", "correr"], "Tenis para correr o entrenar, con amortiguación y suela de agarre.");
  def("tenis_outdoor", "Tenis de montaña", "sneaker", ["trail running shoes", "hiking shoes", "hiking boots"], "trail|hiking|hike|boot|shoe", "heel|sandal|football|soccer|dress|loafer", [0.3, 1], ["tenis", "outdoor", "trail", "senderismo"], "Calzado para senderos y terreno irregular: suela de tacos y mayor soporte.");
  def("skate", "Tenis skate", "sneaker", ["Vans Old Skool", "skate shoes", "slip-on sneakers"], "vans|skate|old skool|slip-?on", "heel|boot|sandal|football|soccer|dress|loafer", [0.1, 0.6], ["tenis", "skate", "vans"], "Tenis planos de lona o gamuza con suela vulcanizada, estilo skate.");
  def("futbol", "Tacos de fútbol", "sneaker", ["football boots cleats", "soccer cleats"], "cleat|football boot|soccer|boot", "heel|sandal|dress|loafer|hiking", [0.2, 1], ["tacos", "futbol", "fútbol"], "Calzado con tacos para cancha de pasto natural o sintético.");
  def("zapato_vestir", "Zapatos de vestir", "loafer", ["oxford dress shoes", "men dress shoes leather", "derby shoes brogue"], "oxford|derby|dress shoe|brogue|leather shoe|monk", NOSHOE + "|boot|heel|sandal", [0.2, 0.9], ["zapato", "zapatos", "vestir", "formal"], "Zapato cerrado de vestir, normalmente de piel, para oficina o eventos.");
  def("zapato_casual", "Zapatos casuales", "loafer", ["casual leather shoes", "boat shoes", "derby shoes casual"], "shoe|boat|derby|loafer|oxford", NOSHOE + "|boot|heel|sandal", [0.15, 0.7], ["zapato", "zapatos", "casual"], "Zapato cerrado cómodo para diario, de piel o sintético.");
  def("mocasin", "Mocasines", "loafer", ["loafers shoes", "moccasin loafers leather"], "loafer|moccasin", NOSHOE + "|boot|heel|sandal", [0.2, 0.8], ["mocasin", "mocasines"], "Zapato sin agujetas, de corte bajo, entre casual y de vestir.");
  def("sandalia", "Sandalias", "sandal", ["sandals footwear", "women sandals", "leather sandals"], "sandal", "boot|sneaker|heel", [0.1, 0.6], ["sandalia", "sandalias"], "Calzado abierto para clima cálido; hay planas, de plataforma y deportivas.");
  def("flats", "Flats y balerinas", "loafer", ["ballet flats shoes", "ballerina flats"], "flat|ballet|ballerina", "sneaker|boot|heel|sandal", [0.1, 0.6], ["flat", "flats", "balerina", "balerinas"], "Zapato plano y cerrado de la punta, cómodo y elegante.");
  def("pantufla", "Pantuflas", "loafer", ["slippers footwear", "house slippers"], "slipper", "ruby|glass|boot", [0.05, 0.4], ["pantufla", "pantuflas"], "Calzado suave para estar en casa.");
  def("clog", "Zuecos (clogs)", "sandal", ["Crocs clogs", "clog shoes"], "croc|clog", "boot|heel|sneaker", [0.1, 0.8], ["zueco", "zuecos", "clog", "crocs"], "Zueco ligero de espuma moldeada, fácil de lavar.");
  def("ugg", "Botas de borrego", "boot", ["UGG boots sheepskin", "sheepskin boots", "shearling boots"], "ugg|sheepskin|shearling|fur|boot", "cowboy|rain|rubber|ski", [0.3, 1], ["bota", "botas", "borrego", "ugg"], "Bota forrada de borrego o similar, muy calientita; pensada para frío.");
  def("bota_trabajo", "Botas de trabajo", "boot", ["work boots", "Timberland boots", "hiking boots leather"], "work|timberland|hiking|boot", "heel|sandal|ski|rain|rubber", [0.3, 1], ["bota", "botas", "trabajo"], "Bota resistente de piel con suela gruesa para uso rudo o campo.");
  def("calzado_gen", "Calzado", "shoe", ["shoes footwear pair", "shoes"], "shoe|footwear|boot|sandal|sneaker", "", [0, 1], ["zapato", "zapatos", "calzado"], "Calzado; confirma el modelo en tienda.");

  // ---------- Ropa ----------
  def("playera", "Playera básica", "shirt", ["plain t-shirt", "white t-shirt", "black t-shirt crew neck"], "t-?shirt|tee\\b", "polo|dress|hoodie|sweatshirt|jersey|football", [0, 0.5], ["playera", "camiseta"], "Playera lisa de cuello redondo, de algodón o mezcla.");
  def("playera_est", "Playera estampada", "shirt", ["graphic t-shirt", "printed t-shirt", "t-shirt with print"], "t-?shirt|tee\\b", "polo|dress|hoodie|jersey|football", [0.3, 0.8], ["playera", "camiseta", "estampada"], "Playera con gráfico o estampado.");
  def("polo", "Polo", "polo", ["polo shirt", "men polo shirt pique"], "polo", "water polo|polo player|horse|match|pony|mallet", [0.3, 1], ["polo", "playera"], "Playera con cuello y botones, de piqué. Más formal que una playera básica.");
  def("camisa", "Camisa", "shirt", ["dress shirt men", "button-up shirt", "white dress shirt"], "shirt", "t-?shirt|tee\\b|polo|football", [0.3, 1], ["camisa"], "Camisa abotonada, de vestir o casual.");
  def("blusa", "Blusa", "shirt", ["women blouse", "blouse clothing"], "blouse|top", "", [0.2, 0.8], ["blusa", "top"], "Blusa ligera para mujer.");
  def("sudadera", "Sudadera con capucha", "hoodie", ["hoodie sweatshirt", "pullover hoodie"], "hood|sweatshirt", "zip.*jacket", [0.2, 0.8], ["sudadera", "hoodie"], "Sudadera con capucha, de felpa o algodón.");
  def("sueter", "Suéter", "hoodie", ["knit sweater", "wool sweater pullover", "cardigan knitwear"], "sweater|jumper|pullover|cardigan|knit", "", [0.3, 1], ["sueter", "suéter", "sudadera"], "Suéter o cárdigan de punto para temporada fresca.");
  def("jeans", "Jeans", "pants", ["blue jeans denim", "jeans clothing folded", "denim pants"], "jean|denim", "jacket|skirt|shorts", [0.1, 0.8], ["jeans", "pantalon", "mezclilla"], "Pantalón de mezclilla. Revisa el corte (recto, slim, skinny) y el lavado.");
  def("pantalon_vestir", "Pantalón de vestir", "pants", ["dress trousers", "chino pants", "suit trousers"], "trouser|chino|pant|slack", "jean|denim|short|sweat|jogger", [0.2, 0.9], ["pantalon", "vestir", "chino"], "Pantalón de tela para oficina o salir; hay de corte recto y slim.");
  def("jogger", "Jogger y pants", "pants", ["jogger pants", "sweatpants", "track pants"], "jogger|sweatpant|track ?pant|sweat|pant", "jean|denim|suit", [0.1, 0.6], ["jogger", "pants", "pantalon"], "Pantalón deportivo o de calle con puño ajustado.");
  def("short", "Shorts y bermudas", "pants", ["shorts clothing", "bermuda shorts", "denim shorts"], "short", "short film|short story|shortbread|shorten|short circuit", [0, 0.5], ["short", "shorts", "bermuda"], "Short o bermuda para clima caluroso.");
  def("vestido", "Vestido", "dress", ["dress women fashion", "summer dress", "cocktail dress"], "dress|gown", "dress code|address|dress shoe|dress shirt|dressing|dresser|dress uniform|military", [0.2, 1], ["vestido"], "Vestido de corte casual o de salir.");
  def("falda", "Falda", "skirt", ["skirt clothing", "women skirt fashion", "pleated skirt"], "skirt", "kilt|hula|tank", [0.1, 0.7], ["falda"], "Falda corta, midi o larga.");
  def("chamarra_mezclilla", "Chamarra de mezclilla", "jacket", ["denim jacket", "jean jacket"], "denim|jean", "skirt|pants|shorts", [0.2, 0.8], ["chamarra", "mezclilla"], "Chamarra clásica de mezclilla.");
  def("chamarra", "Chamarra", "jacket", ["jacket outerwear", "bomber jacket", "leather jacket clothing"], "jacket", "life ?jacket|dust jacket|book|flak|straight|yellow ?jacket", [0.3, 1], ["chamarra", "chaqueta"], "Chamarra para media estación.");
  def("impermeable", "Chamarra impermeable", "jacket", ["rain jacket", "The North Face jacket", "softshell jacket", "parka jacket"], "jacket|parka|rain|shell|north face", "life ?jacket|dust jacket|book|flak|straight", [0.4, 1], ["chamarra", "impermeable", "outdoor"], "Chamarra para lluvia, viento o montaña.");
  def("abrigo", "Abrigo", "jacket", ["wool coat clothing", "overcoat winter"], "coat", "coat of arms|lab coat|raccoon|labcoat|coating|raincoat.*dog", [0.4, 1], ["abrigo"], "Abrigo largo para frío.");
  def("blazer", "Blazer", "jacket", ["blazer jacket women", "suit jacket blazer"], "blazer|suit jacket", "", [0.3, 1], ["blazer", "saco"], "Saco estructurado para oficina o eventos.");
  def("traje", "Traje", "jacket", ["men suit", "business suit"], "suit", "swim|space|lawsuit|pursuit|jumpsuit|wetsuit|catsuit|spacesuit|card", [0.4, 1], ["traje", "formal"], "Traje de dos piezas (saco y pantalón).");
  def("pijama", "Pijama", "pj", ["pajamas set", "pyjamas sleepwear"], "pajama|pyjama|sleepwear|nightwear", "", [0.1, 0.7], ["pijama"], "Conjunto de dormir.");
  def("leggings", "Leggings", "pants", ["leggings clothing", "tights leggings"], "legging|tights", "", [0.1, 0.6], ["leggings"], "Leggings ajustados para diario o ejercicio.");
  def("calcetines", "Calcetines", "sock", ["socks pair", "colorful socks"], "sock", "", [0, 0.3], ["calcetines", "calcetin"], "Calcetines, normalmente en paquete.");
  def("gorra", "Gorra", "cap", ["baseball cap", "New Era cap snapback"], "cap|hat", "capital|capacitor|bottle cap|kneecap|madrid|ice cap", [0, 0.8], ["gorra"], "Gorra de beisbol con visera.");
  def("ropa_dep", "Playera deportiva", "shirt", ["sports jersey", "athletic t-shirt", "dri-fit shirt"], "jersey|sport|athletic|shirt", "football pitch|stadium|crowd", [0.1, 0.7], ["playera", "deportiva", "jersey"], "Playera de tela técnica que absorbe el sudor.");
  def("ropa_bebe", "Ropa de bebé", "shirt", ["baby clothes onesie", "baby bodysuit clothing"], "baby|onesie|bodysuit|infant|child", "", [0, 1], ["bebe", "bebé", "ropa"], "Ropa de bebé o niño pequeño: bodies, conjuntos y pijamas.");
  def("ropa_gen", "Ropa", "hanger", ["clothes on hangers", "clothing rack", "garments clothing"], "cloth|rack|garment|hanger|shirt|dress|jacket|apparel", "", [0, 1], ["ropa", "prenda"], "Prenda de vestir; confirma modelo y talla en tienda.");

  // ---------- Belleza, joyería, ópticas ----------
  def("perfume", "Perfume", "perfume", ["perfume bottle", "eau de parfum bottle", "fragrance bottle"], "perfume|parfum|cologne|fragrance|eau de|bottle", "", [0, 1], ["perfume", "fragancia", "colonia"], "Fragancia en frasco; revisa tamaño (ml) y si es edt o edp.");
  def("labial", "Labiales", "lipstick", ["lipstick", "lipstick makeup"], "lipstick|lip", "", [0, 0.5], ["labial", "maquillaje"], "Labial de barra o líquido.");
  def("base_maq", "Maquillaje", "lipstick", ["makeup cosmetics", "makeup palette eyeshadow", "foundation makeup brush"], "makeup|cosmetic|foundation|palette|brush|eyeshadow|blush", "", [0.1, 0.8], ["maquillaje", "base"], "Base, sombras, rubor o brochas.");
  def("skincare", "Cuidado de la piel", "jar", ["face cream jar", "skincare serum bottle", "moisturizer cream"], "cream|serum|skin|lotion|jar|moistur", "", [0.1, 1], ["skincare", "crema", "serum"], "Crema, sérum o limpiador para la piel.");
  def("pulsera", "Pulseras", "bracelet", ["bracelet jewelry", "charm bracelet", "silver bracelet"], "bracelet|bangle|charm", "", [0.1, 0.8], ["pulsera", "joyeria"], "Pulsera o brazalete; algunas marcas venden charms por separado.");
  def("anillo", "Anillos", "ring", ["ring jewelry", "silver ring", "gold ring jewellery"], "ring", "boxing|ringtone|ring road|bell|key ?ring|keyring|circus|saturn|ring-tailed|ringed|wedding|napkin|ring binder", [0.1, 0.8], ["anillo", "joyeria"], "Anillo de plata, oro o fantasía.");
  def("collar", "Collares", "necklace", ["necklace pendant", "silver necklace jewelry"], "necklace|pendant|chain", "", [0.1, 1], ["collar", "joyeria"], "Collar con dije o cadena.");
  def("aretes", "Aretes", "earring", ["earrings jewelry", "silver earrings"], "earring|stud", "", [0, 0.6], ["aretes", "joyeria"], "Aretes o arracadas.");
  def("lentes_sol", "Lentes de sol", "glasses", ["sunglasses", "aviator sunglasses"], "sunglass|aviator|wayfarer", "", [0.1, 1], ["lentes", "sol", "gafas"], "Lentes de sol con protección UV; confirma la etiqueta UV400.");
  def("armazon", "Armazones", "glasses", ["eyeglasses frames", "prescription glasses"], "eyeglass|glasses|spectacle|frame", "sunglass|wine|drinking|magnif|camera|window", [0.1, 1], ["lentes", "armazon", "armazón", "graduados"], "Armazón para graduar; la mica se cobra aparte en la óptica.");

  // ---------- Tecnología, hogar, juguetes, deportes ----------
  def("funda", "Fundas de celular", "phone", ["smartphone case", "phone case cover"], "case|cover", "briefcase|suitcase|pillow|book|pencil|camera case|violin|jewel|cabinet|display case|case study|vase", [0, 0.6], ["funda", "carcasa", "celular"], "Funda protectora para celular.");
  def("cargador", "Cargadores y cables", "cable", ["phone charger usb", "usb cable charger", "power bank"], "charger|usb|cable|adapter|power bank|plug", "", [0, 0.6], ["cargador", "cable", "accesorio"], "Cargador, cable o batería externa.");
  def("audifonos", "Audífonos", "headphones", ["headphones", "wireless earbuds", "earphones"], "headphone|earbud|earphone|headset|airpod", "", [0.1, 1], ["audifonos", "audífonos"], "Audífonos de diadema o internos.");
  def("celular", "Celulares", "phone", ["smartphone", "mobile phone", "android smartphone"], "phone|smartphone|galaxy|iphone|huawei|android", "booth|rotary|pay ?phone|telephone box|landline|cordless|vintage", [0.1, 1], ["celular", "telefono", "teléfono"], "Celular; el precio varía mucho por modelo y almacenamiento.");
  def("consola", "Videojuegos y consolas", "controller", ["video game controller", "game console gamepad"], "controller|gamepad|console|joystick|game", "", [0.1, 1], ["videojuego", "consola", "gamer"], "Videojuego, control o consola.");
  def("sofa", "Sofás y salas", "sofa", ["sofa living room", "couch furniture"], "sofa|couch|settee|living", "", [0.2, 1], ["sofa", "sofá", "sala", "mueble"], "Sofá o sala; confirma medidas y tela.");
  def("colchon", "Colchones", "bed", ["mattress bed", "bed mattress bedroom"], "mattress|bed", "bedbug|hospital|pressure|air bed", [0.1, 1], ["colchon", "colchón", "cama"], "Colchón individual, matrimonial o king.");
  def("lampara", "Lámparas", "lamp", ["table lamp", "floor lamp interior"], "lamp|light", "street|stage|flash|head|torch|projector|police|traffic", [0, 0.7], ["lampara", "lámpara", "decoracion"], "Lámpara de mesa o de piso.");
  def("cojin", "Cojines y decoración", "sofa", ["decorative pillow cushion", "throw pillow sofa"], "pillow|cushion|throw", "", [0, 0.5], ["cojin", "cojín", "decoracion"], "Cojines y detalles de decoración.");
  def("lego", "Sets de LEGO", "toy", ["Lego bricks set", "Lego minifigure"], "lego|brick", "", [0, 1], ["lego", "juguete", "armar"], "Set de bloques para armar; el precio depende de las piezas.");
  def("peluche", "Peluches", "toy", ["stuffed toy teddy bear", "plush toy"], "plush|teddy|stuffed", "", [0, 0.6], ["peluche", "juguete"], "Peluche suave para regalo.");
  def("juguete", "Juguetes", "toy", ["toys children", "toy cars", "board game"], "toy|game|doll|car", "", [0, 1], ["juguete", "juguetes"], "Juguete; revisa la edad recomendada.");
  def("suplemento", "Suplementos", "jar", ["protein powder supplement", "sports nutrition tub"], "protein|supplement|powder|tub|whey", "", [0.1, 1], ["suplemento", "proteina", "proteína", "gym"], "Proteína o suplemento deportivo.");
  def("pesas", "Equipo de gimnasio", "weight", ["dumbbells gym", "gym equipment weights"], "dumbbell|weight|gym|barbell|kettlebell", "", [0.1, 1], ["pesas", "gym", "deporte"], "Pesas y accesorios de entrenamiento.");
  def("balon", "Balones", "ball", ["soccer ball", "basketball ball"], "ball", "ballroom|ballet|ballot|balloon|ball python|ball bearing|ball pit|ballpark|eight ball|ballpoint", [0, 0.6], ["balon", "balón", "deporte"], "Balón de fútbol o basquetbol.");
  def("mascota", "Mascotas", "paw", ["dog food bowl", "pet accessories dog"], "dog|cat|pet|puppy|kitten", "", [0, 1], ["mascota", "perro", "gato"], "Alimento o accesorios para mascota.");
  def("papeleria", "Papelería", "pencil", ["notebook pencil stationery", "stationery school supplies"], "notebook|pencil|stationery|pen\\b|supplies", "", [0, 1], ["papeleria", "papelería", "util", "útiles"], "Cuadernos, plumas y útiles.");
  def("regalo", "Detalles y regalos", "gift", ["gift box ribbon", "wrapped gift present"], "gift|present|box", "", [0, 1], ["regalo", "detalle"], "Detalle para regalar.");
  def("super", "Despensa", "bag", ["grocery shopping basket", "supermarket groceries", "food groceries"], "grocer|supermarket|food|basket|market|shopping", "", [0, 1], ["despensa", "super", "súper"], "Despensa y mandado.");

  // ---------- Comida y bebida ----------
  def("burger", "Hamburguesas", "burger", ["hamburger cheeseburger", "burger fast food"], "burger", "king crab|burger king restaurant|building|truck|sign|logo|store|exterior", [0, 1], ["hamburguesa", "burger"], "Hamburguesa; revisa si incluye papas y bebida.");
  def("papas", "Papas", "fries", ["french fries", "fries fast food"], "fries|chips|potato", "", [0, 1], ["papas"], "Papas a la francesa.");
  def("pizza", "Pizza", "pizza", ["pizza", "pizza margherita"], "pizza", "hut|building|oven|restaurant|delivery|truck|box|sign", [0, 1], ["pizza"], "Pizza individual o familiar.");
  def("pollo", "Pollo frito", "chicken", ["fried chicken", "chicken wings", "chicken nuggets"], "chicken|wing|nugget", "", [0, 1], ["pollo", "alitas", "nuggets"], "Pollo frito, alitas o nuggets.");
  def("sushi", "Sushi", "sushi", ["sushi rolls", "sushi plate"], "sushi|roll|maki|nigiri", "", [0, 1], ["sushi", "rollo"], "Rollos de sushi.");
  def("tacos", "Tacos", "taco", ["tacos mexican food", "tacos al pastor"], "taco", "", [0, 1], ["tacos", "taco"], "Tacos.");
  def("pasta", "Pasta", "pasta", ["spaghetti plate", "pasta dish italian", "lasagne"], "pasta|spaghetti|lasagn|fettucc|penne|noodle", "", [0, 1], ["pasta", "spaghetti"], "Plato de pasta.");
  def("ensalada", "Ensaladas y bowls", "salad", ["salad bowl", "poke bowl"], "salad|bowl|poke", "", [0, 1], ["ensalada", "bowl"], "Ensalada o bowl.");
  def("sandwich", "Sándwiches y subs", "sandwich", ["submarine sandwich", "sandwich"], "sandwich|sub|baguette", "", [0, 1], ["sandwich", "sub"], "Sándwich o sub.");
  def("parrilla", "Carne y parrilla", "plate", ["grilled meat steak", "barbecue ribs"], "steak|grill|meat|ribs|barbecue|bbq|asado", "", [0, 1], ["carne", "parrilla", "asada"], "Cortes y platillos a la parrilla.");
  def("postre", "Postres", "dessert", ["cheesecake slice", "chocolate cake slice", "dessert plate"], "cake|dessert|pastry|cheesecake|tart|pie|brownie", "", [0, 1], ["postre", "pastel"], "Postre individual.");
  def("helado", "Helados", "dessert", ["ice cream cone", "ice cream scoops", "gelato"], "ice cream|gelato|sundae|cone", "", [0, 1], ["helado", "nieve"], "Helado, nieve o paleta.");
  def("rol", "Rollos y donas", "dessert", ["cinnamon roll", "donuts"], "cinnamon|roll|donut|doughnut", "", [0, 1], ["rol", "dona", "dona"], "Rol de canela o dona.");
  def("cafe", "Café", "cup", ["cup of coffee", "latte coffee", "coffee cup"], "coffee|latte|cappuccino|espresso", "bean|machine|plant|farm|shop interior|roaster", [0, 1], ["cafe", "café", "latte"], "Café caliente o frío.");
  def("frappe", "Frappés", "boba", ["frappuccino iced coffee", "iced coffee drink"], "frapp|iced|ice|cold", "", [0, 1], ["frappe", "frappé"], "Bebida fría de café.");
  def("te", "Té y boba", "boba", ["bubble tea", "matcha latte", "tea cup"], "bubble|boba|matcha|tea", "", [0, 1], ["te", "té", "boba", "matcha"], "Té, matcha o bubble tea.");
  def("crepa", "Crepas", "dessert", ["crepe sweet", "crepes plate"], "crepe|crêpe", "", [0, 1], ["crepa", "crepas"], "Crepa dulce o salada.");
  def("palomitas", "Palomitas", "popcorn", ["popcorn", "popcorn bucket"], "popcorn", "", [0, 1], ["palomitas"], "Palomitas y combos de cine.");
  def("boleto", "Boletos de cine", "ticket", ["cinema tickets", "movie theater seats"], "cinema|movie|ticket|theater|theatre", "", [0, 1], ["boleto", "cine"], "Entrada de cine.");
  def("refresco", "Bebidas", "soda", ["soda can", "soft drink"], "soda|drink|can|cola", "", [0, 1], ["refresco", "bebida"], "Refresco o bebida.");
  def("comida_gen", "Comida", "plate", ["restaurant meal plate", "meal food plate"], "meal|food|plate|dish", "", [0, 1], ["comida"], "Platillo del restaurante.");

  // ---------- v2.3: catálogo de tiendas departamentales y productos locales ----------
  def("tv", "Pantallas y TV", "tv", ["smart tv television", "led television living room", "flat screen tv"], "television|tv\\b|screen|smart", "remote|antenna|broadcast|studio|tower|set.?top|cctv|camera|projector|billboard", [0, 1], ["pantalla", "tv", "television"], "Pantalla Smart TV; revisa pulgadas, resolución y sistema.");
  def("moto", "Motos y cuatrimotos", "moto", ["motorcycle", "scooter motorbike", "quad bike atv"], "motorcycle|motorbike|scooter|moped|quad|atv|bike", "helmet|racing|motogp|museum|bicycle|crash|police|vintage|show", [0, 1], ["moto", "motocicleta", "cuatrimoto"], "Vehículo de dos o cuatro ruedas; confirma cilindrada, año y financiamiento.");
  def("cabecera", "Camas y cabeceras", "bed", ["bed headboard bedroom", "wooden bed frame", "double bed bedroom furniture"], "bed|headboard|bedroom", "hospital|bedbug|flower|river|sea", [0, 1], ["cabecera", "cama", "mueble"], "Cama o cabecera; confirma medida (individual, matrimonial, king) y material.");
  def("closet", "Roperos y closets", "closet", ["wardrobe closet furniture", "wooden wardrobe", "armoire"], "wardrobe|closet|armoire", "walk-?in|fashion|clothes rack", [0, 1], ["ropero", "closet", "armario", "mueble"], "Ropero o closet; confirma medidas y número de puertas.");
  def("tocador", "Tocadores y burós", "closet", ["dressing table vanity", "bedside table nightstand", "chest of drawers dresser"], "vanity|dressing|nightstand|bedside|dresser|drawers|table", "makeup artist|barber", [0, 1], ["tocador", "buro", "buró", "comoda", "cómoda", "mueble"], "Mueble de recámara; confirma medidas y acabado.");
  def("rubor", "Rubores y paletas", "lipstick", ["blush makeup palette", "eyeshadow palette", "makeup compact powder"], "blush|palette|eyeshadow|compact|powder|makeup", "", [0, 1], ["rubor", "paleta", "sombras", "maquillaje"], "Maquillaje en polvo, rubor o paleta de sombras.");
  def("cartera", "Carteras y bolsas", "bag", ["leather wallet", "women wallet purse", "leather handbag"], "wallet|purse|handbag|bag", "backpack|shopping bag|paper bag|plastic", [0, 1], ["cartera", "bolsa", "monedero"], "Cartera o bolsa de mano.");
  // Productos locales (Precios locales)
  def("huevo", "Huevo", "egg", ["chicken eggs", "eggs carton", "white eggs"], "egg", "easter|painted|nest|boiled|fried", [0, 1], ["huevo"], "Huevo de gallina, por kilo o por caja.");
  def("pan", "Pan y tortilla", "bread", ["bread loaf bakery", "mexican sweet bread", "corn tortillas"], "bread|bakery|tortilla|bun|loaf|pan dulce", "sandwich|toast", [0, 1], ["pan", "tortilla", "bolillo"], "Pan de panadería o tortilla de maíz.");
  def("granos", "Granos y abarrotes secos", "sack", ["beans dried legumes", "rice grains", "sugar bag", "flour bag"], "bean|rice|sugar|flour|grain|legume|lentil", "", [0, 1], ["frijol", "arroz", "azucar", "azúcar", "harina", "lenteja"], "Granos y secos de despensa, por kilo o bulto.");
  def("leche", "Leche y lácteos", "bottle", ["milk bottle", "milk carton dairy", "cheese dairy"], "milk|dairy|cheese|yogurt|cream", "", [0, 1], ["leche", "queso", "crema", "yogurt"], "Lácteos: leche, queso, crema.");
  def("aceite", "Aceite y condimentos", "bottle", ["cooking oil bottle", "vegetable oil", "spices condiments"], "oil|spice|condiment|salt|sauce", "motor|engine|essential|massage", [0, 1], ["aceite", "sal", "salsa"], "Aceite de cocina y condimentos.");
  def("verdura", "Verduras y frutas", "veg", ["fresh vegetables market", "fresh fruit market", "tomatoes onions"], "vegetable|fruit|tomato|onion|potato|market|apple|banana|orange|lemon|avocado|pepper", "", [0, 1], ["jitomate", "tomate", "cebolla", "papa", "limon", "limón", "fruta", "verdura", "aguacate"], "Frutas y verduras del mercado, por kilo.");
  def("carne", "Carnes", "meat", ["raw beef meat butcher", "raw chicken meat", "pork meat butcher"], "meat|beef|chicken|pork|butcher|steak", "cooked|grilled|bbq|restaurant|burger", [0, 1], ["carne", "res", "pollo", "cerdo", "bistec", "pechuga"], "Carne cruda de carnicería, por kilo.");
  def("madera", "Madera y triplay", "plank", ["lumber wood planks", "plywood sheets", "pine wood boards"], "lumber|wood|plywood|plank|board|timber", "floor|forest|tree|log cabin|fire", [0, 1], ["madera", "pino", "triplay", "tablon", "tablón", "mdf", "polin", "polín"], "Madera para carpintería y construcción; confirma medidas (grosor, ancho, largo).");
  def("cemento", "Cemento y obra", "sack", ["cement bags construction", "construction bricks", "sand gravel construction"], "cement|brick|sand|gravel|construction|block|concrete", "", [0, 1], ["cemento", "cal", "arena", "grava", "tabique", "block", "yeso"], "Materiales de obra negra; se venden por bulto, pieza o metro cúbico.");
  def("varilla", "Varilla, clavos y herrería", "wrench", ["steel rebar construction", "nails screws hardware", "metal profile steel"], "rebar|steel|nail|screw|hardware|metal|bolt", "", [0, 1], ["varilla", "clavo", "tornillo", "alambre", "perfil", "malla"], "Acero y ferretería de herrería.");
  def("pintura", "Pinturas", "bucket", ["paint bucket", "house paint can", "paint roller wall"], "paint|bucket|roller|can|brush", "artist|canvas|oil painting|portrait|landscape", [0, 1], ["pintura", "vinilica", "esmalte", "impermeabilizante"], "Pintura para casa; se vende por cubeta o galón.");
  def("tuberia", "Tubería y plomería", "wrench", ["pvc pipes plumbing", "copper pipe fittings", "plumbing tools"], "pipe|plumbing|pvc|copper|fitting|faucet|valve", "", [0, 1], ["tubo", "pvc", "cobre", "plomeria", "plomería", "llave"], "Tubos y conexiones de plomería.");
  def("tela", "Telas y uniformes", "fabric", ["fabric rolls textile", "cotton fabric", "school uniform", "sewing fabric shop"], "fabric|textile|cotton|cloth|sewing|uniform", "dress|fashion model|runway", [0, 1], ["tela", "manta", "popelina", "lycra", "uniforme", "bata"], "Tela por metro o uniformes por pieza.");
  def("refaccion", "Refacciones", "wrench", ["car spare parts auto", "brake pads car", "car battery", "motor oil bottle"], "brake|car|auto|battery|motor oil|engine|filter|spark|tire|part", "racing|crash|toy|model", [0, 1], ["balata", "filtro", "bujia", "bujía", "bateria", "batería", "refaccion", "refacción", "llanta"], "Refacciones automotrices; confirma marca, modelo y año del auto.");
  def("servicio", "Servicios y oficios", "scissors", ["upholstery furniture repair", "carpenter workshop", "plumber at work", "welder metalwork", "tailor sewing"], "upholster|carpent|plumb|weld|tailor|seamstress|workshop|craftsman|electrician|locksmith", "", [0, 1], ["tapiceria", "tapicería", "carpinteria", "carpintería", "herreria", "herrería", "plomeria", "plomería", "costura", "oficio"], "Servicio por trabajo u hora; pide cotización y compara.");

  // ---------- v2.5: comida local (Aguascalientes y antojitos) ----------
  def("birria", "Birria", "taco", ["birria tacos", "birria", "quesabirria"], "birria|taco", "", [0, 1], ["birria", "consome", "consomé", "quesabirria"], "Carne de res o borrego cocida lenta, en tacos o plato con consomé.");
  def("barbacoa", "Barbacoa", "taco", ["barbacoa tacos", "barbacoa mexican lamb", "barbacoa"], "barbacoa|taco", "", [0, 1], ["barbacoa"], "Carne de borrego o res cocida al vapor, en tacos, tortas o por kilo.");
  def("carnitas", "Carnitas", "taco", ["carnitas tacos", "carnitas pork mexican", "carnitas"], "carnitas|taco", "", [0, 1], ["carnitas", "nana", "buche", "chamorro", "maciza"], "Cerdo cocido en su grasa; se vende por taco, orden o kilo.");
  def("lechon", "Lechón", "plate", ["lechon roast pork", "roast suckling pig", "lechon"], "lechon|pork|pig", "", [0, 1], ["lechon", "lechón"], "Cerdo joven al horno, típico para taco o torta.");
  def("torta", "Tortas", "torta", ["torta mexican sandwich", "tortas mexicanas", "torta sandwich bolillo"], "torta|sandwich", "", [0, 1], ["torta", "tortas", "lonche"], "Torta en bolillo con guisado o carne, a veces con frijol y aguacate.");
  def("gordita", "Gorditas", "taco", ["gorditas mexican", "gordita de chicharron", "gorditas"], "gordita", "", [0, 1], ["gordita", "gorditas", "chiqueada", "chiqueadas"], "Masa de maíz rellena de guisado, chicharrón o queso (en Ags les dicen chiqueadas).");
  def("pozole", "Pozole", "bowl", ["pozole mexican soup", "pozole rojo", "pozole"], "pozole", "", [0, 1], ["pozole"], "Caldo de maíz cacahuazintle con carne; se sirve con lechuga, rábano y tostadas.");
  def("menudo", "Menudo", "bowl", ["menudo soup mexican", "menudo mexican tripe soup", "menudo"], "menudo|tripe|soup", "", [0, 1], ["menudo", "mondongo"], "Caldo de pancita con chile; clásico de fin de semana.");
  def("enchilada", "Enchiladas", "plate", ["enchiladas mexican", "enchiladas rojas", "enchiladas plate"], "enchilada", "", [0, 1], ["enchilada", "enchiladas"], "Tortillas rellenas bañadas en salsa; las «San Marcos» son típicas de Ags.");
  def("esquites", "Esquites y chascas", "bowl", ["esquites mexican street food", "esquites corn cup", "elote en vaso"], "esquite|corn|elote", "", [0, 1], ["esquites", "chaska", "chaskas", "chasca", "chascas", "elote en vaso"], "Granos de elote en vaso con mayonesa, queso y chile.");
  def("elote", "Elotes", "corn", ["elote mexican street corn", "mexican street corn", "corn on the cob"], "elote|corn", "", [0, 1], ["elote", "elotes", "mazorca"], "Elote en mazorca con mayonesa, queso y chile.");
  def("aguafresca", "Aguas frescas", "soda", ["agua fresca mexican", "horchata agua fresca", "jamaica agua fresca"], "agua fresca|horchata|jamaica|tejuino|drink|beverage", "", [0, 1], ["agua fresca", "aguas frescas", "horchata", "jamaica", "tejuino", "colonche"], "Bebida fresca de fruta, flor o cereal; también tejuino y colonche.");
  def("burrito", "Burritos", "taco", ["burrito mexican", "burrito tortilla", "burritos"], "burrito", "", [0, 1], ["burrito", "burritos"], "Tortilla de harina rellena de guisado.");
  def("flauta", "Flautas y taquitos dorados", "taco", ["flautas mexican", "taquitos dorados", "flautas"], "flauta|taquito|taquitos|taco", "", [0, 1], ["flauta", "flautas", "taquitos dorados", "dorados"], "Tortilla enrollada y frita, con pollo o papa; se sirve con crema y salsa.");
  def("tostada", "Tostadas", "taco", ["tostada mexican", "tostadas de tinga", "tostadas"], "tostada", "", [0, 1], ["tostada", "tostadas"], "Tortilla frita con frijol, pollo o carne y verdura.");
  def("sope", "Sopes", "taco", ["sopes mexican", "sope mexican food", "sopes"], "sope", "", [0, 1], ["sope", "sopes"], "Masa gruesa con frijol, guisado, lechuga y queso.");
  def("tamal", "Tamales", "tamal", ["tamales mexican", "tamales de rajas", "tamales"], "tamale|tamal", "", [0, 1], ["tamal", "tamales"], "Masa de maíz envuelta en hoja, con carne, rajas o dulce.");
  def("desayuno", "Desayunos mexicanos", "plate", ["chilaquiles mexican", "huevos rancheros", "molletes mexican"], "chilaquil|huevos|ranchero|mollete|breakfast", "", [0, 1], ["chilaquiles", "huevos", "molletes", "desayuno"], "Chilaquiles, huevos o molletes con café.");
  def("quesadilla", "Quesadillas", "taco", ["quesadilla mexican", "quesadillas", "quesadilla de flor de calabaza"], "quesadilla", "", [0, 1], ["quesadilla", "quesadillas"], "Tortilla con queso y guisado, a la plancha o frita.");
  def("hotdog", "Hot dogs y jochos", "burger", ["hot dog street", "mexican hot dog", "hot dog bacon wrapped"], "hot ?dog|sausage", "", [0, 1], ["hotdog", "hot dog", "jocho", "jochos"], "Hot dog de carrito, a veces envuelto en tocino.");
  def("pollo_asado", "Pollo asado", "chicken", ["rotisserie chicken", "grilled chicken mexican", "pollo asado"], "chicken|pollo", "", [0, 1], ["pollo asado", "pollo rostizado", "rostizado"], "Pollo al carbón o rostizado con arroz y tortillas.");
  def("churros", "Churros", "dessert", ["churros", "churros con chocolate"], "churro", "", [0, 1], ["churro", "churros"], "Masa frita con azúcar y canela.");
  def("mariscos", "Mariscos y cócteles", "bowl", ["shrimp cocktail mexican", "ceviche tostada", "coctel de camaron"], "ceviche|shrimp|seafood|coctel|cocktail|prawn", "", [0, 1], ["ceviche", "camaron", "camarones", "marisco", "mariscos", "coctel de camaron", "cóctel"], "Ceviche, tostadas y cócteles de camarón.");
  def("corrida", "Comida corrida", "plate", ["comida corrida mexican", "mexican meal soup rice main", "mexican home cooking plate"], "mexican|meal|plate|rice|soup", "", [0, 1], ["comida corrida", "menu del dia", "menú del día"], "Menú del día: sopa, arroz, guisado, tortillas y agua.");
  def("caldo", "Caldos", "bowl", ["caldo de pollo mexican", "chicken soup mexican", "caldo de res"], "caldo|soup|broth", "", [0, 1], ["caldo", "caldos"], "Caldo de pollo o res con verduras.");

  def("chile_relleno", "Chiles rellenos", "plate", ["chile relleno", "stuffed poblano pepper", "chiles rellenos mexican"], "relleno|stuffed|poblano|chile", "", [0, 1], ["chile relleno", "chiles rellenos"], "Chile poblano relleno de queso o picadillo en caldillo.");
  // ---------- v2.5.1: tecnología ----------
  def("powerbank", "Baterías portátiles", "cable", ["power bank", "portable charger power bank"], "power ?bank|charger|battery", "", [0, 1], ["power bank", "bateria portatil", "batería portátil"], "Batería externa para cargar el celular fuera de casa.");
  def("bocina", "Bocinas bluetooth", "headphones", ["bluetooth speaker", "portable speaker"], "speaker|bocina", "", [0, 1], ["bocina", "bocinas", "speaker"], "Bocina portátil inalámbrica.");
  def("smartwatch", "Relojes inteligentes", "watch", ["smartwatch", "smart watch wrist"], "smart ?watch|watch", "", [0, 1], ["smartwatch", "reloj inteligente"], "Reloj con notificaciones y salud.");
  def("mouse", "Mouse", "controller", ["computer mouse wireless", "wireless mouse"], "mouse", "", [0, 1], ["mouse", "raton", "ratón"], "Mouse inalámbrico o con cable.");
  def("teclado", "Teclados", "controller", ["computer keyboard", "wireless keyboard"], "keyboard|teclado", "", [0, 1], ["teclado"], "Teclado para computadora o tableta.");
  def("memoria", "Memorias USB y microSD", "cable", ["usb flash drive", "microsd card"], "usb|flash|sd card|memory", "", [0, 1], ["memoria", "usb", "microsd", "pendrive"], "Memoria para guardar archivos y fotos.");
  def("tablet", "Tablets", "phone", ["tablet computer", "android tablet"], "tablet|ipad", "", [0, 1], ["tablet", "ipad"], "Tableta para estudiar, ver video y leer.");

  def("otros", "Compra", "bag", ["shopping bag", "retail shopping"], "shopping|bag|retail|store", "", [0, 1], [], "Compra; categoría por confirmar.");

  // ---------- Marcas con productos reconocibles (se intenta la foto de la marca; si no hay, la del tipo) ----------
  // re = nombre de tienda; types = tipos en los que sí aplica; q = consulta; must = lo que debe decir el título/descr.
  const BRANDS = [
    { k: "vans", re: /^vans\b/, types: ["skate", "tenis_casual"], q: "Vans Old Skool", must: "vans" },
    { k: "adidas", re: /^adidas/, types: ["tenis_dep", "tenis_casual", "futbol"], q: "Adidas sneakers", must: "adidas" },
    { k: "puma", re: /^puma/, types: ["tenis_dep", "tenis_casual"], q: "Puma sneakers", must: "puma" },
    { k: "nike", re: /^nike/, types: ["tenis_dep", "tenis_casual"], q: "Nike sneakers", must: "nike" },
    { k: "skechers", re: /skechers/, types: ["tenis_dep", "tenis_casual"], q: "Skechers shoes", must: "skechers" },
    { k: "crocs", re: /^crocs/, types: ["clog", "sandalia"], q: "Crocs clogs", must: "croc" },
    { k: "ugg", re: /^ugg/, types: ["ugg", "pantufla", "botines"], q: "UGG boots", must: "ugg" },
    { k: "timberland", re: /timberland/, types: ["bota_trabajo", "botines"], q: "Timberland boots", must: "timberland" },
    { k: "salomon", re: /salomon/, types: ["tenis_outdoor"], q: "Salomon trail running shoes", must: "salomon" },
    { k: "levis", re: /levi/, types: ["jeans", "chamarra_mezclilla"], q: "Levi's 501 jeans", must: "levi" },
    { k: "lacoste", re: /lacoste/, types: ["polo"], q: "Lacoste polo shirt", must: "lacoste" },
    { k: "tnf", re: /north face/, types: ["impermeable"], q: "The North Face jacket", must: "north face" },
    { k: "newera", re: /new era/, types: ["gorra"], q: "New Era cap", must: "new era" },
    { k: "pandora", re: /pandora/, types: ["pulsera", "anillo", "collar"], q: "Pandora charm bracelet", must: "pandora" },
    { k: "lego", re: /lego/, types: ["lego"], q: "Lego set", must: "lego" },
    { k: "samsung", re: /samsung/, types: ["celular"], q: "Samsung Galaxy smartphone", must: "samsung|galaxy" },
    { k: "huawei", re: /huawei/, types: ["celular"], q: "Huawei smartphone", must: "huawei" },
    { k: "macstore", re: /macstore/, types: ["celular"], q: "iPhone smartphone", must: "iphone|apple" },
    { k: "sunglasshut", re: /sunglass hut/, types: ["lentes_sol"], q: "Ray-Ban sunglasses", must: "ray-?ban|sunglass" },
    { k: "starbucks", re: /starbucks/, types: ["cafe", "frappe"], q: "Starbucks coffee cup", must: "starbucks" },
    { k: "mcd", re: /mcdonald/, types: ["burger", "papas"], q: "McDonald's Big Mac", must: "mcdonald|big mac" },
    { k: "bk", re: /burger king/, types: ["burger"], q: "Burger King Whopper", must: "burger king|whopper" },
    { k: "kfc", re: /kfc/, types: ["pollo"], q: "KFC fried chicken", must: "kfc" },
    { k: "dominos", re: /domino/, types: ["pizza"], q: "Domino's pizza", must: "domino" },
    { k: "subway", re: /subway/, types: ["sandwich"], q: "Subway sandwich", must: "subway" },
    { k: "cinnabon", re: /cinnabon/, types: ["rol"], q: "Cinnabon cinnamon roll", must: "cinnabon" },
    { k: "haagen", re: /h.agen/, types: ["helado"], q: "Häagen-Dazs ice cream", must: "h.agen" },
    { k: "dq", re: /dairy queen/, types: ["helado"], q: "Dairy Queen Blizzard", must: "dairy queen|blizzard" },
    { k: "kswiss", re: /k-?swiss/, types: ["tenis_casual", "tenis_dep"], q: "K-Swiss sneakers", must: "k-?swiss" },
    { k: "chanel", re: /chanel/, types: ["perfume"], q: "Chanel perfume bottle", must: "chanel" },
    { k: "versace", re: /versace/, types: ["perfume"], q: "Versace perfume bottle", must: "versace" },
    { k: "herrera", re: /carolina herrera|good girl/, types: ["perfume"], q: "Carolina Herrera Good Girl perfume", must: "herrera|good girl" }
  ];
  const brandOf = (store) => { const n = norm(store && store.name); return BRANDS.find((b) => b.re.test(n)) || null; };
  // La marca también puede venir en el nombre del producto («Tenis Vans Old Skool» en Liverpool)
  const brandOfItem = (item) => { const n = norm(item && item.name); return BRANDS.find((b) => new RegExp("\\b(" + b.must + ")", "i").test(n)) || null; };
  const brandName = (store) => String((store && store.name) || "").replace(/\s*\(.*\)\s*$/, "").trim();
  const sameBrand = (a, b) => norm(brandName(a)) === norm(brandName(b));

  // ---------- Lo que vende cada tienda (tipos), por categoría ----------
  // calz: lista para ítems genéricos de calzado; otros: por clase de producto genérico.
  const LINEUP = {
    liverpool: { zapatos: ["tacones", "botines", "tenis_casual", "zapato_vestir", "sandalia", "flats", "mocasin"], tenis: ["tenis_casual", "tenis_dep"] },
    flexi: { zapatos: ["botines", "zapato_casual", "zapato_vestir", "mocasin", "tenis_casual", "sandalia", "botas"], tenis: ["tenis_casual", "tenis_dep"] },
    cuadra: { zapatos: ["bota_vaquera", "botines", "zapato_vestir"], tenis: ["zapato_casual"] },
    crocs: { zapatos: ["clog", "sandalia", "pantufla"], tenis: ["clog"] },
    ugg: { zapatos: ["ugg", "pantufla", "botines"], tenis: ["ugg"] },
    timberland: { zapatos: ["bota_trabajo", "botines", "zapato_casual"], tenis: ["bota_trabajo"] },
    skechers: { zapatos: ["tenis_dep", "tenis_casual", "sandalia"], tenis: ["tenis_dep", "tenis_casual"] },
    vans: { zapatos: ["skate", "tenis_casual"], tenis: ["skate", "tenis_casual"], playera: ["playera", "playera_est"] },
    adidas: { zapatos: ["tenis_dep", "tenis_casual", "futbol"], tenis: ["tenis_dep", "tenis_casual", "futbol"] },
    puma: { zapatos: ["tenis_dep", "tenis_casual", "futbol"], tenis: ["tenis_dep", "tenis_casual"] },
    salomon: { zapatos: ["tenis_outdoor", "bota_trabajo"], tenis: ["tenis_outdoor"], playera_dep: ["ropa_dep"], chamarra: ["impermeable"] },
    bobois: { mueble: ["sofa"] }, "luxury muebles": { mueble: ["sofa"] }, "colchones atlas": { mueble: ["colchon"] },
    innovasport: { zapatos: ["tenis_dep", "tenis_casual", "futbol"], tenis: ["tenis_dep", "tenis_casual", "futbol"] },
    deportenis: { zapatos: ["tenis_dep", "tenis_casual", "futbol"], tenis: ["tenis_dep", "tenis_casual"] },
    zara: { zapatos: ["tacones", "botines", "tenis_casual", "sandalia", "zapato_vestir"], tenis: ["tenis_casual"] },
    // ropa
    "the north face": { chamarra: ["impermeable", "chamarra"], playera: ["ropa_dep", "playera"], sudadera: ["sudadera"] },
    levi: { pantalon: ["jeans"], chamarra: ["chamarra_mezclilla", "chamarra"], playera: ["playera", "playera_est"] },
    lacoste: { playera: ["polo", "playera"] }, "psycho bunny": { playera: ["polo", "playera"] }, "tommy hilfiger": { playera: ["polo", "playera"] }, boss: { playera: ["polo", "playera"] },
    "marco viali": { traje: ["traje", "blazer", "camisa"] }, "massimo dutti": { playera: ["polo", "playera"], pantalon: ["pantalon_vestir", "jeans"] },
    "women'secret": { playera: ["pijama", "playera"], sudadera: ["sueter", "sudadera"], pantalon: ["pijama", "jogger"] }, calzedonia: { playera: ["calcetines", "leggings"], sudadera: ["leggings"], pantalon: ["leggings", "calcetines"] },
    "new era": { playera: ["gorra", "playera_est"], sudadera: ["sudadera"], pantalon: ["jogger"] },
    // joyería / ópticas / tecnología
    pandora: { joya: ["pulsera", "anillo", "collar"] }, tous: { joya: ["pulsera", "collar", "anillo"] }, "bimba y lola": { joya: ["collar", "aretes", "pulsera"] },
    "sunglass hut": { optica: ["lentes_sol"] },
    samsung: { accesorio: ["audifonos", "cargador"] }, huawei: { accesorio: ["audifonos", "cargador"] }
  };
  // Por defecto, según el producto genérico del catálogo
  const DEFAULTS = {
    zapatos: ["tenis_casual", "zapato_vestir", "sandalia", "botines", "flats"],
    tenis: ["tenis_casual", "tenis_dep"],
    playera: ["playera", "playera_est"], playera_dep: ["ropa_dep"], sudadera: ["sudadera", "sueter"], pantalon: ["jeans", "pantalon_vestir", "jogger"], chamarra: ["chamarra", "chamarra_mezclilla"],
    vestido: ["vestido", "blusa", "falda"], traje: ["traje", "camisa", "blazer"], bebe: ["ropa_bebe"],
    perfume: ["perfume"], maquillaje: ["labial", "base_maq"], skincare: ["skincare"], cuidado: ["labial", "base_maq", "skincare"],
    joya: ["pulsera", "anillo", "collar", "aretes"], optica: ["armazon", "lentes_sol"],
    carcasa: ["funda", "cargador"], accesorio: ["funda", "cargador", "audifonos"], audifonos: ["audifonos"], celular: ["celular"],
    mueble: ["sofa", "colchon"]
  };
  // Clase de producto genérico a partir del nombre del ítem y su categoría
  function genericClass(item) {
    const n = norm(item && item.name), c = item && item.cat;
    if (item && (item.desc || item.kind || item.emoji !== undefined)) return null; // productos concretos de menús.js: no se reemplazan
    if (c === "calzado") return /^(tenis|tenis deportivos|tenis outdoor)$/.test(n) ? "tenis" : /^(zapatos|zapato|zapatos \/ tenis|calzado)$/.test(n) ? "zapatos" : null;
    if (c === "ropa" || c === "deportes") {
      if (/^playera deportiva$/.test(n)) return "playera_dep";
      if (/^playera$/.test(n)) return "playera";
      if (/^sudadera$/.test(n)) return "sudadera";
      if (/^(pantalon|jeans)$/.test(n)) return "pantalon";
      if (/^chamarra$/.test(n)) return "chamarra";
      if (/^vestido/.test(n)) return "vestido";
      if (/^traje/.test(n)) return "traje";
      if (/bebe/.test(n)) return "bebe";
      return null;
    }
    if (c === "perfumes" && /^perfume$/.test(n)) return "perfume";
    if (c === "belleza") return /^maquillaje \/ cuidado$/.test(n) ? "cuidado" : /^maquillaje$/.test(n) ? "maquillaje" : /^skincare$/.test(n) ? "skincare" : null;
    if (c === "regalos" && /joyeria/.test(n)) return "joya";
    if (c === "opticas" && /lentes/.test(n)) return "optica";
    if (c === "tecnologia") return /carcasa/.test(n) ? "carcasa" : /^accesorio( \/ cargador)?$/.test(n) ? "accesorio" : /^audifonos$/.test(n) ? "audifonos" : /celular/.test(n) ? "celular" : null;
    if (c === "hogar" && /^mueble/.test(n)) return "mueble";
    return null;
  }
  // v1.4: SOLO se desglosa lo que verifiqué en el catálogo público de la tienda (consultado 2026-11-19):
  // Liverpool, Flexi y Cuadra (calzado). Para las demás tiendas NO se inventan productos: se queda el producto genérico.
  const VERIFIED = ["liverpool", "flexi", "cuadra"];
  const lineupFor = (store, cls) => {
    if (cls !== "zapatos" && cls !== "tenis") return null;
    const n = norm(store && store.name), k = VERIFIED.find((v) => n === v || n.startsWith(v + " "));
    return k && LINEUP[k][cls] ? LINEUP[k][cls] : null;
  };

  // ---------- Clasificación: ¿qué es este producto? ----------
  const RULES = [
    [/mica|protector de pantalla/, "funda"], [/power ?bank|bateria portatil/, "powerbank"], [/bocina|speaker/, "bocina"], [/smart ?watch|reloj inteligente/, "smartwatch"], [/\bmouse\b|raton/, "mouse"], [/teclado|keyboard/, "teclado"], [/memoria usb|\busb\b.*\d+ ?gb|microsd|pendrive/, "memoria"], [/\btablet|ipad/, "tablet"], [/\bcable\b/, "cargador"],
    [/chiles? rellenos?/, "chile_relleno"], [/guisado con arroz|plato fuerte mexicano|comida del dia/, "corrida"], [/sopa del dia/, "caldo"], [/fresas? (con|y) crema|platanos? con crema|fruta con crema/, "postre"], [/paleta (de )?(hielo|crema|helada)|paleta helada/, "helado"], [/\btortas?\b|lonche/, "torta"], [/birria|quesabirria/, "birria"], [/barbacoa/, "barbacoa"], [/carnitas|\bnana\b|buche|chamorro/, "carnitas"], [/lechon/, "lechon"], [/\btortas?\b|lonche/, "torta"], [/gordita|chiqueada/, "gordita"],
    [/pozole/, "pozole"], [/menudo|mondongo/, "menudo"], [/enchilada/, "enchilada"], [/esquite|chaska|chasca|elote en vaso/, "esquites"], [/\belotes?\b|mazorca/, "elote"],
    [/tejuino|colonche|agua fresca|aguas frescas|horchata|agua de /, "aguafresca"], [/burrito/, "burrito"], [/flauta|taquitos? dorado/, "flauta"], [/tostada/, "tostada"], [/\bsopes?\b/, "sope"], [/tamal/, "tamal"],
    [/chilaquil|huevos (con|al|a la|rancheros)|molletes/, "desayuno"], [/quesadilla/, "quesadilla"], [/hot ?dog|jocho/, "hotdog"], [/pollo (asado|rostizado)|rostizado/, "pollo_asado"], [/churro/, "churros"],
    [/ceviche|coctel de camaron|camaron|marisco/, "mariscos"], [/comida corrida|menu del dia/, "corrida"], [/\bcaldos?\b/, "caldo"],
    [/pantalla|smart ?tv|televisi/, "tv"], [/motocicleta|motoneta|cuatrimoto|scooter/, "moto"], [/cabecera|cama (matrimonial|individual|king|queen)|litera/, "cabecera"], [/ropero|closet|armario/, "closet"], [/tocador|buro|comoda/, "tocador"],
    [/rubor|blush|paleta|sombras|eyeshadow/, "rubor"], [/cartera|monedero/, "cartera"],
    [/tacon|tacones|zapatilla|stiletto|pumps?\b/, "tacones"], [/bota vaquera|vaquera|texana/, "bota_vaquera"], [/botin|botines|chelsea/, "botines"], [/\bbotas?\b/, "botas"],
    [/tenis.*(outdoor|montana|trail)|trail|senderismo/, "tenis_outdoor"], [/tacos de futbol|guayos|futbol/, "futbol"], [/skate|old skool|sk8/, "skate"],
    [/tenis.*(deport|running|correr|entren)|running/, "tenis_dep"], [/tenis|sneaker/, "tenis_casual"], [/mocasin|loafer/, "mocasin"], [/balerina|flats?\b/, "flats"], [/sandalia|chancla/, "sandalia"],
    [/pantufla/, "pantufla"], [/zueco|clog/, "clog"], [/zapato.*(vestir|formal)|oxford|derby/, "zapato_vestir"], [/zapato/, "zapato_casual"],
    [/playera deportiva|jersey/, "ropa_dep"], [/estampad/, "playera_est"], [/\bpolo\b/, "polo"], [/playera|camiseta/, "playera"], [/camisa/, "camisa"], [/blusa|\btop\b/, "blusa"],
    [/sudadera|hoodie/, "sudadera"], [/sueter|cardigan|cárdigan/, "sueter"], [/chamarra.*(mezclilla|denim)|denim jacket/, "chamarra_mezclilla"], [/impermeable|rompevientos/, "impermeable"], [/chamarra|chaqueta/, "chamarra"],
    [/jeans|mezclilla/, "jeans"], [/pantalon.*(vestir)|chino/, "pantalon_vestir"], [/jogger|pants deportivo/, "jogger"], [/pantalon/, "jeans"], [/short|bermuda/, "short"],
    [/vestido/, "vestido"], [/falda/, "falda"], [/abrigo/, "abrigo"], [/blazer|saco\b/, "blazer"], [/traje/, "traje"], [/pijama/, "pijama"], [/legging/, "leggings"], [/calcetin/, "calcetines"], [/gorra/, "gorra"],
    [/bebe|bebé/, "ropa_bebe"], [/prenda/, "ropa_gen"],
    [/perfume|edp|edt|fragancia|colonia|eau de|parfum|elixir|body mist|bruma/, "perfume"], [/labial/, "labial"], [/maquillaje|base\b|sombras|rubor/, "base_maq"], [/skincare|crema|serum|hidratante/, "skincare"],
    [/pulsera/, "pulsera"], [/anillo/, "anillo"], [/collar|dije/, "collar"], [/arete/, "aretes"], [/lentes de sol|solar/, "lentes_sol"], [/lente|armazon|optica/, "armazon"],
    [/carcasa|funda/, "funda"], [/cargador|cable|power ?bank/, "cargador"], [/audifono|bocina/, "audifonos"], [/celular|telefono/, "celular"], [/videojuego|consola|gamer|control/, "consola"],
    [/sofa|sala\b/, "sofa"], [/colchon|cama\b/, "colchon"], [/lampara/, "lampara"], [/cojin|decoracion/, "cojin"], [/mueble/, "sofa"],
    [/lego|set (pequeno|mediano|grande)/, "lego"], [/peluche/, "peluche"], [/juguete/, "juguete"], [/suplemento|proteina/, "suplemento"], [/balon/, "balon"],
    [/whopper|big mac|hamburguesa|burger|famous star|baconator|cheeseburger|krunch|kruncher|mctrio/, "burger"], [/pizza|panzerotti/, "pizza"],
    [/pollo|nuggets|crispers|alitas|wings|boneless|tender|chicken/, "pollo"], [/papas|fries|curly/, "papas"], [/sushi|\broll\b|nigiri|temaki|maki|kushiage/, "sushi"], [/tacos?\b/, "tacos"],
    [/pasta|spaghetti|fettuccini|lasagna|penne|fusilli|cannelloni|risotto/, "pasta"], [/ensalada|insalata|salad|poke|bowl|chirashi/, "ensalada"], [/sandwich|\bsub\b|footlong|baguette/, "sandwich"],
    [/carne|parrilla|asada|costillas|ribs|arrachera|steak/, "parrilla"], [/helado|sundae|nieve|gelato|blizzard|paleta/, "helado"], [/rol de canela|cinnabon|dona\b|donut/, "rol"],
    [/crepa|crepe/, "crepa"], [/postre|pay\b|pastel|cheesecake|molten|panna|tiramisu|cake|brownie/, "postre"], [/frapp/, "frappe"], [/boba|milk tea|perlas|matcha|\bte\b/, "te"],
    [/latte|cafe|espresso|americano|macchiato|cappuccino|moka/, "cafe"], [/boleto|cine\b|pelicula/, "boleto"], [/palomitas|pop ?corn/, "palomitas"], [/refresco|soda\b|bebida|agua\b|cerveza/, "refresco"],
    [/papeleria|cuaderno|pluma|utiles/, "papeleria"], [/mascota|perro|gato|alimento/, "mascota"], [/despensa/, "super"], [/regalo|detalle/, "regalo"]
  ];
  const BY_CAT = { ropa: "ropa_gen", calzado: "calzado_gen", perfumes: "perfume", belleza: "base_maq", comida: "comida_gen", cafe: "cafe", postres: "postre", super: "super", juguetes: "juguete", regalos: "regalo",
    deportes: "tenis_dep", hogar: "sofa", decoracion: "cojin", tecnologia: "cargador", entretenimiento: "consola", mascotas: "mascota", opticas: "armazon", papeleria: "papeleria", otros: "otros" };

  function typeOf(store, item) {
    if (item && T[item.type]) return item.type;
    const cat = (item && item.cat) || (store && store.cats && store.cats[0]) || "otros";
    const txt = norm([item && item.name, ...((item && item.tags) || [])].join(" "));
    // Un ítem genérico de calzado/ropa toma el primer tipo de su tienda (no un tenis para todo)
    const gc = item && genericClass(item);
    if (gc) { const l = lineupFor(store, gc); if (l && l.length) return l[0]; }
    for (const [re, k] of RULES) if (re.test(txt)) return k;
    return BY_CAT[cat] || "otros";
  }

  // Perfil de foto: id estable + pasos de búsqueda (marca primero si aplica, luego el tipo)
  function profile(store, item) {
    const type = typeOf(store, item), br = brandOfItem(item) || brandOf(store), useBrand = br && br.types.includes(type);
    return profileById(type + (useBrand ? "@" + br.k : ""));
  }
  const profCache = {};
  function profileById(id) {
    if (profCache[id]) return profCache[id];
    const [type, bk] = String(id).split("@"), t = T[type] || T.otros, br = bk && BRANDS.find((b) => b.k === bk), steps = [];
    if (br) steps.push({ q: br.q, must: new RegExp(br.must, "i"), not: t.not, brand: true });
    for (const q of t.q) steps.push({ q, must: t.must, not: t.not, brand: false });
    return (profCache[id] = { id: T[type] ? id : "otros", type: T[type] ? type : "otros", label: t.label, art: t.art, desc: t.d, steps, brand: br ? br.k : null });
  }

  // ---------- Expansión del catálogo: un producto genérico → los tipos reales que vende la tienda ----------
  const r5 = (n) => (n >= 100 ? Math.round(n / 10) * 10 : Math.round(n / 5) * 5);
  function expandStore(s) {
    if (!s || !s.items || s.__x) return s; s.__x = 1;
    const out = [], seen = new Set();
    for (const it of s.items) {
      const cls = genericClass(it), l = cls && lineupFor(s, cls);
      if (!l || !l.length || it.exact) { if (!seen.has(it.name)) { out.push(it); seen.add(it.name); } continue; }
      for (const tk of l) {
        const t = T[tk]; if (!t || seen.has(t.label)) continue; seen.add(t.label);
        const span = it.max - it.min, min = it.exact ? it.min : r5(it.min + span * t.p[0]), max = it.exact ? it.max : Math.max(min + 10, r5(it.min + span * t.p[1]));
        out.push({ ...it, name: t.label, min, max, type: tk, grp: cls + "|" + it.cat, aka: [it.name], desc: it.desc || t.d, tags: [...new Set([...(it.tags || []), ...t.tags])] });
      }
    }
    s.items = out; return s;
  }
  function expand(stores) { for (const s of stores || []) expandStore(s); return stores; }

  // ¿Es de esta marca? (para avisar «Otra marca» en las opciones parecidas)
  const api = { T, BRANDS, typeOf, profile, profileById, brandOf, brandOfItem, brandName, sameBrand, expand, expandStore, genericClass, lineupFor, norm };
  root.GastaVisual = api;
  if (root.GASTABOT_DATA && root.GASTABOT_DATA.STORES) expand(root.GASTABOT_DATA.STORES);
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
