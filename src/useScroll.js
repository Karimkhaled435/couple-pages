import { useEffect, useState } from "react";

// بيضيف كلاس "in" للعناصر اللي عليها .reveal أول ما تظهر على الشاشة
export function useRevealOnScroll(dep) {
  useEffect(() => {
    const els = [...document.querySelectorAll(".reveal:not(.in)")];
    if (typeof IntersectionObserver === "undefined") { els.forEach(e => e.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach(e => io.observe(e));
    return () => io.disconnect();
  }, [dep]);
}

// بيعرف أنهي قسم ظاهر دلوقتي عشان الشريط السفلي يتحدث لوحده
export function useScrollSpy(ids, enabled) {
  const key = ids.join("|");
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    if (!enabled) return;
    const list = key.split("|");
    let raf = 0;
    const compute = () => {
      raf = 0;
      const els = list.map(id => document.getElementById(id)).filter(Boolean);
      if (!els.length) return;
      const line = window.innerHeight * 0.4;
      let cur = els[0].id;
      for (const el of els) if (el.getBoundingClientRect().top <= line) cur = el.id;
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = els[els.length - 1].id;
      setActive(cur);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(compute); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    compute();
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [key, enabled]);
  return [active, setActive];
}

// تمرير سلس لقسم بدون ما حركة الظهور (transform) تأثر على الموضع المحسوب
export function scrollToId(id, offset = 16) {
  const el = document.getElementById(id);
  if (!el) return;
  let top = 0;
  for (let n = el; n; n = n.offsetParent) top += n.offsetTop;
  window.scrollTo({ top: Math.max(0, top - offset), behavior: "smooth" });
}
