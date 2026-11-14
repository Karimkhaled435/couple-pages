import { useState, useEffect, useRef } from "react";
import { House, MessageCircleHeart, Images, Route, Mail } from "lucide-react";
import BottomNav from "./BottomNav";
import { useRevealOnScroll, useScrollSpy, scrollToId } from "./useScroll";
const SECTION_IDS = ["sec-home", "sec-reasons", "sec-gallery", "sec-timeline", "sec-message"];

const defaultReasons = [
  "عشان حنيتك اللي مفيش زيها في الدنيا.",
  "عشان ضحكتك بتنسيني كل همومي.",
  "عشان وقفتك جنبي في أصعب أوقاتي.",
  "عشان عيونك اللي بسرح فيهم.",
  "عشان تفاصيلك الصغيرة اللي محدش واخد باله منها غيري.",
  "عشان ببساطة.. أنتي روحي اللي بتنفس بيها.",
];

function parseImages(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(x => (typeof x === "string" ? x : ""));
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s || s === "{}") return [];
    if (s.startsWith("[")) {
      try { return JSON.parse(s).map(x => (typeof x === "string" ? x : "")); } catch { /* fall through */ }
    }
    if (s.startsWith("{")) {
      return s.replace(/^{|}$/g, "").split(/,(?=https?:\/\/)/).map(x => x.trim().replace(/^"|"$/g, "")).filter(Boolean);
    }
  }
  return [];
}

function parseJsonField(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw;
  try { const v = JSON.parse(raw); return Array.isArray(v) ? v : null; } catch { return null; }
}

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/\s]{11})/);
  return m ? m[1] : null;
}

function getSoundCloudEmbed(url) {
  if (!url || !url.includes("soundcloud.com")) return null;
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff4da6&auto_play=true&hide_related=true&show_comments=false&show_user=false`;
}

function useCountup(startDate) {
  const [t, setT] = useState({ years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    if (!startDate) return;
    const calc = () => {
      const diff = Date.now() - new Date(startDate).getTime();
      if (diff < 0) return;
      const s = Math.floor(diff / 1000);
      const d = Math.floor(diff / 86400000);
      setT({ years: Math.floor(d / 365), months: Math.floor((d % 365) / 30), days: Math.floor((d % 365) % 30), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [startDate]);
  return t;
}

export default function CouplePage({ slug }) {
  const [status, setStatus] = useState("loading");
  const [pageData, setPageData] = useState(null);
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [reason, setReason] = useState("اضغطي على الزرار عشان تعرفي...");
  const [showSecret, setShowSecret] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [flipped, setFlipped] = useState({});
  const [hearts, setHearts] = useState([]);
  const [cards, setCards] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [reasons, setReasons] = useState(defaultReasons);
  const audioRef = useRef(null);
  const time = useCountup(pageData?.relation_date || pageData?.created_at);
  useRevealOnScroll(status);
  const [activeSec, setActiveSec] = useScrollSpy(SECTION_IDS, status === "unlocked");
  const goSec = (id) => {
    setActiveSec(id);
    scrollToId(id);
  };

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const res = await fetch(`/api/page?slug=${encodeURIComponent(slug)}`);
        if (res.status === 404) { setStatus("notfound"); return; }
        if (!res.ok) throw new Error("server");
        const data = await res.json();
        setPageData({ lover_name: data.lover_name, images: [data.profile_image || ""] });
        setStatus("locked");
      } catch {
        setStatus("error");
      }
    };
    fetchPage();
  }, [slug]);

  useEffect(() => {
    if (status !== "unlocked") return;
    const symbols = ["❤️", "💖", "✨", "💕", "💗"];
    const interval = setInterval(() => {
      const id = Date.now() + Math.random();
      const h = { id, symbol: symbols[Math.floor(Math.random() * symbols.length)], left: Math.random() * 100, duration: Math.random() * 5 + 4, size: Math.random() * 1.5 + 0.5 };
      setHearts(prev => [...prev.slice(-20), h]);
      setTimeout(() => setHearts(prev => prev.filter(x => x.id !== id)), h.duration * 1000);
    }, 400);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    const songUrl = pageData?.song_url;
    if (status !== "unlocked" || !songUrl) return;
    if (getYouTubeId(songUrl) || getSoundCloudEmbed(songUrl)) return;
    audioRef.current = new Audio(songUrl);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;
    audioRef.current.play().catch(() => {});
    setIsMusicPlaying(true);
    return () => { audioRef.current?.pause(); audioRef.current = null; };
  }, [status, pageData?.song_url]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isMusicPlaying) { audioRef.current.pause(); setIsMusicPlaying(false); }
    else { audioRef.current.play().catch(() => {}); setIsMusicPlaying(true); }
  };

  const handleUnlock = async () => {
    if (unlocking || !password.trim()) return;
    setUnlocking(true);
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, password }),
      });
      if (res.status === 401) {
        setPwMsg("الباسورد غلط، حاولي تاني ❤️");
        setPwError(true); setTimeout(() => setPwError(false), 500);
        return;
      }
      if (!res.ok) throw new Error("server");
      const { page } = await res.json();
      const c = parseJsonField(page.cards); if (c) setCards(c);
      const t = parseJsonField(page.timeline); if (t) setTimeline(t);
      const r = parseJsonField(page.reasons); if (r && r.length) setReasons(r);
      setPageData(page);
      setStatus("unlocked");
    } catch {
      setPwMsg("في مشكلة في الاتصال، حاولي تاني بعد شوية");
      setPwError(true); setTimeout(() => setPwError(false), 500);
    } finally {
      setUnlocking(false);
    }
  };

  const generateReason = () => {
    const list = reasons.length > 0 ? reasons : defaultReasons;
    setReason(list[Math.floor(Math.random() * list.length)]);
  };

  const glass = { background: "rgba(255,255,255,0.05)", backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)", borderRadius: 24 };

  if (status === "loading") return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#1a0033,#4b0082,#2b004b)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 48, animation: "pulse 1.2s infinite" }}>💖</div>
      <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}}`}</style>
    </div>
  );

  if (status === "error") return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#1a0033,#4b0082,#2b004b)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "'Cairo',sans-serif", textAlign: "center", padding: 16 }}>
      <div>
        <p style={{ marginBottom: 16 }}>حصلت مشكلة في تحميل الصفحة 😕</p>
        <button onClick={() => window.location.reload()} style={{ padding: "10px 28px", borderRadius: 12, border: "none", background: "linear-gradient(to right,#ec4899,#f43f5e)", color: "white", fontWeight: 800, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>حاولي تاني</button>
      </div>
    </div>
  );

  if (status === "notfound") return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#1a0033,#4b0082,#2b004b)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "'Cairo',sans-serif" }}>
      <p>مفيش صفحة بالـ link ده 💔</p>
    </div>
  );

  const profileImg = parseImages(pageData?.images)[0] || null;

  if (status === "locked") return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#1a0033,#4b0082,#2b004b)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cairo',sans-serif", color: "white", padding: 16, position: "relative", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;800&display=swap" rel="stylesheet" />
      <div className="blob" style={{ width: 300, height: 300, background: "rgba(236,72,153,0.2)", top: -80, right: -80 }} />
      <div className="blob blob--b" style={{ width: 250, height: 250, background: "rgba(168,85,247,0.2)", bottom: -60, left: -60 }} />

      <div className="tab-enter" style={{ width: "100%", maxWidth: 380, textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto 24px" }}>
          <div style={{ position: "absolute", inset: -8, borderRadius: "50%", border: "2px dashed rgba(236,72,153,0.6)", animation: "spin 8s linear infinite" }} />
          <div style={{ position: "absolute", inset: -4, borderRadius: "50%", border: "2px solid rgba(236,72,153,0.3)", boxShadow: "0 0 30px rgba(255,77,166,0.4), inset 0 0 20px rgba(255,77,166,0.1)" }} />
          <div style={{ position: "absolute", top: -4, left: -4, fontSize: 18, animation: "float 3s ease-in-out infinite" }}>💖</div>
          <div style={{ position: "absolute", bottom: -4, right: -4, fontSize: 14, animation: "float 3s ease-in-out infinite 1.5s" }}>✨</div>
          <div style={{ width: 140, height: 140, borderRadius: "50%", overflow: "hidden", border: "3px solid rgba(255,255,255,0.2)", background: profileImg ? "transparent" : "linear-gradient(135deg,#ec4899,#a855f7)" }}>
            {profileImg
              ? <img src={profileImg} alt={pageData.lover_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>🥰</div>
            }
          </div>
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#ff4da6", marginBottom: 6 }}>لـ {pageData.lover_name} 💕</h2>
        <p style={{ fontSize: 14, color: "#ccc", marginBottom: 28 }}>في الصفحة دي حاجات كتير بتستنّاكي... اكتبي الباسورد ❤️</p>
        <div style={{ ...glass, padding: 24 }}>
          <input type="password" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleUnlock()}
            placeholder="اكتبي الباسورد..."
            style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: pwError ? "2px solid #f87171" : "none", textAlign: "center", fontSize: 18, outline: "none", background: pwError ? "#ffe4e4" : "rgba(255,255,255,0.9)", color: "#333", boxSizing: "border-box", animation: pwError ? "shake 0.4s" : "none", fontFamily: "'Cairo',sans-serif", marginBottom: 12 }}
          />
          {pwError && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{pwMsg}</p>}
          <button className="btn-shine btn-press" onClick={handleUnlock} disabled={unlocking} style={{ opacity: unlocking ? 0.7 : 1, width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: "linear-gradient(to right,#ec4899,#f43f5e)", color: "white", fontSize: 18, fontWeight: 800, cursor: "pointer", fontFamily: "'Cairo',sans-serif", boxShadow: "0 4px 20px rgba(236,72,153,0.4)" }}>
            {unlocking ? "..." : "افتحي ❤️"}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}`}</style>
    </div>
  );

  const images = parseImages(pageData.images);
  const profileImage = images[0] || null;
  const galleryImages = images.slice(1).filter(Boolean);
  const ytId = getYouTubeId(pageData.song_url);
  const scEmbed = getSoundCloudEmbed(pageData.song_url);
  const isDirectAudio = pageData.song_url && !ytId && !scEmbed;
  const closingLine = pageData.closing_line || "بحبك ولسه هحبك تاني، وهفضل أحبك يا أغلى حاجة في الدنيا ❤️";
  const songTitle = pageData.song_title || "أغنيتنا";
  const relationDateFormatted = pageData.relation_date
    ? new Date(pageData.relation_date).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
    : null;
  const cardGradients = ["linear-gradient(135deg,#ec4899,#f43f5e)", "linear-gradient(135deg,#a855f7,#6366f1)", "linear-gradient(135deg,#fb7185,#ef4444)"];
  const timeLabels = ["سنة", "شهر", "يوم", "ساعة", "دقيقة", "ثانية"];
  const timeValues = [time.years, time.months, time.days, time.hours, time.minutes, time.seconds];

  return (
    <div className="page-enter" style={{ minHeight: "100vh", background: "linear-gradient(135deg,#1a0033 0%,#4b0082 50%,#2b004b 100%)", fontFamily: "'Cairo',sans-serif", color: "white", overflowX: "hidden", direction: "rtl", paddingBottom: 130 }}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;800&display=swap" rel="stylesheet" />

      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        {hearts.map(h => (
          <div key={h.id} style={{ position: "absolute", bottom: 0, left: `${h.left}vw`, fontSize: 20, transform: `scale(${h.size})`, animation: `floatUp ${h.duration}s linear forwards` }}>{h.symbol}</div>
        ))}
      </div>

      {isDirectAudio && (
        <button onClick={toggleMusic} style={{ position: "fixed", bottom: 24, left: 24, zIndex: 50, ...glass, padding: 16, borderRadius: "50%", fontSize: 24, cursor: "pointer", color: "white" }}>
          {isMusicPlaying ? "🎵" : "🔇"}
        </button>
      )}

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "2.5rem 1rem", position: "relative", zIndex: 10 }}>

        <div id="sec-home" className="reveal reveal--zoom" style={{ textAlign: "center", marginBottom: 40 }}>
          {profileImage && (
            <img src={profileImage} alt={pageData.lover_name}
              style={{ width: 160, height: 160, borderRadius: "50%", objectFit: "cover", margin: "0 auto 16px", display: "block", border: "4px solid rgba(255,255,255,0.3)", animation: "pulseGlow 2s infinite alternate" }}
              onError={e => e.target.style.display = "none"}
            />
          )}
          <h1 className="grad-text" style={{ fontSize: "clamp(2.5rem,8vw,4rem)", fontWeight: 800, marginBottom: 16, lineHeight: 1.3 }}>
            {pageData.lover_name} ❤️
          </h1>
          {relationDateFormatted && (
            <div style={{ ...glass, display: "inline-block", padding: "8px 24px", borderRadius: 999 }}>
              <span style={{ fontSize: 16 }}>📅 {relationDateFormatted}</span>
            </div>
          )}
        </div>

        <div className="reveal" style={{ ...glass, padding: 24, marginBottom: 32 }}>
          <p style={{ fontSize: 20, fontWeight: 600, color: "#f9a8d4", marginBottom: 16, textAlign: "center" }}>بقالنا مع بعض:</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            {timeValues.map((v, i) => (
              <div key={i} style={{ background: "rgba(0,0,0,0.2)", padding: 12, borderRadius: 16, textAlign: "center" }}>
                <div key={v} className="tick" style={{ fontSize: 28, fontWeight: 800, color: "#f472b6" }}>{v ?? 0}</div>
                <div style={{ fontSize: 12, color: "#ccc" }}>{timeLabels[i]}</div>
              </div>
            ))}
          </div>
        </div>

        <div id="sec-reasons" className="reveal" style={{ ...glass, padding: 24, marginBottom: 32, textAlign: "center" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f9a8d4", marginBottom: 16 }}>ليه بحبك؟ 🥺</h2>
          <div style={{ background: "rgba(0,0,0,0.2)", padding: 16, borderRadius: 12, minHeight: 80, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <p style={{ fontSize: 17 }}>{reason}</p>
          </div>
          <button onClick={generateReason} style={{ background: "linear-gradient(to right,#ec4899,#f43f5e)", padding: "8px 24px", borderRadius: 999, border: "none", color: "white", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
            سر جديد ✨
          </button>
        </div>

        {cards.length > 0 && (
          <div className="reveal" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16, marginBottom: 32 }}>
            {cards.map((card, i) => (
              <div key={i} className="lift" onClick={() => setFlipped(f => ({ ...f, [i]: !f[i] }))}
                style={{ width: 112, height: 112, perspective: 1000, cursor: "pointer" }}>
                <div style={{ width: "100%", height: "100%", position: "relative", transformStyle: "preserve-3d", transition: "transform 0.6s cubic-bezier(0.4,0.2,0.2,1)", transform: flipped[i] ? "rotateY(180deg)" : "none" }}>
                  <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", background: "rgba(255,255,255,0.05)", backdropFilter: "blur(15px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, textAlign: "center", padding: 8 }}>{card.front}</div>
                  <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", background: card.gradient || cardGradients[i % 3], borderRadius: 16, transform: "rotateY(180deg)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, textAlign: "center", padding: 8 }}>{card.back}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="reveal" style={{ ...glass, padding: 24, marginBottom: 32, textAlign: "center" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f9a8d4", marginBottom: 8 }}>مقياس الحب 🌡️</h2>
          <p style={{ fontSize: 13, color: "#ccc", marginBottom: 16 }}>نسبة حبي ليكي النهارده وكل يوم</p>
          <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: 999, height: 32, overflow: "hidden" }}>
            <div className="meter-fill" style={{ background: "linear-gradient(to right,#ec4899,#f43f5e,#a855f7)", height: "100%", borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontWeight: 800, fontSize: 13 }}>1000% ∞ لا نهائي</span>
            </div>
          </div>
        </div>

        {/* Gallery — up to 5 images in responsive grid */}
        {galleryImages.length > 0 && (
          <div id="sec-gallery" className="reveal" style={{ ...glass, padding: 24, marginBottom: 32, textAlign: "center" }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f9a8d4", marginBottom: 24 }}>أحلى ذكرياتنا 🖼️</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
              {galleryImages.map((src, i) => (
                <div key={i} onClick={() => setLightbox(src)}
                  style={{
                    borderRadius: 12, overflow: "hidden", height: 160,
                    border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer",
                    // الصورة الأخيرة لو عددهم فردي تاخد عرض كامل
                    gridColumn: galleryImages.length % 2 !== 0 && i === galleryImages.length - 1 ? "span 2" : "auto"
                  }}>
                  <img src={src} alt={`صورة ${i + 1}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s" }}
                    onMouseEnter={e => e.target.style.transform = "scale(1.08)"}
                    onMouseLeave={e => e.target.style.transform = "scale(1)"}
                    onError={e => e.target.parentElement.style.display = "none"}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {timeline.length > 0 && (
          <div id="sec-timeline" className="reveal" style={{ ...glass, padding: 24, marginBottom: 32, textAlign: "right" }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f9a8d4", marginBottom: 32, textAlign: "center" }}>محطات في حبنا 📸</h2>
            <div style={{ borderRight: "2px solid rgba(255,77,166,0.5)", marginRight: 16 }}>
              {timeline.map((item, i) => (
                <div key={i} style={{ marginBottom: i < timeline.length - 1 ? 40 : 0, paddingRight: 32, position: "relative" }}>
                  <div style={{ position: "absolute", width: 16, height: 16, background: "#ec4899", borderRadius: "50%", top: 4, right: -9, boxShadow: "0 0 10px #ff4da6" }} />
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "#f9a8d4" }}>{item.title}</h3>
                  {item.date && <p style={{ fontSize: 13, color: "#999", marginTop: 4 }}>{item.date}</p>}
                  {item.desc && <p style={{ fontSize: 14, color: "#e5e7eb", marginTop: 12, background: "rgba(0,0,0,0.2)", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", lineHeight: 1.8 }}>{item.desc}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div id="sec-message" className="reveal" style={{ ...glass, padding: 24, marginBottom: 32, textAlign: "center" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f9a8d4", marginBottom: 16 }}>رسالتي ليكِ 💌</h2>
          <p style={{ fontSize: 17, lineHeight: 2, color: "#e5e7eb", whiteSpace: "pre-wrap" }}>{pageData.message}</p>
        </div>

        {ytId && (
          <>
            <iframe src={`https://www.youtube.com/embed/${ytId}?autoplay=1&loop=1&playlist=${ytId}&controls=0`} allow="autoplay; encrypted-media" style={{ width: 0, height: 0, border: "none", position: "absolute", opacity: 0 }} />
            <div style={{ ...glass, padding: 16, marginBottom: 32, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(135deg,#ec4899,#f43f5e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, animation: "pulse 2s infinite" }}>🎵</div>
              <div>
                <p style={{ fontWeight: 800, fontSize: 15, marginBottom: 2 }}>{songTitle}</p>
                <p style={{ fontSize: 12, color: "#ccc" }}>بتشتغل في الخلفية 🎶</p>
              </div>
            </div>
          </>
        )}

        {scEmbed && (
          <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 32 }}>
            <iframe width="100%" height="120" src={scEmbed} allow="autoplay" style={{ border: "none", display: "block" }} />
          </div>
        )}

        <button onClick={() => setShowSecret(!showSecret)} style={{ ...glass, padding: "16px 32px", borderRadius: 999, fontSize: 18, fontWeight: 800, cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)", color: "white", display: "block", width: "100%", fontFamily: "'Cairo',sans-serif", marginBottom: 16 }}>
          رسالتي الأخيرة ليكي 🔒
        </button>

        {showSecret && (
          <div className="tab-enter" style={{ ...glass, padding: 32, borderTop: "4px solid #ec4899", textAlign: "right" }}>
            {pageData.secret_message && (
              <p style={{ fontSize: 16, lineHeight: 2, color: "#e5e7eb", whiteSpace: "pre-wrap", marginBottom: 24 }}>{pageData.secret_message}</p>
            )}
            <p style={{ fontSize: 20, fontWeight: 800, color: "#f9a8d4", textAlign: "center" }}>{closingLine}</p>
          </div>
        )}

      </div>

      <BottomNav
        ariaLabel="أقسام الصفحة"
        active={activeSec}
        onChange={goSec}
        items={[
          { id: "sec-home", label: "الرئيسية", Icon: House },
          { id: "sec-reasons", label: "أسبابي", Icon: MessageCircleHeart },
          ...(galleryImages.length ? [{ id: "sec-gallery", label: "ذكرياتنا", Icon: Images }] : []),
          ...(timeline.length ? [{ id: "sec-timeline", label: "محطاتنا", Icon: Route }] : []),
          { id: "sec-message", label: "رسالتي", Icon: Mail },
        ]}
      />

      {lightbox && (
        <div className="fade-in" onClick={() => setLightbox(null)} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <button style={{ position: "absolute", top: 24, right: 24, fontSize: 40, color: "white", background: "none", border: "none", cursor: "pointer" }}>×</button>
          <img src={lightbox} className="zoom-in" alt="" style={{ maxWidth: "95%", maxHeight: "85vh", borderRadius: 16, objectFit: "contain" }} />
        </div>
      )}

      <style>{`
        @keyframes floatUp{0%{transform:translateY(0) scale(0.5) rotate(0deg);opacity:0}10%{opacity:0.6}90%{opacity:0.6}100%{transform:translateY(-100vh) scale(1.5) rotate(360deg);opacity:0}}
        @keyframes pulseGlow{0%{box-shadow:0 0 20px rgba(255,77,166,0.4)}100%{box-shadow:0 0 40px rgba(255,77,166,0.8),0 0 20px rgba(255,255,255,0.3)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.7}}
      `}</style>
    </div>
  );
}