import { getSupabase, generateSlug, withRetry, sendError, fail, BUCKET } from "./_lib/supabase.js";

export const config = { api: { bodyParser: { sizeLimit: "4mb" } } };

const MAX_IMAGES = 6;
const MAX_IMAGE_BYTES = 1_500_000;
const DATA_URL = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/;

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function cleanList(v, max, mapper) {
  if (!Array.isArray(v)) return [];
  return v.slice(0, max).map(mapper).filter(Boolean);
}

async function ensureBucket(supabase) {
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (data) return;
  // لو الـ bucket مش موجود اعمله Public
  const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
  if (error && !/already exists|duplicate/i.test(error.message || "")) throw error;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return sendError(res, 405, "Method not allowed");

  let step = "validate";
  try {
    const body = req.body || {};
    const loverName = str(body.lover_name, 100);
    const password = str(body.password, 100);
    const message = str(body.message, 8000);

    if (!loverName || !password || !message) {
      return sendError(res, 400, "اكتب الاسم وكلمة السر والرسالة الأول");
    }

    const cards = cleanList(body.cards, 12, (c) => {
      const front = str(c?.front, 60), back = str(c?.back, 100);
      return front || back ? { front, back } : null;
    });
    const timeline = cleanList(body.timeline, 20, (t) => {
      const title = str(t?.title, 120), date = str(t?.date, 60), desc = str(t?.desc, 1000);
      return title || desc ? { title, date, desc } : null;
    });
    const reasons = cleanList(body.reasons, 30, (r) => str(r, 300) || null);

    const rawImages = Array.isArray(body.images) ? body.images.slice(0, MAX_IMAGES) : [];
    const parsedImages = rawImages.map((img) => {
      if (!img) return null;
      const m = typeof img === "string" ? img.match(DATA_URL) : null;
      if (!m) throw Object.assign(new Error("صيغة الصورة مش مدعومة"), { status: 400 });
      const buffer = Buffer.from(m[2], "base64");
      if (buffer.length > MAX_IMAGE_BYTES) {
        throw Object.assign(new Error("إحدى الصور كبيرة قوي، جرب صورة أصغر"), { status: 413 });
      }
      return { ext: m[1] === "jpeg" ? "jpg" : m[1], mime: `image/${m[1]}`, buffer };
    });

    step = "config";
    const supabase = getSupabase();
    let slug = generateSlug(loverName);

    // رفع الصور (الصورة الشخصية دايماً في الخانة 0)
    const hasImages = parsedImages.some(Boolean);
    const imageUrls = [];
    if (hasImages) {
      step = "upload";
      await ensureBucket(supabase);
      for (let i = 0; i < parsedImages.length; i++) {
        const img = parsedImages[i];
        if (!img) { imageUrls.push(""); continue; }
        const path = `${slug}/photo-${i}.${img.ext}`;
        await withRetry(() => supabase.storage.from(BUCKET).upload(path, img.buffer, { contentType: img.mime, upsert: true }));
        imageUrls.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
      }
      while (imageUrls.length && !imageUrls[imageUrls.length - 1]) imageUrls.pop();
    }

    const row = {
      lover_name: loverName,
      password,
      message,
      song_url: str(body.song_url, 500) || null,
      images: imageUrls,
      secret_message: str(body.secret_message, 8000) || null,
      cards: JSON.stringify(cards),
      timeline: JSON.stringify(timeline),
      reasons: JSON.stringify(reasons),
      relation_date: str(body.relation_date, 10) || null,
      song_title: str(body.song_title, 200) || null,
      closing_line: str(body.closing_line, 300) || null,
    };

    step = "insert";
    // لو الـ slug اتكرر (نادر) جرب واحد جديد
    for (let attempt = 0; attempt < 3; attempt++) {
      const { error } = await supabase.from("pages").insert({ slug, ...row });
      if (!error) return res.status(200).json({ success: true, slug });
      if (error.code === "23505") { slug = generateSlug(loverName); continue; }
      throw error;
    }
    return sendError(res, 500, "مقدرناش نعمل رابط للصفحة، حاول تاني");
  } catch (err) {
    console.error("create-page error:", err);
    if (err.status && err.status < 500) return sendError(res, err.status, err.message);
    return fail(res, err, step);
  }
}
