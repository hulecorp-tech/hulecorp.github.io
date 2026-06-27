// Supabase Edge Function: magnific
// Proxy an toàn cho Magnific (Freepik) API — giấu API key ở server.
// Deploy: supabase functions deploy magnific
// Set key:  supabase secrets set MAGNIFIC_API_KEY=xxxx
//
// Frontend gọi với JSON body { action, ... }. Các action:
//   generate         -> POST /v1/ai/mystic            (text-to-image)
//   status           -> GET  /v1/ai/mystic/{task_id}
//   upscale          -> POST /v1/ai/image-upscaler    (nâng cấp + thêm chi tiết)
//   upscale_status   -> GET  /v1/ai/image-upscaler/{task_id}

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const API = "https://api.magnific.com/v1/ai";
const KEY = Deno.env.get("MAGNIFIC_API_KEY") ?? "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!KEY) return json({ error: "MAGNIFIC_API_KEY chưa được cấu hình" }, 500);

  try {
    const body = await req.json();
    const action = body.action;
    let url = "";
    let method = "GET";
    let payload: Record<string, unknown> | undefined;

    if (action === "generate") {
      url = `${API}/mystic`;
      method = "POST";
      payload = {
        prompt: body.prompt,
        resolution: body.resolution || "2k",
        aspect_ratio: body.aspect_ratio || "square_1_1",
        model: body.model || "realism",
      };
    } else if (action === "status") {
      url = `${API}/mystic/${body.task_id}`;
    } else if (action === "upscale") {
      url = `${API}/image-upscaler`;
      method = "POST";
      payload = { image: body.image, ...(body.options || {}) };
    } else if (action === "upscale_status") {
      url = `${API}/image-upscaler/${body.task_id}`;
    } else {
      return json({ error: "unknown action" }, 400);
    }

    const r = await fetch(url, {
      method,
      headers: { "x-magnific-api-key": KEY, "Content-Type": "application/json" },
      body: method === "POST" ? JSON.stringify(payload) : undefined,
    });
    const data = await r.json().catch(() => ({}));
    return json(data, r.status);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
