import { useState, useRef } from "react";
import { Heart, Layers, Clock, MessageCircleHeart, Image as ImageIcon } from "lucide-react";
import BottomNav from "./BottomNav";
const glass = { background: "rgba(255,255,255,0.05)", backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)", borderRadius: 20 };
const inp = { width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "white", fontSize: 15, fontFamily: "'Cairo',sans-serif", outline: "none", boxSizing: "border-box" };
const lbl = { display: "block", fontSize: 13, color: "#f9a8d4", marginBottom: 8, fontWeight: 600 };
const sec = { fontSize: 16, fontWeight: 800, color: "#f9a8d4", marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid rgba(255,77,166,0.3)" };

// بيصغّر الصورة ويحولها لـ JPEG عشان الرفع يبقى سريع وما يحصلش timeout
async function compressImage(file, maxSize = 1400, quality = 0.78) {
  let bmp;
  try { bmp = await createImageBitmap(file); }
  catch { throw new Error("إحدى الصور مش مدعومة، جرب صورة JPG أو PNG"); }
  const scale = Math.min(1, maxSize / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bmp.width * scale));
  canvas.height = Math.max(1, Math.round(bmp.height * scale));
  canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close?.();
  return canvas.toDataURL("image/jpeg", quality);
}

function Confetti() {
  const [pieces] = useState(() => Array.from({ length: 30 }, (_, i) => ({
    id: i, s: ["❤️", "💖", "✨", "💕", "💗"][i % 5],
    x: Math.round((Math.random() - 0.5) * 360), y: -Math.round(Math.random() * 280 + 60),
    r: Math.round(Math.random() * 720 - 360), dl: (Math.random() * 0.35).toFixed(2),
  })));
  return (
    <div className="confetti-wrap" aria-hidden="true">
      {pieces.map(p => <span key={p.id} className="confetti" style={{ "--x": `${p.x}px`, "--y": `${p.y}px`, "--r": `${p.r}deg`, "--dl": `${p.dl}s` }}>{p.s}</span>)}
    </div>
  );
}

const NAV_ITEMS = [
  { id: "basic", label: "الأساسيات", Icon: Heart },
  { id: "cards", label: "الكروت", Icon: Layers },
  { id: "timeline", label: "الزمن", Icon: Clock },
  { id: "reasons", label: "الأسباب", Icon: MessageCircleHeart },
  { id: "media", label: "الصور", Icon: ImageIcon },
];

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
  const [createdUrl, setCreatedUrl] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleProfileImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const newImages = [...images]; newImages[0] = file;
    const newPreviews = [...previews]; newPreviews[0] = URL.createObjectURL(file);
    setImages(newImages); setPreviews(newPreviews);
  };

  const addGalleryFiles = (list) => {
    const files = Array.from(list).filter(f => f.type.startsWith("image/")).slice(0, 5);
    const newImages = [...images]; const newPreviews = [...previews];
    files.forEach((file, i) => { newImages[i + 1] = file; newPreviews[i + 1] = URL.createObjectURL(file); });
    setImages(newImages); setPreviews(newPreviews);
  };
  const handleGalleryImages = (e) => { addGalleryFiles(e.target.files); e.target.value = ""; };

  const goSection = (id) => {
    setActiveSection(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCreate = async () => {
    setError(null);
    if (!loverName.trim() || !password.trim() || !message.trim()) {
      setError("اكتب الاسم وكلمة السر والرسالة الأول");
      return;
    }

    setLoading(true);
    try {
      setLoadingMsg("بيجهز الصور...");
      const imageData = [];
      for (const file of images) imageData.push(file ? await compressImage(file) : null);

      setLoadingMsg("بيعمل صفحتك...");
      const res = await fetch("/api/create-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lover_name: loverName.trim(),
          password: password.trim(),
          message: message.trim(),
          song_url: songUrl.trim(),
          images: imageData,
          secret_message: secretMessage.trim(),
          cards,
          timeline,
          reasons: reasons.map(r => r.trim()).filter(Boolean),
          relation_date: relationDate,
          song_title: songTitle.trim(),
          closing_line: closingLine.trim(),
        }),
      });

      let data = null;
      try { data = await res.json(); } catch { /* non-JSON response */ }
      if (!res.ok || !data?.slug) {
        throw new Error(data?.error || (res.status === 413 ? "الصور كبيرة قوي، جرب صور أصغر" : "مش قادر يعمل الصفحة — حاول تاني"));
      }

      setCreatedUrl(`${window.location.origin}/for/${data.slug}`);
      setLoading(false);
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

  if (createdUrl) {
    const copy = async () => {
      try { await navigator.clipboard.writeText(createdUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { window.prompt("انسخ الرابط:", createdUrl); }
    };
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#1a0033,#4b0082,#2b004b)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cairo',sans-serif", color: "white", padding: 16, direction: "rtl" }}>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;800&display=swap" rel="stylesheet" />
        <Confetti />
        <div className="tab-enter" style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
          <div className="heartbeat" style={{ fontSize: 64, marginBottom: 24 }}>🎉</div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#f9a8d4", marginBottom: 8 }}>صفحتك جاهزة!</h2>
          <p style={{ color: "#ccc", fontSize: 14, marginBottom: 32 }}>ابعت الرابط لحبيبتك وسيبها تكتشف ❤️</p>
          <div style={{ ...glass, padding: 20, marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: "#f9a8d4", marginBottom: 8 }}>رابط صفحتك</p>
            <p dir="ltr" style={{ fontSize: 13, fontWeight: 700, wordBreak: "break-all", marginBottom: 16 }}>{createdUrl}</p>
            <button className="btn-press" onClick={copy} style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "none", background: copied ? "rgba(34,197,94,0.3)" : "linear-gradient(to right,#ec4899,#f43f5e)", color: "white", fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
              {copied ? "✓ تم النسخ!" : "📋 انسخ الرابط"}
            </button>
          </div>
          <button onClick={() => { window.location.href = createdUrl; }} style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif", marginBottom: 12 }}>
            👀 شوف الصفحة
          </button>
          <button onClick={() => { window.location.href = "/"; }} style={{ background: "none", border: "none", color: "#ccc", fontSize: 13, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
            اعمل صفحة تانية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#1a0033 0%,#4b0082 50%,#2b004b 100%)", fontFamily: "'Cairo',sans-serif", color: "white", direction: "rtl", padding: "24px 16px 130px" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;800&display=swap" rel="stylesheet" />
      <div className="blob" style={{ width: 320, height: 320, background: "rgba(236,72,153,0.22)", top: -90, right: -90 }} />
      <div className="blob blob--b" style={{ width: 280, height: 280, background: "rgba(168,85,247,0.22)", bottom: -70, left: -70 }} />
      <div style={{ maxWidth: 680, margin: "0 auto", position: "relative", zIndex: 1 }}>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div className="heartbeat" style={{ fontSize: 40, marginBottom: 8 }}>💕</div>
          <h1 className="grad-text" style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Couple Pages</h1>
          <p style={{ fontSize: 13, color: "#ccc" }}>اعمل صفحة لحبيبتك في دقيقتين</p>
        </div>

        <div className="top-tabs" style={{ display: "flex", gap: 8, marginBottom: 24, overflowX: "auto", paddingBottom: 4 }}>
          {sections.map(s => (
            <button key={s.id} className="btn-press" onClick={() => setActiveSection(s.id)} style={{ padding: "8px 16px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.15)", background: activeSection === s.id ? "linear-gradient(to right,#ec4899,#f43f5e)" : "rgba(255,255,255,0.05)", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo',sans-serif", whiteSpace: "nowrap", flexShrink: 0 }}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {activeSection === "basic" && (
          <div className="tab-enter" style={{ ...glass, padding: 24, marginBottom: 16 }}>
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
          <div className="tab-enter" style={{ ...glass, padding: 24, marginBottom: 16 }}>
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
          <div className="tab-enter" style={{ ...glass, padding: 24, marginBottom: 16 }}>
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
          <div className="tab-enter" style={{ ...glass, padding: 24, marginBottom: 16 }}>
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
          <div className="tab-enter" style={{ ...glass, padding: 24, marginBottom: 16 }}>
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
                <div onClick={() => galleryInputRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); addGalleryFiles(e.dataTransfer.files); }} style={{ border: "2px dashed rgba(236,72,153,0.4)", borderRadius: 12, padding: 20, textAlign: "center", cursor: "pointer" }}>
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

        <button className="btn-shine btn-press" onClick={handleCreate} disabled={loading} style={{ width: "100%", padding: "18px 0", borderRadius: 16, border: "none", background: loading ? "rgba(236,72,153,0.4)" : "linear-gradient(to right,#ec4899,#f43f5e)", color: "white", fontSize: 18, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Cairo',sans-serif", marginBottom: 8, boxShadow: loading ? "none" : "0 4px 20px rgba(236,72,153,0.4)" }}>
          {loading ? `⏳ ${loadingMsg}` : "💖 اعمل صفحتك مجاناً"}
        </button>
        <p style={{ textAlign: "center", fontSize: 12, color: "#aaa", marginBottom: 16 }}>هيطلعلك رابط صفحتك فوراً ✨</p>

      </div>
      <BottomNav items={NAV_ITEMS} active={activeSection} onChange={goSection} ariaLabel="أقسام الصفحة" />
      <style>{`input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.3)}input:focus,textarea:focus{border-color:rgba(236,72,153,0.6)!important}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#1a0033}::-webkit-scrollbar-thumb{background:#ff4da6;border-radius:4px}`}</style>
    </div>
  );
}