import { useEffect, useRef } from "react";
import { SpringGroup, prefersReducedMotion } from "./spring";

const EMOJI = ["💌", "🌹", "💍", "🧸", "🌙", "🎀", "🦋", "⭐"];

// تذكرة حب: بتميل 3D مع الصباع/الماوس بطبقات (parallax) وبتتقلب بزنبرك لما تضغطي عليها.
// قيم الزنبرك (stiffness/damping) هنا قيمي أنا، مش مأخوذة من مكتبة خارجية.
export default function TicketCard({ index, front, back, gradient }) {
  const root = useRef(null);
  const sg = useRef(null);
  const flipped = useRef(false);
  const reduced = useRef(false);

  useEffect(() => {
    const el = root.current;
    reduced.current = prefersReducedMotion();
    const g = new SpringGroup((v) => {
      el.style.setProperty("--tx", v.tx.toFixed(3));
      el.style.setProperty("--ty", v.ty.toFixed(3));
      el.style.setProperty("--flip", v.flip.toFixed(2));
    });
    g.add("tx", 0, 150, 18, 0.002).add("ty", 0, 150, 18, 0.002).add("flip", 0, 120, 12, 0.05);
    sg.current = g;
    return () => g.destroy();
  }, []);

  const aim = (e) => {
    if (reduced.current || !sg.current) return;
    const r = root.current.getBoundingClientRect();
    const nx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
    const ny = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
    sg.current.to("tx", nx);
    sg.current.to("ty", ny);
  };
  const rest = () => { sg.current?.to("tx", 0); sg.current?.to("ty", 0); };

  const toggle = () => {
    flipped.current = !flipped.current;
    navigator.vibrate?.(10);
    if (reduced.current) sg.current.snap("flip", flipped.current ? 180 : 0);
    else sg.current.to("flip", flipped.current ? 180 : 0);
    root.current.setAttribute("aria-pressed", String(flipped.current));
  };

  const no = String(index + 1).padStart(2, "0");
  return (
    <div
      ref={root}
      className="ticket"
      role="button"
      tabIndex={0}
      aria-pressed="false"
      aria-label={`تذكرة ${no}: ${front}`}
      onPointerMove={aim}
      onPointerDown={aim}
      onPointerLeave={rest}
      onPointerUp={(e) => { if (e.pointerType !== "mouse") rest(); }}
      onPointerCancel={rest}
      onClick={toggle}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } }}
    >
      <div className="ticket__tilt">
        <div className="ticket__flip">
          <div className="ticket__face ticket__face--front">
            <span className="ticket__layer ticket__layer--bg" aria-hidden="true">{EMOJI[index % EMOJI.length]}</span>
            <span className="ticket__no">تذكرة حب · {no}</span>
            <p className="ticket__title ticket__layer--mid">{front}</p>
            <span className="ticket__perf" />
            <div className="ticket__stub"><span className="ticket__bars" /><span className="ticket__hint">اضغطي واقلبيها</span></div>
            <span className="ticket__glare" />
          </div>
          <div className="ticket__face ticket__face--back" style={{ background: gradient }}>
            <span className="ticket__layer ticket__layer--bg" aria-hidden="true">❤️</span>
            <span className="ticket__no">رسالة لكِ</span>
            <p className="ticket__title ticket__layer--mid">{back}</p>
            <span className="ticket__perf" />
            <div className="ticket__stub"><span className="ticket__bars" /><span className="ticket__hint">بحبك ✨</span></div>
            <span className="ticket__glare" />
          </div>
        </div>
      </div>
    </div>
  );
}
