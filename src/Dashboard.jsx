import { useState, useRef, useEffect, useMemo } from "react";
import StepProgress from "./StepProgress";
import { loadDraft, saveDraft, saveImages, loadImages, clearDraft } from "./draft";

const glass = { background: "linear-gradient(160deg, rgba(255,255,255,0.09), rgba(255,255,255,0.04))", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)", borderRadius: 20 };
const inp = { width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "white", fontSize: 15, fontFamily: "'Cairo',sans-serif", outline: "none", boxSizing: "border-box" };
const lbl = { display: "block", fontSize: 13, color: "#f9a8d4", marginBottom: 8, fontWeight: 600 };
const sec = { fontSize: 16, fontWeight: 800, color: "#f9a8d4", marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid rgba(255,77,166,0.3)" };

const FONT_LINK = "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;800&display=swap";

// بيصغّر الصورة ويحولها لـ JPEG عشان الرفع والحفظ على الجهاز يبقوا خفيفين
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

const STEPS = [
  { id: "basic", label: "الأساسيات", icon: "💖" },
  { id: "cards", label: "التذاكر", icon: "🎟️" },
  { id: "timeline", label: "الخط الزمني", icon: "📅" },
  { id: "reasons", label: "أسباب الحب", icon: "🥺" },
  { id: "media", label: "الصور والأغنية", icon: "🎵" },
];

const DEFAULTS = {
  loverName: "", password: "", relationDate: "", message: "", secretMessage: "",
  closingLine: "بحبك ولسه هحبك تاني، وهفضل أحبك يا أغلى حاجة في الدنيا ❤️",
  songUrl: "", songTitle: "",
  cards: [
    { front: "أول انطباع", back: "قمر وخاطفة للقلب" },
    { front: "أمنيتي", back: "نكمل عمرنا سوا" },
    { front: "وعدي ليكي", back: "هفضل سندك دايماً" },
  ],
  timeline: [
    { title: "يوم ما اتعرفنا", date: "", desc: "أحلى صدفة في حياتي، يوم ما دخلتي حياتي وغيرتيها." },
    { title: "أول مرة أقولك بحبك", date: "", desc: "كنت خايف ومكسوف، بس كانت طالعة من قلبي بجد." },
    { title: "البداية الرسمية", date: "", desc: "اليوم اللي وعدتك فيه قدام الدنيا كلها إنك بتاعتي." },
  ],
  reasons: [
    "عشان حنيتك اللي مفيش زيها في الدنيا.",
    "عشان ضحكتك بتنسيني كل همومي.",
    "عشان وقفتك جنبي في أصعب أوقاتي.",
    "عشان عيونك اللي بسرح فيهم.",
    "عشان تفاصيلك الصغيرة اللي محدش واخد باله منها غيري.",
    "عشان ببساطة.. أنتي روحي اللي بتنفس بيها.",
  ],
};

// بيرجّع المسودة المحفوظة (لو موجودة) بعد التأكد من شكل كل حقل
function readInitial() {
  const d = loadDraft();
  const f = d?.fields || {};
  const out = { ...DEFAULTS };
  for (const k of Object.keys(DEFAULTS)) {
    if (typeof DEFAULTS[k] === "string" && typeof f[k] === "string") out[k] = f[k];
    if (Array.isArray(DEFAULTS[k]) && Array.isArray(f[k])) out[k] = f[k];
  }
  const step = Number.isInteger(d?.step) ? Math.min(Math.max(d.step, 0), STEPS.length - 1) : 0;
  return { ...out, step, hadDraft: !!d };
}

const EMPTY_IMAGES = [null, null, null, null, null, null];
const NETWORK_MSG = "النت فاصل أو ضعيف — بياناتك محفوظة على جهازك ومش هتضيع. حاول تاني لما يرجع ✅";

export default function Dashboard() {
  const [init] = useState(readInitial);
  const [loverName, setLoverName] = useState(init.loverName);
  const [password, setPassword] = useState(init.password);
  const [relationDate, setRelationDate] = useState(init.relationDate);
  const [message, setMessage] = useState(init.message);
  const [secretMessage, setSecretMessage] = useState(init.secretMessage);
  const [closingLine, setClosingLine] = useState(init.closingLine);
  const [songUrl, setSongUrl] = useState(init.songUrl);
  const [songTitle, setSongTitle] = useState(init.songTitle);
  const [cards, setCards] = useState(init.cards);
  const [timeline, setTimeline] = useState(init.timeline);
  const [reasons, setReasons] = useState(init.reasons);
  const [images, setImages] = useState(EMPTY_IMAGES);
  const [step, setStep] = useState(init.step);
  const [dir, setDir] = useState("next");

  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [createdUrl, setCreatedUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [saveState, setSaveState] = useState("idle");
  const [restored, setRestored] = useState(init.hadDraft);
  const [imagesReady, setImagesReady] = useState(false);

  const profileInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const skipSave = useRef(false);
  const latest = useRef(null);

  // ---------- الحفظ التلقائي ----------
  const fields = useMemo(() => ({ loverName, password, relationDate, message, secretMessage, closingLine, songUrl, songTitle, cards, timeline, reasons }),
    [loverName, password, relationDate, message, secretMessage, closingLine, songUrl, songTitle, cards, timeline, reasons]);
  const initialJson = useRef(JSON.stringify({ f: Object.fromEntries(Object.keys(fields).map(k => [k, init[k]])), s: init.step }));

  useEffect(() => { latest.current = { fields, step }; }, [fields, step]);

  useEffect(() => {
    const changed = JSON.stringify({ f: fields, s: step }) !== initialJson.current;
    if (!changed) return;
    const t = setTimeout(() => {
      if (skipSave.current) return;
      setSaveState(saveDraft({ fields, step }) ? "saved" : "failed");
    }, 350);
    return () => clearTimeout(t);
  }, [fields, step]);

  // لو المستخدم قفل التاب أو غيّر التطبيق: احفظ فوراً
  useEffect(() => {
    const flush = () => { if (!skipSave.current && latest.current) saveDraft(latest.current); };
    const onVis = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVis);
    return () => { window.removeEventListener("pagehide", flush); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  // استرجاع الصور المحفوظة
  useEffect(() => {
    let alive = true;
    loadImages().then((arr) => {
      if (!alive) return;
      if (arr && arr.some(Boolean)) {
        setImages([...arr, ...EMPTY_IMAGES].slice(0, 6));
        setRestored(true);
      }
      setImagesReady(true);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!imagesReady) return;
    const t = setTimeout(() => { if (!skipSave.current) saveImages(images); }, 500);
    return () => clearTimeout(t);
  }, [images, imagesReady]);

  // حالة الإنترنت
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  const startOver = async () => {
    if (!window.confirm("متأكد؟ كل اللي كتبته هيتمسح.")) return;
    skipSave.current = true;
    await clearDraft();
    window.location.reload();
  };

  // ---------- الصور ----------
  const setImageAt = (i, v) => setImages(prev => prev.map((x, idx) => (idx === i ? v : x)));

  const handleProfileImage = async (e) => {
    const file = e.target.files[0]; e.target.value = "";
    if (!file) return;
    setError(null);
    try { setImageAt(0, await compressImage(file)); } catch (err) { setError(err.message); }
  };

  const addGalleryFiles = async (list) => {
    const files = Array.from(list).filter(f => f.type.startsWith("image/"));
    if (!files.length) return;
    setError(null);
    try {
      const done = [];
      for (const f of files.slice(0, 5)) done.push(await compressImage(f));
      const next = [...images];
      let dropped = files.length > 5 ? 1 : 0;
      for (const d of done) {
        const free = next.findIndex((x, i) => i > 0 && !x);
        if (free === -1) { dropped++; continue; }
        next[free] = d;
      }
      setImages(next);
      if (dropped) setError("المعرض بياخد لحد 5 صور بس");
    } catch (err) { setError(err.message); }
  };

  // ---------- التنقل بين الخطوات ----------
  const go = (to) => {
    setDir(to > step ? "next" : "prev");
    setStep(to);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const next = () => {
    if (step === 0 && (!loverName.trim() || !password.trim() || !message.trim())) {
      setError("اكتب الاسم وكلمة السر والرسالة الأول عشان تكمل 💌");
      setShakeKey(k => k + 1);
      return;
    }
    go(Math.min(step + 1, STEPS.length - 1));
  };

  // ---------- الإنشاء ----------
  const handleCreate = async () => {
    setError(null);
    if (!loverName.trim() || !password.trim() || !message.trim()) {
      setError("اكتب الاسم وكلمة السر والرسالة الأول");
      setShakeKey(k => k + 1);
      go(0);
      return;
    }
    if (!navigator.onLine) { setError(NETWORK_MSG); return; }

    setLoading(true);
    setLoadingMsg("بيعمل صفحتك...");
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 90000);
      let res;
      try {
        res = await fetch("/api/create-page", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ctrl.signal,
          body: JSON.stringify({
            lover_name: loverName.trim(),
            password: password.trim(),
            message: message.trim(),
            song_url: songUrl.trim(),
            images,
            secret_message: secretMessage.trim(),
            cards,
            timeline,
            reasons: reasons.map(r => r.trim()).filter(Boolean),
            relation_date: relationDate,
            song_title: songTitle.trim(),
            closing_line: closingLine.trim(),
          }),
        });
      } catch {
        throw Object.assign(new Error(NETWORK_MSG), { network: true });
      } finally { clearTimeout(timeout); }

      let data = null;
      try { data = await res.json(); } catch { /* non-JSON response */ }
      if (!res.ok || !data?.slug) {
        const base = data?.error || (res.status === 413 ? "الصور كبيرة قوي، جرب صور أصغر" : "مش قادر يعمل الصفحة — حاول تاني");
        throw new Error(base + (data?.hint ? ` — ${data.hint}` : "") + (data?.detail ? ` [${data.detail}]` : ""));
      }

      skipSave.current = true;
      clearDraft();
      setCreatedUrl(`${window.location.origin}/for/${data.slug}`);
      setLoading(false);
    } catch (err) {
      setError(err.network ? err.message : "حصل خطأ: " + err.message);
      setLoading(false);
    }
  };

  // ---------- شاشة النجاح ----------
  if (createdUrl) {
    const copy = async () => {
      try { await navigator.clipboard.writeText(createdUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { window.prompt("انسخ الرابط:", createdUrl); }
    };
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cairo',sans-serif", color: "white", padding: 16, direction: "rtl" }}>
        <link href={FONT_LINK} rel="stylesheet" />
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
          <button className="btn-press" onClick={() => { window.location.href = createdUrl; }} style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif", marginBottom: 12 }}>
            👀 شوف الصفحة
          </button>
          <button onClick={() => { window.location.href = "/"; }} style={{ background: "none", border: "none", color: "#ccc", fontSize: 13, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
            اعمل صفحة تانية
          </button>
        </div>
      </div>
    );
  }

  const isLast = step === STEPS.length - 1;
  const stepClass = dir === "next" ? "step-next" : "step-prev";
  const navBtn = { padding: "16px 0", borderRadius: 16, fontSize: 17, fontWeight: 800, cursor: "pointer", fontFamily: "'Cairo',sans-serif" };

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Cairo',sans-serif", color: "white", direction: "rtl", padding: "24px 16px 60px", position: "relative", overflowX: "clip" }}>
      <link href={FONT_LINK} rel="stylesheet" />
      <div className="blob" style={{ width: 360, height: 360, background: "radial-gradient(circle, rgba(236,72,153,0.32), transparent 70%)", top: -120, right: -120 }} />
      <div className="blob blob--b" style={{ width: 320, height: 320, background: "radial-gradient(circle, rgba(168,85,247,0.32), transparent 70%)", bottom: -100, left: -100 }} />
      <div style={{ maxWidth: 680, margin: "0 auto", position: "relative", zIndex: 1 }}>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div className="heartbeat" style={{ fontSize: 40, marginBottom: 8 }}>💕</div>
          <h1 className="grad-text" style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Couple Pages</h1>
          <p style={{ fontSize: 13, color: "#ccc" }}>اعمل صفحة لحبيبتك في دقيقتين</p>
        </div>

        {!online && (
          <div className="banner banner--off" role="status">
            <span>📡 انت أوفلاين دلوقتي — كمّل عادي، كل اللي بتكتبه محفوظ على جهازك ومش هيضيع.</span>
          </div>
        )}
        {restored && (
          <div className="banner banner--ok" role="status">
            <span>✨ رجّعنا لك اللي كنت كاتبه — مفيش حاجة ضاعت.</span>
            <button type="button" onClick={startOver}>ابدأ من جديد</button>
          </div>
        )}

        <StepProgress steps={STEPS} current={step} />
        <div className="saved" aria-live="polite">
          {saveState === "saved" && <b key="s">✓ اتحفظ تلقائياً على جهازك</b>}
          {saveState === "failed" && <span style={{ color: "#fca5a5" }}>⚠️ مش قادر يحفظ على الجهاز (ممكن التصفح الخاص)</span>}
        </div>

        <div key={step} className={stepClass}>
          {step === 0 && (
            <div key={shakeKey} className={shakeKey ? "shake" : undefined} style={{ ...glass, padding: 24, marginBottom: 16 }}>
              <p style={sec}>المعلومات الأساسية</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div><label style={lbl}>اسم حبيبتك</label><input style={inp} value={loverName} onChange={e => setLoverName(e.target.value)} placeholder="مثلاً: ليلى، نور، سلمى..." /></div>
                <div><label style={lbl}>كلمة السر</label><input style={inp} value={password} onChange={e => setPassword(e.target.value)} placeholder="كلمة بينكم..." /><p style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>ابعتهالها كـ hint على واتساب</p></div>
                <div><label style={lbl}>تاريخ بداية العلاقة</label><input type="date" style={{ ...inp, colorScheme: "dark" }} value={relationDate} onChange={e => setRelationDate(e.target.value)} /></div>
                <div><label style={lbl}>رسالتك ليها 💌</label><textarea style={{ ...inp, minHeight: 120, resize: "vertical", lineHeight: 1.8 }} value={message} onChange={e => setMessage(e.target.value)} placeholder="اكتب كلامك من هنا..." /></div>
                <div><label style={lbl}>الرسالة السرية 🔒 <span style={{ fontSize: 11, color: "#aaa", fontWeight: 400 }}>اختياري</span></label><textarea style={{ ...inp, minHeight: 100, resize: "vertical", lineHeight: 1.8 }} value={secretMessage} onChange={e => setSecretMessage(e.target.value)} placeholder="رسالة بتظهر لما تدوس على زرار الرسالة الأخيرة..." /></div>
                <div><label style={lbl}>الجملة الختامية ❤️</label><input style={inp} value={closingLine} onChange={e => setClosingLine(e.target.value)} /></div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div style={{ ...glass, padding: 24, marginBottom: 16 }}>
              <p style={sec}>التذاكر 🎟️ <span style={{ fontSize: 12, color: "#c4b5d6", fontWeight: 400 }}>(بتميل وبتتقلب لما تضغطي عليها)</span></p>
              {cards.map((card, i) => (
                <div key={i} style={{ marginBottom: 16, background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: 16 }}>
                  <p style={{ fontSize: 13, color: "#f9a8d4", fontWeight: 700, marginBottom: 10 }}>تذكرة {i + 1}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div><label style={{ ...lbl, fontSize: 12 }}>الوجه الأمامي</label><input style={inp} value={card.front} onChange={e => setCards(c => c.map((x, idx) => idx === i ? { ...x, front: e.target.value } : x))} /></div>
                    <div><label style={{ ...lbl, fontSize: 12 }}>الوجه الخلفي</label><input style={inp} value={card.back} onChange={e => setCards(c => c.map((x, idx) => idx === i ? { ...x, back: e.target.value } : x))} /></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
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
              <button className="btn-press" onClick={() => setTimeline(t => [...t, { title: "", date: "", desc: "" }])} style={{ ...inp, background: "rgba(236,72,153,0.2)", border: "1px dashed rgba(236,72,153,0.5)", cursor: "pointer", textAlign: "center", color: "#f9a8d4", fontWeight: 700 }}>+ أضف محطة</button>
            </div>
          )}

          {step === 3 && (
            <div style={{ ...glass, padding: 24, marginBottom: 16 }}>
              <p style={sec}>أسباب الحب 🥺</p>
              {reasons.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
                  <input style={{ ...inp, flex: 1 }} value={r} onChange={e => setReasons(rs => rs.map((x, idx) => idx === i ? e.target.value : x))} placeholder={`سبب ${i + 1}...`} />
                  <button className="btn-press" aria-label="حذف السبب" onClick={() => setReasons(rs => rs.filter((_, idx) => idx !== i))} style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 8, padding: "8px 12px", color: "#fca5a5", cursor: "pointer", fontSize: 14 }}>✕</button>
                </div>
              ))}
              <button className="btn-press" onClick={() => setReasons(rs => [...rs, ""])} style={{ ...inp, background: "rgba(236,72,153,0.2)", border: "1px dashed rgba(236,72,153,0.5)", cursor: "pointer", textAlign: "center", color: "#f9a8d4", fontWeight: 700, marginTop: 4 }}>+ أضف سبب</button>
            </div>
          )}

          {step === 4 && (
            <div style={{ ...glass, padding: 24, marginBottom: 16 }}>
              <p style={sec}>الصور والأغنية 🎵</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div>
                  <label style={lbl}>الصورة الشخصية</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div className="thumb" style={{ flexShrink: 0 }}>
                      <div onClick={() => profileInputRef.current?.click()} style={{ width: 90, height: 90, borderRadius: "50%", border: "2px dashed rgba(236,72,153,0.5)", cursor: "pointer", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)" }}>
                        {images[0] ? <img src={images[0]} alt="الصورة الشخصية" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 28 }}>📷</span>}
                      </div>
                      {images[0] && <button type="button" aria-label="حذف الصورة الشخصية" onClick={() => setImageAt(0, null)}>×</button>}
                    </div>
                    <p style={{ fontSize: 13, color: "#ccc" }}>اضغط على الدايرة ترفع الصورة الشخصية</p>
                  </div>
                  <input ref={profileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleProfileImage} />
                </div>

                <div>
                  <label style={lbl}>صور المعرض (لغاية 5 صور)</label>
                  <div onClick={() => galleryInputRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); addGalleryFiles(e.dataTransfer.files); }} style={{ border: "2px dashed rgba(236,72,153,0.4)", borderRadius: 12, padding: "24px 16px", textAlign: "center", cursor: "pointer", background: "rgba(255,255,255,0.03)" }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>🖼️</div>
                    <p style={{ fontSize: 14, color: "#ccc" }}><span style={{ color: "#f9a8d4", fontWeight: 700 }}>اضغط ترفع</span> أو اسحب هنا</p>
                  </div>
                  <input ref={galleryInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => { addGalleryFiles(e.target.files); e.target.value = ""; }} />
                  {images.slice(1).some(Boolean) && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 10 }}>
                      {images.slice(1).map((src, i) => src
                        ? <div key={i} className="thumb"><img src={src} alt={`صورة ${i + 1}`} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", display: "block" }} /><button type="button" aria-label="حذف الصورة" onClick={() => setImageAt(i + 1, null)}>×</button></div>
                        : <div key={i} style={{ width: "100%", aspectRatio: "1", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#777" }}>فاضية</div>
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
        </div>

        {error && (
          <div role="alert" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, color: "#fca5a5", fontSize: 14, lineHeight: 1.7 }}>{error}</div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          {step > 0 && (
            <button className="btn-press" onClick={() => go(step - 1)} disabled={loading} style={{ ...navBtn, flex: "0 0 32%", border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.08)", color: "white" }}>→ رجوع</button>
          )}
          {!isLast ? (
            <button className="btn-shine btn-press" onClick={next} style={{ ...navBtn, flex: 1, border: "none", background: "linear-gradient(to right,#ec4899,#f43f5e)", color: "white", boxShadow: "0 8px 24px rgba(236,72,153,0.4)" }}>التالي ←</button>
          ) : (
            <button className="btn-shine btn-press" onClick={handleCreate} disabled={loading} style={{ ...navBtn, flex: 1, border: "none", background: loading ? "rgba(236,72,153,0.4)" : "linear-gradient(to right,#ec4899,#f43f5e)", color: "white", boxShadow: "0 8px 24px rgba(236,72,153,0.4)", cursor: loading ? "wait" : "pointer" }}>
              {loading ? `⏳ ${loadingMsg}` : "💖 اعمل صفحتك مجاناً"}
            </button>
          )}
        </div>
        {isLast && <p style={{ textAlign: "center", fontSize: 12, color: "#aaa", margin: "12px 0 0" }}>هيطلعلك رابط صفحتك فوراً ✨</p>}
      </div>
      <style>{`input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.3)}input:focus,textarea:focus{border-color:rgba(236,72,153,0.6)!important}`}</style>
    </div>
  );
}
