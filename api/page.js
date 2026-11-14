import { getSupabase, withRetry, sendError, fail } from "./_lib/supabase.js";

// بيرجّع بيانات الشاشة المقفولة فقط (الاسم + الصورة الشخصية) بدون كلمة السر
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return sendError(res, 405, "Method not allowed");

  const slug = typeof req.query?.slug === "string" ? req.query.slug : "";
  if (!slug) return sendError(res, 400, "slug مطلوب");

  try {
    const supabase = getSupabase();
    const { data } = await withRetry(() =>
      supabase.from("pages").select("lover_name, images").eq("slug", slug).maybeSingle()
    );
    if (!data) return sendError(res, 404, "مفيش صفحة بالـ link ده");

    const images = Array.isArray(data.images) ? data.images : [];
    return res.status(200).json({ lover_name: data.lover_name, profile_image: images[0] || null });
  } catch (err) {
    console.error("page error:", err);
    return fail(res, err, "read");
  }
}
