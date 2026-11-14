import { useCallback, useEffect, useRef, useState } from "react";
import { X, Plus, Minus, ChevronLeft, ChevronRight } from "lucide-react";

const MAX = 5;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// عارض صور بتكبير: ضغطتين = تكبير/تصغير، قرصة بصباعين، عجلة الماوس، سحب للتحريك بعد التكبير، أسهم ولوحة مفاتيح.
export default function ZoomViewer({ images, index, onClose }) {
  const [i, setI] = useState(index);
  const [zoomed, setZoomed] = useState(false);
  const stage = useRef(null);
  const img = useRef(null);
  const st = useRef({ s: 1, x: 0, y: 0 });
  const ptrs = useRef(new Map());
  const gesture = useRef(null);
  const lastTap = useRef({ t: 0, x: 0, y: 0 });

  const paint = useCallback((animate) => {
    const el = img.current; if (!el) return;
    const { s, x, y } = st.current;
    el.style.transition = animate ? "transform .38s cubic-bezier(.34,1.3,.64,1)" : "none";
    el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`;
    setZoomed((z) => (z === s > 1.01 ? z : s > 1.01));
  }, []);

  const limit = useCallback(() => {
    const el = img.current; const { s } = st.current;
    const mx = Math.max(0, (el.offsetWidth * s - stage.current.clientWidth) / 2);
    const my = Math.max(0, (el.offsetHeight * s - stage.current.clientHeight) / 2);
    st.current.x = clamp(st.current.x, -mx, mx);
    st.current.y = clamp(st.current.y, -my, my);
  }, []);

  const reset = useCallback((animate = true) => { st.current = { s: 1, x: 0, y: 0 }; paint(animate); }, [paint]);

  const zoomAt = useCallback((target, cx, cy, animate = true) => {
    const el = img.current; const r = el.getBoundingClientRect();
    const old = st.current.s; const s = clamp(target, 1, MAX);
    if (s === 1) return reset(animate);
    // بنثبّت النقطة اللي ضغطنا عليها تحت الصباع
    const ox = r.left + r.width / 2, oy = r.top + r.height / 2;
    const k = s / old;
    st.current.x += (cx - ox) * (1 - k);
    st.current.y += (cy - oy) * (1 - k);
    st.current.s = s; limit(); paint(animate);
  }, [limit, paint, reset]);

  const go = useCallback((d) => { setI((v) => (v + d + images.length) % images.length); reset(false); }, [images.length, reset]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") go(1);
      else if (e.key === "ArrowRight") go(-1);
      else if (e.key === "+" || e.key === "=") { const r = stage.current.getBoundingClientRect(); zoomAt(st.current.s * 1.5, r.left + r.width / 2, r.top + r.height / 2); }
      else if (e.key === "-") { const r = stage.current.getBoundingClientRect(); zoomAt(st.current.s / 1.5, r.left + r.width / 2, r.top + r.height / 2); }
    };
    window.addEventListener("keydown", key);
    const el = stage.current;
    const wheel = (e) => { e.preventDefault(); zoomAt(st.current.s * Math.exp(-e.deltaY * 0.0018), e.clientX, e.clientY, false); };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", key); el.removeEventListener("wheel", wheel); };
  }, [go, onClose, zoomAt]);

  const down = (e) => {
    stage.current.setPointerCapture?.(e.pointerId);
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.current.size === 2) {
      const [a, b] = [...ptrs.current.values()];
      gesture.current = { type: "pinch", d0: Math.hypot(a.x - b.x, a.y - b.y), s0: st.current.s };
    } else {
      gesture.current = { type: "pan", x0: e.clientX, y0: e.clientY, tx: st.current.x, ty: st.current.y, moved: false, t0: performance.now() };
    }
  };
  const move = (e) => {
    if (!ptrs.current.has(e.pointerId)) return;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current; if (!g) return;
    if (g.type === "pinch" && ptrs.current.size >= 2) {
      const [a, b] = [...ptrs.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      zoomAt(g.s0 * (d / g.d0), (a.x + b.x) / 2, (a.y + b.y) / 2, false);
    } else if (g.type === "pan") {
      const dx = e.clientX - g.x0, dy = e.clientY - g.y0;
      if (Math.hypot(dx, dy) > 6) g.moved = true;
      if (st.current.s > 1.01) { st.current.x = g.tx + dx; st.current.y = g.ty + dy; limit(); paint(false); }
    }
  };
  const up = (e) => {
    const g = gesture.current;
    ptrs.current.delete(e.pointerId);
    if (ptrs.current.size > 0) { gesture.current = null; return; }
    gesture.current = null;
    if (!g || g.type !== "pan" || g.moved) { if (st.current.s < 1.05) reset(true); return; }
    // ضغطة بدون حركة: لو مرتين بسرعة = تكبير/تصغير، ولو على الخلفية = إغلاق
    const now = performance.now(); const lt = lastTap.current;
    if (now - lt.t < 320 && Math.hypot(e.clientX - lt.x, e.clientY - lt.y) < 30) {
      lastTap.current = { t: 0, x: 0, y: 0 };
      if (st.current.s > 1.01) reset(true); else zoomAt(2.6, e.clientX, e.clientY, true);
    } else {
      lastTap.current = { t: now, x: e.clientX, y: e.clientY };
      if (e.target === stage.current && st.current.s <= 1.01) {
        setTimeout(() => { if (lastTap.current.t === now) onClose(); }, 330);
      }
    }
  };

  const center = () => { const r = stage.current.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };

  return (
    <div className="zv fade-in" role="dialog" aria-modal="true" aria-label="عارض الصور">
      <div className="zv__top">
        <button type="button" className="zv__btn" onClick={onClose} aria-label="إغلاق"><X size={22} /></button>
        <span className="zv__count">{i + 1} / {images.length}</span>
        <div className="zv__zoomctl">
          <button type="button" className="zv__btn" onClick={() => zoomAt(st.current.s / 1.6, ...center())} aria-label="تصغير"><Minus size={20} /></button>
          <button type="button" className="zv__btn" onClick={() => zoomAt(st.current.s * 1.6, ...center())} aria-label="تكبير"><Plus size={20} /></button>
        </div>
      </div>
      <div ref={stage} className={`zv__stage${zoomed ? " is-zoomed" : ""}`} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <img ref={img} key={i} src={images[i]} alt={`صورة ${i + 1}`} className="zv__img" draggable={false} />
      </div>
      {images.length > 1 && !zoomed && (
        <>
          <button type="button" className="zv__nav zv__nav--r" onClick={() => go(-1)} aria-label="السابقة"><ChevronRight size={26} /></button>
          <button type="button" className="zv__nav zv__nav--l" onClick={() => go(1)} aria-label="التالية"><ChevronLeft size={26} /></button>
        </>
      )}
      <p className="zv__hint">{zoomed ? "اسحبي لتحريك الصورة · ضغطتين للتصغير" : "ضغطتين أو قرصة بصباعين للتكبير"}</p>
    </div>
  );
}
