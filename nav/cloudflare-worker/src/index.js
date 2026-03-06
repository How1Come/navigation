const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

function corsPreflight() {
  return new Response(null, { status: 204, headers: CORS });
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") return corsPreflight();

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "") || "/";
    const method = request.method;

    try {
      if (path === "/sites" && method === "GET") {
        const raw = await env.SITES.get("sites");
        const sites = raw ? JSON.parse(raw) : [];
        return json({ sites });
      }

      if (path === "/auth" && method === "POST") {
        const body = await request.json();
        const username = (body.username || "").trim();
        const password = body.password || "";
        const wantUser = (env.ADMIN_USERNAME || "admin").trim();
        const wantPass = env.ADMIN_PASSWORD || "";

        if (username !== wantUser || password !== wantPass) {
          return json({ error: "Invalid credentials" }, 401);
        }

        const token = crypto.randomUUID();
        const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24h
        await env.SITES.put("token:" + token, String(expiry), {
          expirationTtl: 86400,
        });
        return json({ token });
      }

      if (path === "/sites" && method === "POST") {
        const auth = request.headers.get("Authorization") || "";
        const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
        if (!token) return json({ error: "Unauthorized" }, 401);

        const expiry = await env.SITES.get("token:" + token);
        if (!expiry || Date.now() > Number(expiry)) {
          return json({ error: "Token expired" }, 401);
        }

        const body = await request.json();
        const sites = Array.isArray(body.sites) ? body.sites : [];
        await env.SITES.put("sites", JSON.stringify(sites));
        return json({ ok: true });
      }

      return json({ error: "Not found" }, 404);
    } catch (e) {
      return json({ error: String(e.message || e) }, 500);
    }
  },
};
