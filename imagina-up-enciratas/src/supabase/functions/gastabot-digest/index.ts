// Función de Supabase: manda por correo recomendaciones de las tiendas favoritas de cada usuario que lo activó.
// Secretos (Edge Functions › Secrets): RESEND_API_KEY, DIGEST_FROM ("GastaBot <hola@tu-dominio.com>"), DIGEST_SECRET (texto largo inventado por ti).
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY ya existen en Supabase. Despliega con --no-verify-jwt (el enlace de «dejar de recibir» no lleva sesión).
import { recommend, renderEmail, isDue, sign, validUuid, esc } from "./lib.mjs";
import CATALOG from "./catalog.json" with { type: "json" };

const URL_ = Deno.env.get("SUPABASE_URL") ?? "", SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND = Deno.env.get("RESEND_API_KEY") ?? "", FROM = Deno.env.get("DIGEST_FROM") ?? "", SECRET = Deno.env.get("DIGEST_SECRET") ?? "";
const APP_URL = Deno.env.get("GASTABOT_APP_URL") ?? "";
const H = { apikey: SRK, Authorization: `Bearer ${SRK}`, "Content-Type": "application/json" };
const sb = async (method: string, path: string, body?: unknown, extra: Record<string, string> = {}) => {
  const r = await fetch(`${URL_}${path}`, { method, headers: { ...H, ...extra }, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} ${path.split("?")[0]} → ${r.status}`);
  const t = await r.text(); return t ? JSON.parse(t) : null;
};
const page = (msg: string) => new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><body style="font-family:system-ui;max-width:420px;margin:48px auto;padding:0 16px"><h2>GastaBot</h2><p>${esc(msg)}</p>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (!URL_ || !SRK || !SECRET) return json({ error: "faltan secretos (DIGEST_SECRET)" }, 500);
  const u = new URL(req.url);

  // Enlace de «dejar de recibir» (GET ?u=<id>&t=<firma>)
  if (req.method === "GET") {
    const id = u.searchParams.get("u") ?? "", t = u.searchParams.get("t") ?? "";
    if (!validUuid(id) || t !== (await sign(SECRET, id))) return page("Enlace no válido.");
    try { await sb("PATCH", `/rest/v1/profiles?id=eq.${id}`, { email_digest: false }); return page("Listo: ya no recibirás recomendaciones por correo. Puedes volver a activarlas en la app (Ajustes › Perfil)."); }
    catch { return page("No pude actualizarlo ahora. Apágalo en la app (Ajustes › Perfil)."); }
  }
  if (req.method !== "POST") return json({ error: "método no permitido" }, 405);
  if (req.headers.get("x-digest-secret") !== SECRET) return json({ error: "no autorizado" }, 401);

  let body: any = {}; try { body = await req.json(); } catch { /* cuerpo vacío */ }
  const dry = body.dry === true, force = body.force === true || dry, only = validUuid(body.user_id) ? body.user_id : null;
  if (!dry && (!RESEND || !FROM)) return json({ error: "faltan RESEND_API_KEY o DIGEST_FROM" }, 500);

  const today = new Date().toISOString().slice(0, 10);
  const profiles = await sb("GET", `/rest/v1/profiles?email_digest=eq.true${only ? `&id=eq.${only}` : ""}&select=id,name,digest_freq,last_digest,email_digest&limit=200`);
  const due = profiles.filter((p: any) => isDue(p, Date.now(), force));
  if (!due.length) return json({ sent: 0, due: 0 });

  // Catálogo = el de la app + lo que el admin sincronizó a la tabla `stores` (esto último manda)
  const rows = await sb("GET", "/rest/v1/stores?select=id,plaza,name,cats,site,verified,items").catch(() => []);
  const stores = [...new Map([...(CATALOG as any[]), ...rows.filter((r: any) => (r.items ?? []).length)].map((s) => [s.id, s])).values()];
  const offers = await sb("GET", `/rest/v1/offers?valid_until=gte.${today}&select=store_id,store_name,text,valid_until`).catch(() => []);

  let sent = 0; const out: any[] = [];
  for (const p of due) {
    try {
      const favs = (await sb("GET", `/rest/v1/favorites?user_id=eq.${p.id}&select=store_id`)).map((r: any) => r.store_id);
      const rec = recommend({ favIds: favs, stores, offers, today });
      if (!rec.sections.length) { out.push({ user: p.id, skipped: "sin favoritas con productos" }); continue; }
      const au = await sb("GET", `/auth/v1/admin/users/${p.id}`); const to = au?.email;
      if (!to) { out.push({ user: p.id, skipped: "sin correo" }); continue; }
      const mail = renderEmail(rec, { name: p.name ?? "", appUrl: APP_URL, unsubUrl: `${URL_}/functions/v1/gastabot-digest?u=${p.id}&t=${await sign(SECRET, p.id)}` });
      if (dry) { out.push({ user: p.id, to, subject: mail.subject, html: mail.html }); continue; }
      const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: FROM, to, subject: mail.subject, html: mail.html, text: mail.text }) });
      if (!r.ok) { out.push({ user: p.id, error: "Resend " + r.status }); continue; }
      await sb("PATCH", `/rest/v1/profiles?id=eq.${p.id}`, { last_digest: new Date().toISOString() });
      sent++; out.push({ user: p.id, ok: true });
    } catch (e) { out.push({ user: p.id, error: String((e as Error).message ?? e).slice(0, 120) }); }
  }
  return json({ sent, due: due.length, results: dry ? out : out.map(({ html, ...x }) => x) });
});
