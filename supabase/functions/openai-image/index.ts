// Supabase Edge Function: openai-image
// Proxy an toàn cho OpenAI Images API (GPT Image) — giấu OPENAI_API_KEY ở server.
// Deploy:  supabase functions deploy openai-image
// Set key: supabase secrets set OPENAI_API_KEY=sk-...
//
// Frontend gọi POST với JSON body:
//   { action:"generate", prompt, size?, quality?, background? }
//     size:    "1024x1024" | "1536x1024" | "1024x1536" | "auto"   (mặc định 1024x1024)
//     quality: "low" | "medium" | "high" | "auto"                 (mặc định medium)
//   -> trả về { image: "data:image/png;base64,..." }
//
//   { action:"edit", prompt, image, size?, quality? }
//     image: data URL (base64) của ảnh gốc cần chỉnh
//   -> trả về { image: "data:image/png;base64,..." }

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const MODEL = "gpt-image-1";

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

// Turn a data URL / base64 string into a Blob for multipart uploads.
function dataUrlToBlob(dataUrl: string): Blob {
  const m = /^data:([^;]+);base64,(.*)$/s.exec(dataUrl);
  const mime = m ? m[1] : "image/png";
  const b64 = m ? m[2] : dataUrl;
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: mime });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!KEY) return json({ error: "OPENAI_API_KEY chưa được cấu hình trên Supabase." }, 500);

  try {
    const body = await req.json();
    const action = body.action || "generate";
    const size = body.size || "1024x1024";
    const quality = body.quality || "medium";

    if (!body.prompt || !String(body.prompt).trim()) {
      return json({ error: "Thiếu prompt." }, 400);
    }

    let r: Response;

    if (action === "edit") {
      if (!body.image) return json({ error: "Thiếu ảnh gốc để chỉnh sửa." }, 400);
      const form = new FormData();
      form.append("model", MODEL);
      form.append("prompt", body.prompt);
      form.append("size", size);
      form.append("quality", quality);
      form.append("image", dataUrlToBlob(body.image), "image.png");
      r = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: { Authorization: `Bearer ${KEY}` },
        body: form,
      });
    } else {
      // generate
      r = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          prompt: body.prompt,
          size,
          quality,
          n: 1,
          ...(body.background ? { background: body.background } : {}),
        }),
      });
    }

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return json({ error: data?.error?.message || `OpenAI lỗi (${r.status})` }, r.status);
    }
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) return json({ error: "OpenAI không trả về ảnh." }, 502);
    return json({ image: `data:image/png;base64,${b64}` });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
