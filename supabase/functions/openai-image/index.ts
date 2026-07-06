// Supabase Edge Function: openai-image
// Proxy an toàn cho OpenAI Images API (GPT Image) — giấu OPENAI_API_KEY ở server.
// Deploy:  supabase functions deploy openai-image
// Set key: supabase secrets set OPENAI_API_KEY=sk-...
//
// Frontend gọi POST với JSON body:
//   { action:"generate", model?, prompt, size?, quality?, background? }
//     model:   gpt-image-2 | gpt-image-1.5 | gpt-image-1 | gpt-image-1-mini | dall-e-3 | dall-e-2
//              (mặc định gpt-image-2; ID lạ sẽ bị đưa về mặc định)
//     size:    tuỳ model (vd gpt-image: 1024x1024 | 1536x1024 | 1024x1536)
//     quality: gpt-image: low|medium|high ; dall-e-3: standard|hd
//   -> trả về { image: "data:image/png;base64,..." }
//
//   { action:"edit", prompt, image, size?, quality? }
//     image: data URL (base64) của ảnh gốc cần chỉnh
//   -> trả về { image: "data:image/png;base64,..." }
//
//   { action:"magic", prompt }
//     -> viết lại prompt ngắn (có thể tiếng Việt) thành prompt tiếng Anh chi tiết
//     -> trả về { prompt: "..." }   (dùng chat model gpt-4o-mini)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const ALLOWED_MODELS = [
  "gpt-image-2",
  "gpt-image-1.5",
  "gpt-image-1",
  "gpt-image-1-mini",
  "dall-e-3",
  "dall-e-2",
];
const DEFAULT_MODEL = "gpt-image-2";

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
    const model = ALLOWED_MODELS.includes(body.model) ? body.model : DEFAULT_MODEL;
    const size = body.size || "1024x1024";
    const quality = body.quality; // meaning differs per model; may be undefined

    if (!body.prompt || !String(body.prompt).trim()) {
      return json({ error: "Thiếu prompt." }, 400);
    }

    // Magic Prompt — expand a short (possibly Vietnamese) brief into a rich English image prompt.
    if (action === "magic") {
      const mr = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.8,
          max_tokens: 320,
          messages: [
            { role: "system", content: "You are a prompt engineer for AI image generation. Rewrite the user's short brief (which may be in Vietnamese) into ONE vivid, detailed English image-generation prompt. Cover subject, style, composition, lighting and colours. Return ONLY the prompt text — no quotes, no preamble, no explanation." },
            { role: "user", content: String(body.prompt) },
          ],
        }),
      });
      const md = await mr.json().catch(() => ({}));
      if (!mr.ok) return json({ error: md?.error?.message || `OpenAI lỗi (${mr.status})` }, mr.status);
      const text = md?.choices?.[0]?.message?.content?.trim();
      if (!text) return json({ error: "Không tạo được prompt." }, 502);
      return json({ prompt: text });
    }

    let r: Response;

    if (action === "edit") {
      // Image editing uses the gpt-image family; fall back to the default if a dall-e model was picked.
      if (!body.image) return json({ error: "Thiếu ảnh gốc để chỉnh sửa." }, 400);
      const editModel = model.startsWith("gpt-image") ? model : DEFAULT_MODEL;
      const form = new FormData();
      form.append("model", editModel);
      form.append("prompt", body.prompt);
      form.append("size", size);
      if (quality) form.append("quality", quality);
      form.append("image", dataUrlToBlob(body.image), "image.png");
      r = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: { Authorization: `Bearer ${KEY}` },
        body: form,
      });
    } else {
      // generate — each model family takes different params
      const payload: Record<string, unknown> = { model, prompt: body.prompt, size, n: 1 };
      if (model.startsWith("gpt-image")) {
        // gpt-image-* returns b64_json by default; quality is low|medium|high|auto
        if (quality) payload.quality = quality;
        if (body.background) payload.background = body.background;
      } else {
        // dall-e-2 / dall-e-3 need response_format to return base64
        payload.response_format = "b64_json";
        if (model === "dall-e-3") {
          payload.quality = quality === "hd" ? "hd" : "standard"; // standard|hd
          if (body.style) payload.style = body.style; // vivid|natural
        }
      }
      r = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
