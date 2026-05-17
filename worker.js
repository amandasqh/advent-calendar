/**
 * Cloudflare Worker — Birthday App Backend
 * Handles: persistent state sync + Telegram bot notifications
 *
 * Setup:
 *  1. wrangler kv:namespace create BDAY_KV
 *  2. Add the binding to wrangler.toml (see below)
 *  3. Set secrets: wrangler secret put TELEGRAM_BOT_TOKEN
 *                  wrangler secret put TELEGRAM_CHAT_ID
 *  4. wrangler deploy
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    // ── GET /state  ──────────────────────────────────────────────────────────
    if (url.pathname === "/state" && request.method === "GET") {
      const state = await env.BDAY_KV.get("app_state", "json") || {};
      return new Response(JSON.stringify(state), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ── POST /state  ─────────────────────────────────────────────────────────
    if (url.pathname === "/state" && request.method === "POST") {
      const body = await request.json();
      const prev = await env.BDAY_KV.get("app_state", "json") || {};

      // Detect newly opened days → send Telegram notification
      const newDays = (body.openedDays || []).filter(d => !(prev.openedDays || []).includes(d));
      const newStamps = (body.stamps || []).filter(s => !(prev.stamps || []).includes(s));

      await env.BDAY_KV.put("app_state", JSON.stringify(body));

      if ((newDays.length > 0 || newStamps.length > 0) && env.TELEGRAM_BOT_TOKEN) {
        const msgs = [
          newDays.length > 0 && `🎁 Opened day(s): ${newDays.join(", ")}`,
          newStamps.length > 0 && `🪙 Collected stamp(s): ${newStamps.join(", ")}`,
        ].filter(Boolean).join("\n");
        await sendTelegram(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, `Birthday app update!\n${msgs}`);
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    return new Response("Not found", { status: 404 });
  },
};

async function sendTelegram(token, chatId, text) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}
