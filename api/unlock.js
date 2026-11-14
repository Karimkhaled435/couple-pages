import { getSupabase, withRetry, sendError, fail } from "./_lib/supabase.js";

// بيتحقق من كلمة السر على السيرفر وبيرجّع الصفحة كاملة (بدون كلمة السر) لو صح
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return sendError(res, 405, "Method not allowed");

  const { slug, password } = req.body || {};
  if (typeof slug !== "string" || typeof password !== "string" || !slug) {
    return sendError(res, 400, "بيانات ناقصة");
  }

  try {
    const supabase = getSupabase();
    const { data } = await withRetry(() =>
      supabase.from("pages").select("*").eq("slug", slug).maybeSingle()
    );
    if (!data) return sendError(res, 404, "مفيش صفحة بالـ link ده");

    if (password.trim().toLowerCase() !== String(data.password ?? "").trim().toLowerCase()) {
      return sendError(res, 401, "الباسورد غلط");
    }

    const safe = { ...data };
    delete safe.password;
    return res.status(200).json({ page: safe });
  } catch (err) {
    console.error("unlock error:", err);
    return fail(res, err, "read");
  }
}
