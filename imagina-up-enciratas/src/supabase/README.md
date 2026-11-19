# Chat con IA (Claude) para GastaBot

La app sigue calculando precios y combos con su motor; Claude sólo **entiende el mensaje** y redacta una respuesta corta. Si algo falla (sin internet, sin crédito, límite), la app usa sus reglas de siempre.

## 1. Clave de Anthropic
1. Entra a https://platform.claude.com, crea una cuenta y carga crédito en la sección de facturación (Billing) de la consola (la API se paga aparte de tu cuenta de Claude).
2. Crea una API key. **No la pegues en el chat ni en el código.**

## 2. Desplegar la función (elige una forma)
**Con CLI**
```bash
npm i -g supabase
supabase login
supabase link --project-ref TU_PROJECT_REF
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...   # aquí pegas la key, en tu computadora
supabase functions deploy gastabot-chat
```
**Sin CLI (panel web)**: Supabase › Edge Functions › Deploy a new function › Via Editor; pega todo `index.dashboard.ts` (es la función en un solo archivo), ponle el nombre `gastabot-chat` y Deploy. Luego agrega el secreto `ANTHROPIC_API_KEY` en supabase.com/dashboard/project/_/functions/secrets.

Opcionales (secretos): `GASTABOT_MODEL` (por defecto `claude-haiku-5-5`), `GASTABOT_PER_HOUR` (30 por IP) y `GASTABOT_PER_DAY` (1500 en total) para limitar el gasto.

## 3. Activarlo en la app
Menú › Ajustes › pega tu Project URL y tu *anon public key* de Supabase, marca **Usar IA en el chat** y guarda.

## Notas
- Funciona en la extensión, la PWA y el APK. La página `gastabot-celular.html` publicada como artefacto bloquea conexiones externas, así que ahí no.
- El límite por IP vive en memoria y se reinicia cuando la función se recicla; el tope real de gasto lo da tu crédito en la consola de Anthropic. Pon un monto bajo.
- Costo: un mensaje es una llamada corta; revisa el uso en la consola de Anthropic.


## Correos con recomendaciones de tiendas favoritas (v1.5)
1. SQL Editor → pega y corre `digest.sql` (columnas `email_digest`, `digest_freq`, `last_digest`).
2. Crea cuenta en Resend (resend.com) y verifica tu dominio (o usa su remitente de prueba, que solo manda a tu propio correo).
3. Edge Functions → nueva función `gastabot-digest` → pega `functions/gastabot-digest/index.dashboard.ts` y **desactiva «Verify JWT»** (el enlace de «dejar de recibir» no lleva sesión).
4. Secretos de la función: `RESEND_API_KEY`, `DIGEST_FROM` (ej. `GastaBot <hola@tu-dominio.com>`), `DIGEST_SECRET` (texto largo inventado), opcional `GASTABOT_APP_URL`. Se ponen en el panel o con `supabase secrets set`, nunca en el código ni en el chat.
5. Prueba sin enviar: `POST` a la función con header `x-digest-secret` y cuerpo `{"dry":true}` (devuelve los correos generados). Para uno real: `{"force":true,"user_id":"<tu id>"}`.
6. Programa el envío diario con el bloque comentado al final de `digest.sql` (pg_cron + pg_net). Cada usuario recibe según su frecuencia.
7. Si cambias el catálogo de la app, regenera con `node scripts/build-digest.js`.


## Comunidad (v1.6)
Pega y corre `community.sql` en SQL Editor (después de `schema.sql`). Crea publicaciones, me gusta y reportes con RLS: todos leen, sólo tú publicas/borras lo tuyo, el autor lo pone el servidor, máximo 10 publicaciones al día por usuario y auto-ocultado con 3 reportes. El admin puede borrar u ocultar cualquier publicación.


## Promociones al día (v1.9)
1. SQL Editor → `community2.sql` (después de `community.sql`): vigencia, contadores y votos «sigue vigente / ya no» con RLS.
2. Edge Functions → nueva `gastabot-offer-scan` → pega `functions/gastabot-offer-scan/index.dashboard.ts`. Deja «Verify JWT» **activado**; además la función exige sesión de usuario y limita 20 fotos/hora por persona.
3. Secreto `ANTHROPIC_API_KEY` (el mismo del chat). Opcionales: `GASTABOT_MODEL`, `SCAN_PER_HOUR`, `SCAN_PER_DAY`.
4. La función sólo pre-llena el formulario; nunca publica por sí sola. Regenerar el archivo único: `node scripts/build-scan.js`.


## Precios locales (v2.1)
1. SQL Editor → `prices.sql` (después de `schema.sql`): precios, votos, reportes y cotizaciones con RLS; autor real puesto por el servidor; límites de 40 precios y 5 cotizaciones por día; se ocultan solos con 3 reportes o 3 «ya cambió».
2. Vuelve a pegar `functions/gastabot-offer-scan/index.dashboard.ts` (ahora también lee listas de precios con `mode: "precios"`). Regenerar: `node scripts/build-scan.js`.
