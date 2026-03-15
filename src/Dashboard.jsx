import { useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://nodwemqhniihepefkjjl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vZHdlbXFobmlpaGVwZWZrampsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUyMzMwOCwiZXhwIjoyMDg5MDk5MzA4fQ.3nWlgR5XuyyrtObV0Uwv9WfUYsXHXqYYfDp4ljutyKY"
);

const FAWATERAK_API_KEY = "67cc15bd91387e48b7d59d60526f83c19ebde5886c8fa784af";
const FAWATERAK_PROVIDER_KEY = "FAWATERAK.27356";
const PRODUCT_ID = "15826";

const glass = { background: "rgba(255,255,255,0.05)", backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)", borderRadius: 20 };
const inp = { width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "white", fontSize: 15, fontFamily: "'Cairo',sans-serif", outline: "none", boxSizing: "border-box" };
const lbl = { display: "block", fontSize: 13, color: "#f9a8d4", marginBottom: 8, fontWeight: 600 };
const sec = { fontSize: 16, fontWeight: 800, color: "#f9a8d4", marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid rgba(255,77,166,0.3)" };

function generateTempSlug() {
  return `temp-${Math.random().toString(36).substring(2, 10)}`;
}

export default function Dashboard() {
  const [loverName, setLoverName] = useState("");
  const [password, setPassword] = useState("");
  const [relationDate, setRelationDate] = useState("");
  const [message, setMessage] = useState("");
  const [secretMessage, setSecretMessage] = useState("");
  const [closingLine, setClosingLine] = useState("بحبك ولسه هحبك تاني، وهفضل أحبك يا أغلى حاجة في الدنيا ❤️");
  const [songUrl, setSongUrl] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [cards, setCards] = useState([
    { front: "أول انطباع", back: "قمر وخاطفة للقلب" },
    { front: "أمنيتي", back: "نكمل عمرنا سوا" },
    { front: "وعدي ليكي", back: "هفضل سندك دايماً" },
  ]);
  const [timeline, setTimeline] = useState([
    { title: "يوم ما اتعرفنا", date: "", desc: "أحلى صدفة في حياتي، يوم ما دخلتي حياتي وغيرتيها." },
    { title: "أول مرة أقولك بحبك", date: "", desc: "كنت خايف ومكسوف، بس كانت طالعة من قلبي بجد." },
    { title: "البداية الرسمية", date: "", desc: "اليوم اللي وعدتك فيه قدام الدنيا كلها إنك بتاعتي." },
  ]);
  const [reasons, setReasons] = useState([
    "عشان حنيتك اللي مفيش زيها في الدنيا.",
    "عشان ضحكتك بتنسيني كل همومي.",
    "عشان وقفتك جنبي في أصعب أوقاتي.",
    "عشان عيونك اللي بسرح فيهم.",
    "عشان تفاصيلك الصغيرة اللي محدش واخد باله منها غيري.",
    "عشان ببساطة.. أنتي روحي اللي بتنفس بيها.",
  ]);

  const [images, setImages] = useState([null, null, null, null, null, null]);
  const [previews, setPreviews] = useState([null, null, null, null, null, null]);
  const profileInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState("basic");

  const handleProfileImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const newImages = [...images]; newImages[0] = file;
    const newPreviews = [...previews]; newPreviews[0] = URL.createObjectURL(file);
    setImages(newImages); setPreviews(newPreviews);
  };

  const handleGalleryImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    const newImages = [...images]; const newPreviews = [...previews];
    files.forEach((file, i) => { newImages[i + 1] = file; newPreviews[i + 1] = URL.createObjectURL(file); });
    setImages(newImages); setPreviews(newPreviews);
  };

  const uploadImages = async (slug) => {
    const urls = [];
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      if (!file) continue;
      const ext = file.name.split(".").pop();
      const path = `${slug}/photo-${i}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("couple-images").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("couple-images").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  };

  const handlePayment = async () => {
    setError(null);
    if (!loverName.trim() || !password.trim() || !message.trim()) {
      setError("اكتب الاسم وكلمة السر والرسالة الأول");
      return;
    }

    setLoading(true);
    try {
      // 1. ارفع الصور أول
      setLoadingMsg("بيرفع الصور...");
      const tempSlug = generateTempSlug();
      const imageUrls = await uploadImages(tempSlug);

      // 2. جمع البيانات
      const pageData = {
        lover_name: loverName.trim(),
        password: password.trim(),
        message: message.trim(),
        song_url: songUrl.trim() || null,
        images: imageUrls,
        secret_message: secretMessage.trim() || null,
        cards: JSON.stringify(cards),
        timeline: JSON.stringify(timeline),
        reasons: JSON.stringify(reasons),
        relation_date: relationDate || null,
        song_title: songTitle.trim() || null,
        closing_line: closingLine.trim() || null,
        temp_slug: tempSlug,
      };

      // 3. احفظ البيانات في Supabase مؤقتاً
      setLoadingMsg("بيجهز الدفع...");
      const token = Math.random().toString(36).substring(2, 18);
      const { error: tokenError } = await supabase.from("pending_pages").insert({
        token,
        page_data: pageData,
      });
      if (tokenError) throw tokenError;

      // 4. عمل invoice على Fawaterak
      const invoiceRes = await fetch("https://app.fawaterk.com/api/v2/invoices/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${FAWATERAK_API_KEY}`,
        },
        body: JSON.stringify({
          cartItems: [{
            name: "Couple Page",
            price: "205",
            quantity: "1",
          }],
          cartTotal: "205",
          currency: "EGP",
          customer: {
            first_name: loverName.trim(),
            last_name: ".",
            email: "customer@couplepage.app",
            phone: "01000000000",
          },
          redirectionUrls: {
            successUrl: `https://couple-pages.vercel.app/success?token=${token}`,
            failUrl: `https://couple-pages.vercel.app?error=payment_failed`,
            pendingUrl: `https://couple-pages.vercel.app?error=payment_pending`,
          },
        }),
      });

      const invoiceData = await invoiceRes.json();

      if (invoiceData?.data?.url) {
        setLoadingMsg("بيحولك لصفحة الدفع...");
        window.location.href = invoiceData.data.url;
      } else {
        throw new Error("مش قادر يعمل صفحة الدفع — حاول تاني");
      }

    } catch (err) {
      setError("حصل خطأ: " + err.message);
      setLoading(false);
    }
  };

  const sections = [
    { id: "basic", label: "الأساسيات", icon: "💖" },
    { id: "cards", label: "الكروت", icon: "🃏" },
    { id: "timeline", label: "الخط الزمني", icon: "📅" },
    { id: "reasons", label: "أسباب الحب", icon: "🥺" },
    { id: "media", label: "الصور والأغنية", icon: "🎵" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#1a0033 0%,#4b0082 50%,#2b004b 100%)", fontFamily: "'Cairo',sans-serif", color: "white", direction: "rtl", padding: "24px 16px 80px" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;800&display=swap" rel="stylesheet" />
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>💕</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, background: "linear-gradient(to right,#f9a8d4,#fda4af,#d8b4fe)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 4 }}>Couple Pages</h1>
          <p style={{ fontSize: 13, color: "#ccc" }}>اعمل صفحة لحبيبتك في دقيقتين</p>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 24, overflowX: "auto", paddingBottom: 4 }}>
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)} style={{ padding: "8px 16px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.15)", background: activeSection === s.id ? "linear-gradient(to right,#ec4899,#f43f5e)" : "rgba(255,255,255,0.05)", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo',sans-serif", whiteSpace: "nowrap", flexShrink: 0 }}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {activeSection === "basic" && (
          <div style={{ ...glass, padding: 24, marginBottom: 16 }}>
            <p style={sec}>المعلومات الأساسية</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div><label style={lbl}>اسم حبيبتك</label><input style={inp} value={loverName} onChange={e => setLoverName(e.target.value)} placeholder="مثلاً: ليلى، نور، سلمى..." /></div>
              <div><label style={lbl}>كلمة السر</label><input style={inp} value={password} onChange={e => setPassword(e.target.value)} placeholder="كلمة بينكم..." /><p style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>ابعتهالها كـ hint على واتساب</p></div>
              <div><label style={lbl}>تاريخ بداية العلاقة</label><input type="date" style={{ ...inp, colorScheme: "dark" }} value={relationDate} onChange={e => setRelationDate(e.target.value)} /></div>
              <div><label style={lbl}>رسالتك ليها 💌</label><textarea style={{ ...inp, minHeight: 120, resize: "vertical", lineHeight: 1.8 }} value={message} onChange={e => setMessage(e.target.value)} placeholder="اكتب كلامك من هنا..." /></div>
              <div><label style={lbl}>الرسالة السرية 🔒 <span style={{ fontSize: 11, color: "#aaa", fontWeight: 400 }}>اختياري</span></label><textarea style={{ ...inp, minHeight: 100, resize: "vertical", lineHeight: 1.8 }} value={secretMessage} onChange={e => setSecretMessage(e.target.value)} placeholder="رسالة مخفية..." /></div>
              <div><label style={lbl}>الجملة الختامية ❤️</label><input style={inp} value={closingLine} onChange={e => setClosingLine(e.target.value)} /></div>
            </div>
          </div>
        )}

        {activeSection === "cards" && (
          <div style={{ ...glass, padding: 24, marginBottom: 16 }}>
            <p style={sec}>الكروت القابلة للقلب 🃏</p>
            {cards.map((card, i) => (
              <div key={i} style={{ marginBottom: 16, background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: 16 }}>
                <p style={{ fontSize: 13, color: "#f9a8d4", fontWeight: 700, marginBottom: 10 }}>كارت {i + 1}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div><label style={{ ...lbl, fontSize: 12 }}>الوجه الأمامي</label><input style={inp} value={card.front} onChange={e => setCards(c => c.map((x, idx) => idx === i ? { ...x, front: e.target.value } : x))} /></div>
                  <div><label style={{ ...lbl, fontSize: 12 }}>الوجه الخلفي</label><input style={inp} value={card.back} onChange={e => setCards(c => c.map((x, idx) => idx === i ? { ...x, back: e.target.value } : x))} /></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSection === "timeline" && (
          <div style={{ ...glass, padding: 24, marginBottom: 16 }}>
            <p style={sec}>الخط الزمني 📸</p>
            {timeline.map((item, i) => (
              <div key={i} style={{ marginBottom: 20, background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: 16 }}>
                <p style={{ fontSize: 13, color: "#f9a8d4", fontWeight: 700, marginBottom: 10 }}>محطة {i + 1}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div><label style={{ ...lbl, fontSize: 12 }}>العنوان</label><input style={inp} value={item.title} onChange={e => setTimeline(t => t.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x))} /></div>
                  <div><label style={{ ...lbl, fontSize: 12 }}>التاريخ</label><input style={inp} value={item.date} onChange={e => setTimeline(t => t.map((x, idx) => idx === i ? { ...x, date: e.target.value } : x))} placeholder="مثلاً: 14 فبراير 2024" /></div>
                  <div><label style={{ ...lbl, fontSize: 12 }}>الوصف</label><textarea style={{ ...inp, minHeight: 80, resize: "vertical", lineHeight: 1.7 }} value={item.desc} onChange={e => setTimeline(t => t.map((x, idx) => idx === i ? { ...x, desc: e.target.value } : x))} /></div>
                </div>
              </div>
            ))}
            <button onClick={() => setTimeline(t => [...t, { title: "", date: "", desc: "" }])} style={{ ...inp, background: "rgba(236,72,153,0.2)", border: "1px dashed rgba(236,72,153,0.5)", cursor: "pointer", textAlign: "center", color: "#f9a8d4", fontWeight: 700 }}>+ أضف محطة جديدة</button>
          </div>
        )}

        {activeSection === "reasons" && (
          <div style={{ ...glass, padding: 24, marginBottom: 16 }}>
            <p style={sec}>أسباب الحب 🥺</p>
            {reasons.map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
                <input style={{ ...inp, flex: 1 }} value={r} onChange={e => setReasons(rs => rs.map((x, idx) => idx === i ? e.target.value : x))} placeholder={`سبب ${i + 1}...`} />
                <button onClick={() => setReasons(rs => rs.filter((_, idx) => idx !== i))} style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 8, padding: "8px 12px", color: "#fca5a5", cursor: "pointer", fontSize: 16 }}>×</button>
              </div>
            ))}
            <button onClick={() => setReasons(rs => [...rs, ""])} style={{ ...inp, background: "rgba(236,72,153,0.2)", border: "1px dashed rgba(236,72,153,0.5)", cursor: "pointer", textAlign: "center", color: "#f9a8d4", fontWeight: 700, marginTop: 4 }}>+ أضف سبب جديد</button>
          </div>
        )}

        {activeSection === "media" && (
          <div style={{ ...glass, padding: 24, marginBottom: 16 }}>
            <p style={sec}>الصور والأغنية 🎵</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <label style={lbl}>الصورة الشخصية</label>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div onClick={() => profileInputRef.current?.click()} style={{ width: 90, height: 90, borderRadius: "50%", border: "2px dashed rgba(236,72,153,0.5)", cursor: "pointer", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.2)" }}>
                    {previews[0] ? <img src={previews[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 28 }}>📷</span>}
                  </div>
                  <p style={{ fontSize: 13, color: "#ccc" }}>اضغط على الدايرة ترفع الصورة الشخصية</p>
                </div>
                <input ref={profileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleProfileImage} />
              </div>

              <div>
                <label style={lbl}>صور المعرض (لغاية 5 صور)</label>
                <div onClick={() => galleryInputRef.current?.click()} style={{ border: "2px dashed rgba(236,72,153,0.4)", borderRadius: 12, padding: 20, textAlign: "center", cursor: "pointer" }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>🖼️</div>
                  <p style={{ fontSize: 14, color: "#ccc" }}><span style={{ color: "#f9a8d4", fontWeight: 700 }}>اضغط ترفع</span> أو اسحب هنا</p>
                </div>
                <input ref={galleryInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleGalleryImages} />
                {previews.slice(1).some(Boolean) && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 10 }}>
                    {previews.slice(1).map((src, i) => src
                      ? <img key={i} src={src} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)" }} />
                      : <div key={i} style={{ width: "100%", aspectRatio: "1", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#666" }}>فاضية</div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label style={lbl}>الأغنية 🎵 <span style={{ fontSize: 11, color: "#aaa", fontWeight: 400 }}>اختياري</span></label>
                <input style={{ ...inp, marginBottom: 10 }} value={songUrl} onChange={e => setSongUrl(e.target.value)} placeholder="رابط YouTube أو SoundCloud أو MP3..." />
                <label style={lbl}>اسم الأغنية</label>
                <input style={inp} value={songTitle} onChange={e => setSongTitle(e.target.value)} placeholder="مثلاً: Thinking Out Loud - Ed Sheeran" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, color: "#fca5a5", fontSize: 14 }}>{error}</div>
        )}

        {/* زرار الدفع */}
        <button onClick={handlePayment} disabled={loading} style={{ width: "100%", padding: "18px 0", borderRadius: 16, border: "none", background: loading ? "rgba(236,72,153,0.4)" : "linear-gradient(to right,#ec4899,#f43f5e)", color: "white", fontSize: 18, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Cairo',sans-serif", marginBottom: 8, boxShadow: loading ? "none" : "0 4px 20px rgba(236,72,153,0.4)" }}>
          {loading ? `⏳ ${loadingMsg}` : "💳 ادفع وانشر صفحتك — 205 جنيه"}
        </button>
        <p style={{ textAlign: "center", fontSize: 12, color: "#aaa", marginBottom: 16 }}>بعد الدفع هيطلعلك رابط صفحتك فوراً ✨</p>

      </div>
      <style>{`input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.3)}input:focus,textarea:focus{border-color:rgba(236,72,153,0.6)!important}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#1a0033}::-webkit-scrollbar-thumb{background:#ff4da6;border-radius:4px}`}</style>
    </div>
  );
}