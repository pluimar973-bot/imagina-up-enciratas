// Capa de datos v0.2: NUBE (Supabase) si hay URL+key en Ajustes; si no, almacenamiento local.
// Misma interfaz en ambos modos, así la UI no cambia. Las claves se guardan en chrome.storage.local.
(function (root) {
  const hasChrome = typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;
  const get = (key, def) => new Promise((res) => {
    if (hasChrome) chrome.storage.local.get(key, (r) => res(r[key] ?? def));
    else { try { res(JSON.parse(localStorage.getItem(key)) ?? def); } catch { res(def); } }
  });
  const set = (key, val) => new Promise((res) => {
    if (hasChrome) chrome.storage.local.set({ [key]: val }, res);
    else { localStorage.setItem(key, JSON.stringify(val)); res(); }
  });
  const today = () => new Date().toISOString().slice(0, 10);
  const F = () => root.fetchImpl || fetch;

  const DB = {
    // ---------- Ajustes ----------
    getSettings: () => get("settings", { supabaseUrl: "", supabaseKey: "", placesKey: "", city: "aguascalientes" }),
    saveSettings: (s) => set("settings", s),
    getNotif: () => get("notif", { read: {}, ts: {}, prefs: {} }),
    saveNotif: (n) => set("notif", n),
    async isCloud() { const s = await DB.getSettings(); return !!(s.supabaseUrl && s.supabaseKey); },

    // ---------- Supabase REST ----------
    async sb(method, path, body, extraHeaders = {}, base = "/rest/v1") {
      const s = await DB.getSettings(), ses = await get("session", null);
      const res = await F()(`${s.supabaseUrl.replace(/\/$/, "")}${base}${path}`, {
        method,
        headers: { apikey: s.supabaseKey, Authorization: `Bearer ${ses?.access_token || s.supabaseKey}`, "Content-Type": "application/json", ...extraHeaders },
        body: body ? JSON.stringify(body) : undefined
      });
      const txt = await res.text();
      const data = txt ? JSON.parse(txt) : null;
      if (!res.ok) throw new Error(data?.msg || data?.message || data?.error_description || `Supabase ${res.status}`);
      return data;
    },

    // ---------- Auth ----------
    getSession: () => get("session", null),
    async signUp({ email, password, name }) {
      if (!(await DB.isCloud())) { const u = { email, name, local: true }; await set("session", { user: u }); return u; }
      const d = await DB.sb("POST", "/signup", { email, password, data: { name } }, {}, "/auth/v1");
      if (d?.access_token) await set("session", d);
      return d?.user || d;
    },
    async signIn({ email, password }) {
      const d = await DB.sb("POST", "/token?grant_type=password", { email, password }, {}, "/auth/v1");
      await set("session", d);
      return d.user;
    },
    signOut: () => set("session", null),
    async getProfile() {
      const ses = await get("session", null);
      if (!(await DB.isCloud()) || !ses?.user?.id) return (await get("profile", null)) || (ses?.user ? { name: ses.user.name, email: ses.user.email } : null);
      const r = await DB.sb("GET", `/profiles?id=eq.${ses.user.id}&select=*`);
      return r[0] || null;
    },
    async saveProfile(p) {
      const ses = await get("session", null);
      if (!(await DB.isCloud()) || !ses?.user?.id) return set("profile", p);
      return DB.sb("POST", "/profiles", { id: ses.user.id, name: p.name, plaza: p.plaza, budget: p.budget ? +p.budget : null, ...(typeof p.email_digest === "boolean" ? { email_digest: p.email_digest, digest_freq: p.digest_freq === "monthly" ? "monthly" : "weekly" } : {}) }, { Prefer: "resolution=merge-duplicates" });
    },
    async isAdmin() {
      if (!(await DB.isCloud())) return true; // modo local: tú eres el admin de tu propia copia
      const p = await DB.getProfile();
      return p?.role === "admin";
    },

    // ---------- Tiendas ----------
    async listStores(city) {
      if (await DB.isCloud()) {
        const rows = await DB.sb("GET", `/stores?city=eq.${city}&select=*`);
        return rows.map((r) => ({ id: r.id, name: r.name, plaza: r.plaza, cats: r.cats || [], min: r.min_ticket, max: r.max_ticket, site: r.site, rating: r.rating, priceLevel: r.price_level, verified: r.verified, source: r.source, items: r.items || undefined, zone: r.zone ?? undefined, hours: r.hours || undefined, phone: r.phone || undefined }));
      }
      return get("extraStores", []);
    },
    async upsertStores(city, list) {
      if (await DB.isCloud()) {
        const rows = list.map((s) => ({ id: s.id, city, plaza: s.plaza, name: s.name, cats: s.cats, min_ticket: s.min, max_ticket: s.max, site: s.site || null, rating: s.rating || null, price_level: s.priceLevel || null, verified: !!s.verified, source: s.source || "manual", items: s.items || null, zone: s.zone ?? null, hours: s.hours || null, phone: s.phone || null }));
        return DB.sb("POST", "/stores", rows, { Prefer: "resolution=merge-duplicates" });
      }
      const cur = await get("extraStores", []);
      const map = new Map(cur.map((s) => [s.id, s]));
      list.forEach((s) => map.set(s.id, { ...map.get(s.id), ...s }));
      return set("extraStores", [...map.values()]);
    },

    // ---------- Ofertas (manual con vigencia; punto 3 del plan) ----------
    // ---------- Comunidad ----------
    // Nube: tabla community_posts (ver supabase/community.sql). Sin nube: sólo en este dispositivo.
    async listPosts() {
      if (await DB.isCloud()) return DB.sb("GET", `/community_posts?select=id,user_id,author,kind,title,body,store,plaza,likes,valid_until,still_ok,gone,created_at&or=(valid_until.is.null,valid_until.gte.${today()})&order=created_at.desc&limit=80`);
      return (await get("community", [])).filter((p) => !p.valid_until || p.valid_until >= today());
    },
    async addPost(p) {
      const ses = await get("session", null);
      if (await DB.isCloud()) { if (!ses?.user?.id) throw new Error("Entra con tu cuenta para publicar."); return DB.sb("POST", "/community_posts", p, { Prefer: "return=representation" }); }
      const l = await get("community", []); l.unshift({ id: "c-" + Date.now(), user_id: "local", author: ses?.user?.name || "Tú", likes: 0, created_at: new Date().toISOString(), ...p }); return set("community", l.slice(0, 200));
    },
    async deletePost(id) {
      if (await DB.isCloud()) return DB.sb("DELETE", `/community_posts?id=eq.${id}`);
      return set("community", (await get("community", [])).filter((x) => x.id !== id));
    },
    async myLikes() {
      const ses = await get("session", null);
      if (await DB.isCloud()) return ses?.user?.id ? (await DB.sb("GET", "/community_likes?select=post_id")).map((r) => r.post_id) : [];
      return get("community_likes", []);
    },
    async toggleLike(id, on) {
      const ses = await get("session", null);
      if (await DB.isCloud()) {
        if (!ses?.user?.id) throw new Error("Entra con tu cuenta para dar me gusta.");
        return on ? DB.sb("POST", "/community_likes", { post_id: id }) : DB.sb("DELETE", `/community_likes?post_id=eq.${id}`);
      }
      const l = new Set(await get("community_likes", [])); on ? l.add(id) : l.delete(id); await set("community_likes", [...l]);
      const posts = await get("community", []); const p = posts.find((x) => x.id === id); if (p) p.likes = Math.max(0, (p.likes || 0) + (on ? 1 : -1)); return set("community", posts);
    },
    // «Foto a oferta»: manda la foto (reducida) a la función gastabot-offer-scan; devuelve campos para PRE-LLENAR el formulario.
    async scanOffer(image, media, mode = "oferta") {
      const s = await DB.getSettings(), ses = await get("session", null);
      if (!(await DB.isCloud())) throw new Error("Leer una oferta desde foto requiere la nube (Supabase) y la función gastabot-offer-scan.");
      if (!ses?.access_token) throw new Error("Entra con tu cuenta para usar esta función.");
      const res = await F()(`${s.supabaseUrl.replace(/\/$/, "")}/functions/v1/gastabot-offer-scan`, { method: "POST", headers: { apikey: s.supabaseKey, Authorization: `Bearer ${ses.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ image, media, mode }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `No se pudo leer la foto (${res.status}). ¿Ya desplegaste gastabot-offer-scan?`);
      return data;
    },
    // ---------- Precios locales (supabase/prices.sql); sin nube quedan sólo en este dispositivo ----------
    async listPrices() {
      if (await DB.isCloud()) return DB.sb("GET", "/price_reports?select=id,user_id,author,category,product,unit,price,place,zone,note,seen_on,still_ok,gone,created_at&order=seen_on.desc,created_at.desc&limit=400");
      return get("prices", []);
    },
    async addPrices(rows) {
      const ses = await get("session", null);
      if (await DB.isCloud()) { if (!ses?.user?.id) throw new Error("Entra con tu cuenta para registrar precios."); return DB.sb("POST", "/price_reports", rows, { Prefer: "return=minimal" }); }
      const l = await get("prices", []), now = Date.now();
      rows.forEach((r, i) => l.unshift({ id: "p-" + now + "-" + i, user_id: "local", author: ses?.user?.name || "Tú", still_ok: 0, gone: 0, created_at: new Date(now).toISOString(), ...r }));
      return set("prices", l.slice(0, 500));
    },
    async deletePrice(id) {
      if (await DB.isCloud()) return DB.sb("DELETE", `/price_reports?id=eq.${id}`);
      return set("prices", (await get("prices", [])).filter((x) => x.id !== id));
    },
    async myPriceVotes() {
      const ses = await get("session", null);
      if (await DB.isCloud()) return ses?.user?.id ? Object.fromEntries((await DB.sb("GET", "/price_votes?select=post_id,ok")).map((r) => [r.post_id, r.ok])) : {};
      return get("price_votes", {});
    },
    async votePrice(id, ok) {                    // ok: true «sigue así», false «ya cambió», null quita el voto
      const ses = await get("session", null);
      if (await DB.isCloud()) {
        if (!ses?.user?.id) throw new Error("Entra con tu cuenta para confirmar precios.");
        if (ok === null) return DB.sb("DELETE", `/price_votes?post_id=eq.${id}`);
        return DB.sb("POST", "/price_votes", { post_id: id, ok }, { Prefer: "resolution=merge-duplicates" });
      }
      const v = await get("price_votes", {}), prev = v[id];
      if (ok === null) delete v[id]; else v[id] = ok; await set("price_votes", v);
      const l = await get("prices", []), p = l.find((x) => x.id === id);
      if (p) { p.still_ok = (p.still_ok || 0) - (prev === true) + (ok === true); p.gone = (p.gone || 0) - (prev === false) + (ok === false); }
      return set("prices", l);
    },
    async flagPrice(id) {
      const ses = await get("session", null);
      if (!(await DB.isCloud())) return DB.deletePrice(id);
      if (!ses?.user?.id) throw new Error("Entra con tu cuenta para reportar.");
      return DB.sb("POST", "/price_flags", { post_id: id });
    },
    async listRequests() {
      if (await DB.isCloud()) return DB.sb("GET", `/price_requests?select=id,user_id,author,category,product,zone,note,created_at&created_at=gte.${new Date(Date.now() - 30 * 864e5).toISOString()}&order=created_at.desc&limit=60`);
      return (await get("price_requests", [])).filter((r) => Date.now() - Date.parse(r.created_at) < 30 * 864e5);
    },
    async addRequest(r) {
      const ses = await get("session", null);
      if (await DB.isCloud()) { if (!ses?.user?.id) throw new Error("Entra con tu cuenta para pedir cotización."); return DB.sb("POST", "/price_requests", r, { Prefer: "return=minimal" }); }
      const l = await get("price_requests", []); l.unshift({ id: "q-" + Date.now(), user_id: "local", author: ses?.user?.name || "Tú", created_at: new Date().toISOString(), ...r }); return set("price_requests", l.slice(0, 100));
    },
    async deleteRequest(id) {
      if (await DB.isCloud()) return DB.sb("DELETE", `/price_requests?id=eq.${id}`);
      return set("price_requests", (await get("price_requests", [])).filter((x) => x.id !== id));
    },
    async myVotes() {
      const ses = await get("session", null);
      if (await DB.isCloud()) return ses?.user?.id ? Object.fromEntries((await DB.sb("GET", "/community_votes?select=post_id,ok")).map((r) => [r.post_id, r.ok])) : {};
      return get("community_votes", {});
    },
    async vote(id, ok) {                         // ok: true «sigue vigente», false «ya no», null quita el voto
      const ses = await get("session", null);
      if (await DB.isCloud()) {
        if (!ses?.user?.id) throw new Error("Entra con tu cuenta para confirmar ofertas.");
        if (ok === null) return DB.sb("DELETE", `/community_votes?post_id=eq.${id}`);
        return DB.sb("POST", "/community_votes", { post_id: id, ok }, { Prefer: "resolution=merge-duplicates" });
      }
      const v = await get("community_votes", {}), prev = v[id];
      if (ok === null) delete v[id]; else v[id] = ok; await set("community_votes", v);
      const posts = await get("community", []), p = posts.find((x) => x.id === id);
      if (p) { p.still_ok = (p.still_ok || 0) - (prev === true) + (ok === true); p.gone = (p.gone || 0) - (prev === false) + (ok === false); }
      return set("community", posts);
    },
    async reportPost(id) {
      const ses = await get("session", null);
      if (!(await DB.isCloud())) return DB.deletePost(id);
      if (!ses?.user?.id) throw new Error("Entra con tu cuenta para reportar.");
      return DB.sb("POST", "/community_reports", { post_id: id });
    },

    async listOffers() {
      if (await DB.isCloud()) return DB.sb("GET", `/offers?valid_until=gte.${today()}&select=*&order=valid_until.asc`);
      return (await get("offers", [])).filter((o) => o.valid_until >= today());
    },
    async addOffer(o) {
      if (await DB.isCloud()) return DB.sb("POST", "/offers", o);
      const l = await get("offers", []); l.push({ id: "o-" + Date.now(), ...o }); return set("offers", l);
    },


    // ---------- Chats guardados ----------
    async _cloudUser() { const ses = await get("session", null); return (await DB.isCloud()) && ses?.user?.id ? ses.user.id : null; },
    async listChats() {
      if (await DB._cloudUser()) {
        const r = await DB.sb("GET", "/chats?select=id,title,updated_at&order=updated_at.desc&limit=50");
        return r.map((c) => ({ id: c.id, title: c.title, updated: c.updated_at }));
      }
      return (await get("chats", [])).map(({ id, title, updated }) => ({ id, title, updated })).sort((a, b) => (b.updated || "").localeCompare(a.updated || ""));
    },
    async loadChat(id) {
      if (await DB._cloudUser()) { const r = await DB.sb("GET", `/chats?id=eq.${encodeURIComponent(id)}&select=*`); return r[0] ? { id: r[0].id, title: r[0].title, updated: r[0].updated_at, messages: r[0].messages || [] } : null; }
      return (await get("chats", [])).find((c) => c.id === id) || null;
    },
    async saveChat(chat) {
      const c = { ...chat, messages: (chat.messages || []).slice(-60), updated: new Date().toISOString() };
      if (await DB._cloudUser()) return DB.sb("POST", "/chats", { id: c.id, title: c.title, messages: c.messages, updated_at: c.updated }, { Prefer: "resolution=merge-duplicates" });
      const all = (await get("chats", [])).filter((x) => x.id !== c.id); all.push(c);
      all.sort((a, b) => (b.updated || "").localeCompare(a.updated || ""));
      return set("chats", all.slice(0, 50));
    },
    async deleteChat(id) {
      if (await DB._cloudUser()) return DB.sb("DELETE", `/chats?id=eq.${encodeURIComponent(id)}`);
      return set("chats", (await get("chats", [])).filter((c) => c.id !== id));
    },

    // ---------- Favoritos / historial / métricas ----------
    async getFavs() {
      const ses = await get("session", null);
      if (await DB.isCloud() && ses?.user?.id) return (await DB.sb("GET", `/favorites?user_id=eq.${ses.user.id}&select=store_id`)).map((r) => r.store_id);
      return get("favs", []);
    },
    async setFav(storeId, on) {
      const ses = await get("session", null);
      if (await DB.isCloud() && ses?.user?.id) {
        return on ? DB.sb("POST", "/favorites", { user_id: ses.user.id, store_id: storeId }, { Prefer: "resolution=ignore-duplicates" })
                  : DB.sb("DELETE", `/favorites?user_id=eq.${ses.user.id}&store_id=eq.${encodeURIComponent(storeId)}`);
      }
      const f = new Set(await get("favs", [])); on ? f.add(storeId) : f.delete(storeId); return set("favs", [...f]);
    },
    async logSearch(q, budget) {
      const ses = await get("session", null);
      const m = await get("metrics", { searches: 0, favs: 0, storesAdded: 0, days: [] });
      m.searches++; if (!m.days.includes(today())) m.days.push(today()); await set("metrics", m);
      if (await DB.isCloud() && ses?.user?.id) { try { await DB.sb("POST", "/searches", { user_id: ses.user.id, query: q, budget }); } catch {} }
    },
    getMetrics: () => get("metrics", { searches: 0, favs: 0, storesAdded: 0, days: [] }),
    clear: () => new Promise((res) => { if (hasChrome) chrome.storage.local.clear(res); else { localStorage.clear(); res(); } })
  };
  root.DB = DB;
  if (typeof module !== "undefined") module.exports = DB;
})(typeof window !== "undefined" ? window : globalThis);
