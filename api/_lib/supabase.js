import { createClient } from "@supabase/supabase-js";

export const BUCKET = "couple-images";

let client = null;
let clientKey = "";

// تنضيف القيم اللي بتتلصق غلط في Vercel (مسافات، علامات تنصيص، / في الآخر، /rest/v1)
function cleanEnv(v) {
  return String(v || "").trim().replace(/^["']|["']$/g, "").trim();
}
export function normalizeUrl(raw) {
  let u = cleanEnv(raw);
  if (!u) return "";
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  return u.replace(/\/+$/, "").replace(/\/(rest|storage|auth)\/v1.*$/i, "");
}

export function configProblems() {
  const problems = [];
  if (!cleanEnv(process.env.SUPABASE_URL)) problems.push("SUPABASE_URL مش موجود");
  if (!cleanEnv(process.env.SUPABASE_SERVICE_KEY)) problems.push("SUPABASE_SERVICE_KEY مش موجود");
  return problems;
}

// عميل Supabase على السيرفر فقط (بمفتاح service_role من متغيرات البيئة)
export function getSupabase() {
  const problems = configProblems();
  if (problems.length) {
    throw Object.assign(new Error(problems.join(" و ")), { code: "CONFIG" });
  }
  const url = normalizeUrl(process.env.SUPABASE_URL);
  const key = cleanEnv(process.env.SUPABASE_SERVICE_KEY);
  if (client && clientKey === url + key) return client;
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  clientKey = url + key;
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

// إعادة المحاولة عند أخطاء الاتصال المؤقتة (مثل timeout) فقط، مش أخطاء الإعدادات
export async function withRetry(fn, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const result = await fn();
      if (result && result.error) throw result.error;
      return result;
    } catch (err) {
      last = err;
      if (isPermanent(err)) throw err;
      if (i < tries - 1) await new Promise((r) => setTimeout(r, 700 * (i + 1)));
    }
  }
  throw last;
}

function isPermanent(err) {
  const msg = String(err?.message || "");
  const code = String(err?.code || "");
  const status = Number(err?.status || err?.statusCode || 0);
  return (
    ["42P01", "42703", "PGRST301", "PGRST205", "PGRST204", "23502", "CONFIG"].includes(code) ||
    status === 401 || status === 403 ||
    /invalid api key|jwt|not found|does not exist/i.test(msg)
  );
}

// بيحوّل خطأ Supabase لسبب مفهوم + حل مقترح بالعربي (بدون أي بيانات سرية)
export function explain(err) {
  const msg = String(err?.message || err || "");
  const code = String(err?.code || "");
  const status = Number(err?.status || err?.statusCode || 0);
  let hint = "";
  if (code === "CONFIG") hint = "ضيف SUPABASE_URL و SUPABASE_SERVICE_KEY في Vercel ← Settings ← Environment Variables ثم اعمل Redeploy";
  else if (/invalid api key|jwt|signature/i.test(msg) || ["PGRST301"].includes(code) || status === 401 || status === 403)
    hint = "مفتاح SUPABASE_SERVICE_KEY غلط أو قديم — انسخ مفتاح service_role الجديد من Supabase ← Settings ← API ثم Redeploy";
  else if (code === "42P01" || code === "PGRST205" || /relation .* does not exist|could not find the table/i.test(msg))
    hint = "جدول pages مش موجود — شغّل ملف supabase/setup.sql في SQL Editor";
  else if (code === "42703" || code === "PGRST204" || /column .* does not exist|could not find the .* column/i.test(msg))
    hint = "في عمود ناقص في جدول pages — شغّل ملف supabase/setup.sql في SQL Editor";
  else if (/bucket not found/i.test(msg))
    hint = "الـ bucket اسمه couple-images مش موجود — اعمله Public من Supabase ← Storage";
  else if (/fetch failed|enotfound|invalid url|econnrefused/i.test(msg))
    hint = "SUPABASE_URL غلط — لازم يبقى بالشكل https://xxxx.supabase.co";
  else if (/timed out|timeout/i.test(msg))
    hint = "Supabase بطيء دلوقتي — جرّب تاني، وتأكد إن المشروع Active مش Paused";
  else if (code === "23502") hint = "عمود إجباري فاضي في جدول pages — شغّل supabase/setup.sql";
  return { hint, detail: `${code || status || ""} ${msg}`.trim().slice(0, 240) };
}

export function sendError(res, status, message, extra = {}) {
  return res.status(status).json({ error: message, ...extra });
}

// خطأ سيرفر: بيرجّع رسالة عامة + السبب والحل المقترح
export function fail(res, err, step = "") {
  const { hint, detail } = explain(err);
  return res.status(500).json({
    error: "حصلت مشكلة في السيرفر",
    hint,
    detail: `${step ? step + ": " : ""}${detail}`,
  });
}
