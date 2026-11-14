import { getSupabase, configProblems, normalizeUrl, explain, BUCKET } from "./_lib/supabase.js";

// افتح /api/health في المتصفح عشان تعرف الموقع واصل لـ Supabase ولا لأ (مفيش أي بيانات سرية بتظهر)
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const checks = [];
  const add = (name, ok, note = "") => checks.push({ name, ok, note });

  const problems = configProblems();
  add("متغيرات البيئة", problems.length === 0, problems.join(" و ") || "موجودة");
  if (problems.length) return res.status(200).json({ ok: false, checks, hint: explain({ code: "CONFIG", message: "" }).hint });

  const url = normalizeUrl(process.env.SUPABASE_URL);
  add("شكل SUPABASE_URL", /^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/i.test(url), url.replace(/^(https:\/\/.{4}).*(\.supabase.*)$/i, "$1…$2"));

  try {
    const supabase = getSupabase();

    const pages = await supabase.from("pages").select("id, slug, lover_name, password, message, song_url, images, secret_message, cards, timeline, reasons, relation_date, song_title, closing_line").limit(1);
    if (pages.error) { const e = explain(pages.error); add("جدول pages وأعمدته", false, `${e.detail} — ${e.hint}`); }
    else add("جدول pages وأعمدته", true, "تمام");

    const bucket = await supabase.storage.getBucket(BUCKET);
    if (bucket.error) add(`bucket ${BUCKET}`, false, "مش موجود — هيتعمل تلقائياً أول رفع صورة، أو اعمله Public من Storage");
    else add(`bucket ${BUCKET}`, true, bucket.data?.public ? "موجود وPublic" : "موجود لكن مش Public — الصور مش هتظهر، فعّل Public");
  } catch (err) {
    const e = explain(err);
    add("الاتصال بـ Supabase", false, `${e.detail} — ${e.hint}`);
  }
  return res.status(200).json({ ok: checks.every(c => c.ok), checks });
}
