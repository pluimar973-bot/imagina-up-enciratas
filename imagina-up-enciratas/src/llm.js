// Cliente del chat con IA: llama a la función de Supabase; si algo falla devuelve null y la app usa sus reglas.
(function (root) {
  const INTENTS = ["saludo", "charla", "ayuda", "armar", "agregar", "comparar", "mas_ideas", "otro"];
  const SHOP = ["armar", "agregar", "comparar", "mas_ideas"];
  const enabled = (s) => !!(s && s.llm && s.supabaseUrl && s.supabaseKey);

  function normalize(j) {
    if (!j || typeof j !== "object" || j.error) return null;
    const intent = INTENTS.includes(j.intent) ? j.intent : "otro";
    const num = Number.isFinite(+j.budget) && +j.budget >= 20 && +j.budget <= 1e6 ? Math.round(+j.budget) : 0;
    return {
      intent, shop: SHOP.includes(intent), budget: num,
      categories: Array.isArray(j.categories) ? j.categories.filter((x) => typeof x === "string").slice(0, 6) : [],
      terms: Array.isArray(j.product_terms) ? j.product_terms.filter((x) => typeof x === "string").slice(0, 4) : [],
      plaza: typeof j.plaza === "string" ? j.plaza : "",
      reply: typeof j.reply === "string" ? j.reply.slice(0, 280) : ""
    };
  }

  async function interpret(text, ctx, settings, fetchFn) {
    if (!enabled(settings)) return null;
    if (typeof navigator !== "undefined" && navigator.onLine === false) return null;
    const ac = new AbortController(), t = setTimeout(() => ac.abort(), 9000);
    try {
      const r = await (fetchFn || fetch)(settings.supabaseUrl.replace(/\/$/, "") + "/functions/v1/gastabot-chat", {
        method: "POST", signal: ac.signal,
        headers: { apikey: settings.supabaseKey, Authorization: "Bearer " + settings.supabaseKey, "Content-Type": "application/json" },
        body: JSON.stringify({ text: String(text).slice(0, 400), ctx })
      });
      if (!r.ok) return null;
      return normalize(await r.json());
    } catch { return null; } finally { clearTimeout(t); }
  }

  // Convierte lo que entendió la IA en una frase que el motor de reglas ya sabe resolver.
  function toQuery(ai, label) {
    const cats = ai.categories.map((c) => String(label(c) || c).toLowerCase()), parts = [...cats, ...ai.terms];
    const money = ai.budget ? `$${ai.budget} ` : "";
    if (ai.intent === "mas_ideas") return "¿qué más me alcanza?";
    if (ai.intent === "agregar") return "agrega " + parts.join(" ");
    return (money + parts.join(" ")).trim();
  }

  const api = { enabled, interpret, toQuery, normalize };
  root.GastaLLM = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
