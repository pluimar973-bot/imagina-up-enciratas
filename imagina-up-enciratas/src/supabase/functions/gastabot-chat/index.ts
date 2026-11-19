// Función de Supabase: recibe el mensaje, le pide a Claude que lo interprete y devuelve JSON limpio.
// La clave de Anthropic vive SOLO aquí como secreto (ANTHROPIC_API_KEY); la app nunca la ve.
import { SYSTEM, TOOL, buildUserContent, validBody, sanitize, makeLimiter } from "./lib.mjs";

const KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const MODEL = Deno.env.get("GASTABOT_MODEL") ?? "claude-haiku-5-5";
const allow = makeLimiter({ perHour: +(Deno.env.get("GASTABOT_PER_HOUR") ?? 30), perDay: +(Deno.env.get("GASTABOT_PER_DAY") ?? 1500) });
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ error: "método no permitido" }, 405);
  if (!KEY) return json({ error: "falta ANTHROPIC_API_KEY en los secretos de la función" }, 500);

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "anon";
  if (!allow(ip)) return json({ error: "límite alcanzado, intenta más tarde" }, 429);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "JSON inválido" }, 400); }
  if (!validBody(body)) return json({ error: "mensaje inválido" }, 400);

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: AbortSignal.timeout(12000),
      headers: { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 350,
        system: SYSTEM,
        tools: [TOOL],
        tool_choice: { type: "tool", name: TOOL.name },
        messages: [{ role: "user", content: buildUserContent(body) }]
      })
    });
    if (!r.ok) { console.error("Anthropic", r.status, (await r.text()).slice(0, 300)); return json({ error: "modelo no disponible" }, 502); }
    const data = await r.json();
    const use = (data.content ?? []).find((b: any) => b.type === "tool_use");
    return json(sanitize(use?.input));
  } catch (e) {
    console.error("gastabot-chat", e);
    return json({ error: "no se pudo consultar el modelo" }, 502);
  }
});
