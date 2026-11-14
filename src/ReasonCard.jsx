import { useEffect, useRef, useState } from "react";

const PLACEHOLDER = "اضغطي على الزرار عشان تعرفي...";
const PARTICLES = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2;
  return { bx: `${Math.round(Math.cos(a) * 70)}px`, by: `${Math.round(Math.sin(a) * 46)}px`, s: ["💖", "✨", "💕", "❤️"][i % 4] };
});

function shuffle(n, avoid) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  if (n > 1 && a[0] === avoid) [a[0], a[1]] = [a[1], a[0]];
  return a;
}

// "ليه بحبك": كل ضغطة = خروج للنص القديم + دخول زنبركي للجديد + انفجار قلوب + نقطة تتقدم.
// بيعرض كل الأسباب قبل ما يكرر أي سبب.
export default function ReasonCard({ reasons }) {
  const [text, setText] = useState(PLACEHOLDER);
  const [phase, setPhase] = useState("idle");
  const [seen, setSeen] = useState(0);
  const [burst, setBurst] = useState(0);
  const bag = useRef([]);
  const last = useRef(-1);
  const timers = useRef([]);
  const btn = useRef(null);
  const busy = useRef(false);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const next = () => {
    if (busy.current || !reasons.length) return;
    busy.current = true;
    if (!bag.current.length) bag.current = shuffle(reasons.length, last.current);
    const idx = bag.current.shift();
    last.current = idx;

    btn.current?.animate(
      [{ transform: "scale(1)" }, { transform: "scale(.9)", offset: 0.25 }, { transform: "scale(1.12)", offset: 0.6 }, { transform: "scale(1)" }],
      { duration: 460, easing: "cubic-bezier(.34,1.56,.64,1)" }
    );
    setBurst((b) => b + 1);
    setPhase("out");
    timers.current.push(setTimeout(() => {
      setText(reasons[idx]);
      setSeen((s) => Math.min(reasons.length, s + 1));
      setPhase("in");
    }, 180));
    timers.current.push(setTimeout(() => { setPhase("idle"); busy.current = false; }, 760));
  };

  const showDots = reasons.length <= 14;
  return (
    <div className="reason">
      <div className="reason__box" data-phase={phase} aria-live="polite">
        <p key={text} className={`reason__text reason--${phase}`}>{text}</p>
        {seen > 0 && <span className="reason__count">{seen} / {reasons.length}</span>}
      </div>
      {showDots && (
        <div className="reason__dots" aria-hidden="true">
          {reasons.map((_, i) => <span key={i} className={`reason__dot${i < seen ? " on" : ""}${i === seen - 1 ? " cur" : ""}`} />)}
        </div>
      )}
      <button ref={btn} type="button" className="reason__btn btn-shine" onClick={next}>
        <span key={`s${burst}`} className="reason__spark">✨</span> سر جديد
        {burst > 0 && PARTICLES.map((p, i) => (
          <span key={`${burst}-${i}`} className="reason__p" style={{ "--bx": p.bx, "--by": p.by }} aria-hidden="true">{p.s}</span>
        ))}
      </button>
    </div>
  );
}
