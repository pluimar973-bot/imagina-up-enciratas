# GastaBot AGS

**Dime cuánto tienes y te digo qué te alcanza… y dónde.** App de compras por presupuesto para plazas y negocios locales de Aguascalientes (hackathon imagina UP).

## El problema
Quien quiere comprar no sabe cuánto le alcanza: recorre plazas y apps tienda por tienda para comparar, los negocios locales no aparecen en ningún comparador y las apps de reparto dicen qué pedir, no cuánto se va a gastar.

## Qué hace
- **Combo por presupuesto:** escribes un monto y categorías; arma compras que caben, con precio y tienda de cada pieza, cuánto sobra y alternativas por pieza.
- **Catálogo con fotos y precios:** 638 productos de Liverpool, Zara, Coppel, Sephora y Flexi (precios de lista, nov-2026).
- **Comida local barata y variada:** 22 negocios y 70 platillos de Aguascalientes.
- **Tecnología:** audífonos, cargadores, accesorios, celulares y tablets (rangos estimados).
- **Productos y servicios locales:** rangos estimados y dónde buscarlos en el mapa.
- **Cerca de mí:** plazas ordenadas por distancia (en línea recta), cómo llegar y armar combo ahí.
- **A domicilio:** enlaces a Rappi y DiDi Food. **Comunidad, ofertas, favoritos y avisos.**
- **Sin cuenta:** la sesión se pide después del primer mensaje y siempre se puede seguir sin cuenta.

## Cómo probarlo
- **Más fácil:** abre `index.html` en el navegador (es un solo archivo, con todas las fotos incluidas; no necesita internet para lo principal).
- **Demo en línea:** activa GitHub Pages (Settings → Pages → Deploy from a branch → `main` / `/ (root)`).
- **Código fuente:** carpeta `src/`. El proyecto completo con fotos está en `gastabot-completo.zip`.

## Tecnología
JavaScript puro (sin frameworks): extensión de Chrome (panel lateral), PWA y app móvil con Capacitor. Respaldo en la nube opcional con Supabase (`src/schema.sql`).

## Honestidad de los datos
- Precios del catálogo: precios de lista de las páginas de las tiendas, con fecha de captura.
- Precios de comida y productos locales: **estimados** (se marcan con «~» y «?»); no son el menú de cada negocio.
- Los lugares con nombre salen de fuentes públicas (Grupo Animal, Mexico News Daily, Tus Buenas Noticias, Carta.menu, Uber Eats).
- La ubicación queda en la memoria del navegador: no se guarda ni se envía a ningún servidor.
- Este repositorio no contiene claves ni tokens.
