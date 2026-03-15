import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://nodwemqhniihepefkjjl.supabase.co",
  process.env.SUPABASE_SERVICE_KEY
);

function generateSlug(name) {
  const clean = (name || "page").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return `${clean}-${Math.random().toString(36).substring(2, 6)}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const body = req.body;

    // تحقق من الدفع
    const status = body?.data?.status || body?.status;
    if (status !== "paid" && status !== "success") {
      return res.status(200).json({ message: "not paid yet" });
    }

    // جيب الـ page_data من الـ metadata
    const metadata = body?.data?.metadata || body?.metadata || {};
    const pageData = metadata.page_data ? JSON.parse(metadata.page_data) : null;

    if (!pageData) {
      return res.status(200).json({ message: "no page data" });
    }

    // عمل الصفحة في الـ database
    const slug = generateSlug(pageData.lover_name);
    const { error } = await supabase.from("pages").insert({
      slug,
      lover_name: pageData.lover_name,
      password: pageData.password,
      message: pageData.message,
      song_url: pageData.song_url || null,
      images: pageData.images || [],
      secret_message: pageData.secret_message || null,
      cards: pageData.cards || null,
      timeline: pageData.timeline || null,
      reasons: pageData.reasons || null,
      relation_date: pageData.relation_date || null,
      song_title: pageData.song_title || null,
      closing_line: pageData.closing_line || null,
    });

    if (error) throw error;

    const pageUrl = `https://couple-pages.vercel.app/for/${slug}`;
    return res.status(200).json({ success: true, url: pageUrl });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
