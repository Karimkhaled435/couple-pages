import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { SpringGroup } from "./spring";

// وضع كل كارت حسب ترتيبه في الكومة
const SLOTS = [
  { x: 0, y: 0, s: 1, r: 0, o: 1 },
  { x: 0, y: 16, s: 0.94, r: -3, o: 1 },
  { x: 0, y: 32, s: 0.88, r: 3, o: 0.9 },
];
const HIDDEN = { x: 0, y: 32, s: 0.82, r: 0, o: 0 };
const slot = (p) => SLOTS[p] || HIDDEN;

// معرض صور بشكل "كومة كروت": اسحبي الكارت يمين/شمال ليطير ويروح آخر الكومة (لفة لا نهائية)،
// واضغطي عليه لفتح العارض بتكبير. قيم الزنبرك هنا قيمي أنا مش من مكتبة خارجية.
export default function SwipeDeck({ images, onOpen }) {
  const n = images.length;
  const [order, setOrder] = useState(() => images.map((_, i) => i));
  const stage = useRef(null);
  const els = useRef({});
  const groups = useRef({});
  const drag = useRef(null);
  const busy = useRef(false);
  const orderRef = useRef(order);
  const teleport = useRef(null);
  const timer = useRef(0);

  useEffect(() => { orderRef.current = order; }, [order]);

  // إنشاء زنبرك لكل كارت مرة واحدة
  useEffect(() => {
    const map = {};
    for (let id = 0; id < n; id++) {
      const g = new SpringGroup((v) => {
        const el = els.current[id];
        if (!el) return;
        el.style.transform = `translate3d(${v.x.toFixed(1)}px, ${v.y.toFixed(1)}px, 0) scale(${v.s.toFixed(4)}) rotate(${v.r.toFixed(2)}deg)`;
        el.style.opacity = Math.max(0, Math.min(1, v.o)).toFixed(3);
      });
      g.add("x", 0, 230, 25, 0.3).add("y", 32, 230, 25, 0.3).add("s", 0.82, 200, 22, 0.002).add("r", 0, 200, 22, 0.05).add("o", 0, 200, 26, 0.01);
      map[id] = g;
    }
    groups.current = map;
    return () => { Object.values(map).forEach((g) => g.destroy()); clearTimeout(timer.current); };
  }, [n]);

  // أي تغيير في الترتيب = حركة كل الكروت لأماكنها الجديدة
  useEffect(() => {
    order.forEach((id, p) => {
      const g = groups.current[id];
      if (!g) return;
      const t = teleport.current;
      if (t && t.id === id) {
        const from = t.from;
        g.snap("x", from.x); g.snap("y", from.y); g.snap("s", from.s); g.snap("r", from.r); g.snap("o", from.o);
      }
      const s = slot(p);
      g.to("x", s.x); g.to("y", s.y); g.to("s", s.s); g.to("r", s.r); g.to("o", s.o);
    });
    teleport.current = null;
  }, [order]);

  const width = () => stage.current?.clientWidth || 300;

  const flyOut = (dir) => {
    if (busy.current || n < 2) return;
    busy.current = true;
    const id = orderRef.current[0];
    const g = groups.current[id];
    g.to("x", dir * width() * 1.25); g.to("y", 20); g.to("r", dir * 22); g.to("o", 0);
    navigator.vibrate?.(8);
    timer.current = setTimeout(() => {
      teleport.current = { id, from: HIDDEN };
      setOrder((o) => [...o.slice(1), o[0]]);
      busy.current = false;
    }, 230);
  };

  const flyBack = () => {
    if (busy.current || n < 2) return;
    busy.current = true;
    const cur = orderRef.current;
    const id = cur[cur.length - 1];
    teleport.current = { id, from: { x: -width() * 1.25, y: 20, s: 1, r: -22, o: 0 } };
    setOrder([id, ...cur.slice(0, -1)]);
    timer.current = setTimeout(() => { busy.current = false; }, 260);
  };

  const onDown = (e) => {
    if (busy.current) return;
    const id = orderRef.current[0];
    drag.current = { id, x0: e.clientX, y0: e.clientY, lx: e.clientX, lt: performance.now(), vx: 0, moved: false };
    stage.current.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    const d = drag.current; if (!d) return;
    const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
    if (!d.moved && Math.hypot(dx, dy) > 6) d.moved = true;
    const now = performance.now();
    d.vx = (e.clientX - d.lx) / Math.max(1, now - d.lt);
    d.lx = e.clientX; d.lt = now;
    if (d.moved) {
      const g = groups.current[d.id];
      g.snap("x", dx); g.snap("y", dy * 0.25); g.snap("r", dx / 14); g.snap("o", 1);
    }
  };
  const onUp = (e) => {
    const d = drag.current; drag.current = null;
    if (!d) return;
    stage.current.releasePointerCapture?.(e.pointerId);
    if (!d.moved) { onOpen(d.id); return; }
    const dx = e.clientX - d.x0;
    const fling = n > 1 && (Math.abs(dx) > width() * 0.26 || Math.abs(d.vx) > 0.55);
    if (fling) { flyOut((Math.abs(dx) > 20 ? dx : d.vx) > 0 ? 1 : -1); return; }
    const g = groups.current[d.id];
    g.to("x", 0); g.to("y", 0); g.to("r", 0);
  };
  const onCancel = () => {
    const d = drag.current; drag.current = null;
    if (!d) return;
    const g = groups.current[d.id];
    g.to("x", 0); g.to("y", 0); g.to("r", 0);
  };

  const top = order[0];
  return (
    <div className="deck">
      <div
        ref={stage}
        className="deck__stage"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onCancel}
        role="group"
        aria-label="معرض الصور: اسحبي الصورة أو اضغطي للتكبير"
      >
        {images.map((src, id) => {
          const p = order.indexOf(id);
          return (
            <div
              key={id}
              ref={(el) => { els.current[id] = el; }}
              className="deck__card"
              style={{ zIndex: n - p, pointerEvents: p === 0 ? "auto" : "none", opacity: 0 }}
            >
              <img src={src} alt={`ذكرى ${id + 1}`} draggable={false} onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
              <span className="deck__zoom" aria-hidden="true"><ZoomIn size={16} /></span>
            </div>
          );
        })}
      </div>

      <div className="deck__bar">
        <button type="button" className="deck__btn btn-press" onClick={flyBack} disabled={n < 2} aria-label="الصورة السابقة"><ChevronRight size={20} /></button>
        <div className="deck__dots" aria-hidden="true">
          {images.map((_, i) => <span key={i} className={`deck__dot${i === top ? " cur" : ""}`} />)}
        </div>
        <button type="button" className="deck__btn btn-press" onClick={() => flyOut(-1)} disabled={n < 2} aria-label="الصورة التالية"><ChevronLeft size={20} /></button>
      </div>
      <p className="deck__hint">{n > 1 ? "اسحبي الصورة يمين أو شمال · " : ""}اضغطي عليها للتكبير 🔍</p>
    </div>
  );
}
