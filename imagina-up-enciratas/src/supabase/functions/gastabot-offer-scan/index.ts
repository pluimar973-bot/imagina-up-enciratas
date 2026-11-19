// Función de Supabase: lee una foto (oferta o lista de precios, mode: "oferta" | "precios") con Claude (visión) y devuelve campos para PRE-LLENAR el formulario.
// No publica nada: la persona revisa y confirma. La foto no se guarda. Sólo usuarios con sesión.
// Secreto: ANTHROPIC_API_KEY (Edge Functions › Secrets). SUPABASE_URL y SUPABASE_ANON_KEY ya existen.
import { SYSTEM, TOOL, SYSTEM_PRICES, TOOL_PRICES, sanitize, sanitizePrices, validBody, userMsg, makeLimiter } from "./lib.mjs";

const KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "", MODEL = Deno.env.get("GASTABOT_MODEL") ?? "claude-haiku-5-5";
const URL_ = Deno.env.get("SUPABASE_URL") ?? "", ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const allow = makeLimiter({ perHour: +(Deno.env.get("SCAN_PER_HOUR") ?? 20), perDay: +(Deno.env.get("SCAN_PER_DAY") ?? 400) });
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ error: "método no permitido" }, 405);
  if (!KEY) return json({ error: "falta ANTHROPIC_API_KEY en los secretos de la función" }, 500);

  // Sólo personas con sesión (la anon key sola no basta)
  const auth = req.headers.get("authorization") ?? "";
  const u = await fetch(`${URL_}/auth/v1/user`, { headers: { apikey: ANON, Authorization: auth } }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  if (!u?.id) return json({ error: "inicia sesión para usar esta función" }, 401);
  if (!allow(u.id)) return json({ error: "límite alcanzado, intenta más tarde" }, 429);

  let body: any; try { body = await req.json(); } catch { return json({ error: "JSON inválido" }, 400); }
  if (!validBody(body)) return json({ error: "imagen inválida o muy grande" }, 400);
  const prices = body.mode === "precios";
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", signal: AbortSignal.timeout(25000),
      headers: { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: prices ? 1500 : 400, system: prices ? SYSTEM_PRICES : SYSTEM, tools: [prices ? TOOL_PRICES : TOOL], tool_choice: { type: "tool", name: (prices ? TOOL_PRICES : TOOL).name }, messages: [{ role: "user", content: userMsg(body) }] })
    });
    if (!r.ok) { console.error("Anthropic", r.status, (await r.text()).slice(0, 300)); return json({ error: "modelo no disponible" }, 502); }
    const data = await r.json(); const use = (data.content ?? []).find((b: any) => b.type === "tool_use");
    return json(prices ? sanitizePrices(use?.input) : sanitize(use?.input));
  } catch (e) { console.error("gastabot-offer-scan", e); return json({ error: "no se pudo leer la imagen" }, 502); }
});
