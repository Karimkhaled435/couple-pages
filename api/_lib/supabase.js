import { createClient } from "@supabase/supabase-js";

export const BUCKET = "couple-images";

let client = null;

// عميل Supabase على السيرفر فقط (بمفتاح service_role من متغيرات البيئة)
export function getSupabase() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL أو SUPABASE_SERVICE_KEY مش متظبطين في متغيرات البيئة");
  }
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

export function generateSlug(name) {
  const clean = (name || "page")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 30) || "page";
  return `${clean}-${Math.random().toString(36).substring(2, 8)}`;
}

// إعادة المحاولة عند أخطاء الاتصال المؤقتة (مثل timeout)
export async function withRetry(fn, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const result = await fn();
      if (result && result.error) throw result.error;
      return result;
    } catch (err) {
      last = err;
      if (i < tries - 1) await new Promise((r) => setTimeout(r, 700 * (i + 1)));
    }
  }
  throw last;
}

export function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}
