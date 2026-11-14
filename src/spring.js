// محرك زنبركي صغير (stiffness / damping) بدون مكتبات.
// بيشتغل بس وقت الحركة، وبيقف لوحده لما كل العناصر تستقر، فمفيش استهلاك وقت السكون.
export class SpringGroup {
  constructor(onFrame) {
    this.onFrame = onFrame;
    this.springs = {};
    this.raf = 0;
    this.last = 0;
    this.dead = false;
    this.tick = this.tick.bind(this);
  }
  add(name, value, k, c, eps = 0.01) {
    this.springs[name] = { x: value, v: 0, t: value, k, c, eps };
    return this;
  }
  get(name) { return this.springs[name].x; }
  to(name, target) { this.springs[name].t = target; this.kick(); }
  snap(name, value) { const s = this.springs[name]; s.x = value; s.t = value; s.v = 0; this.kick(); }
  values() { const o = {}; for (const k in this.springs) o[k] = this.springs[k].x; return o; }
  kick() {
    if (this.dead || this.raf) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }
  tick(now) {
    const dt = Math.min(0.032, Math.max(0.001, (now - this.last) / 1000));
    this.last = now;
    const sub = 4, h = dt / sub;
    let moving = false;
    for (const key in this.springs) {
      const s = this.springs[key];
      for (let i = 0; i < sub; i++) {
        const a = -s.k * (s.x - s.t) - s.c * s.v;
        s.v += a * h;
        s.x += s.v * h;
      }
      if (Math.abs(s.v) > s.eps * 2 || Math.abs(s.x - s.t) > s.eps) moving = true;
      else { s.x = s.t; s.v = 0; }
    }
    this.onFrame(this.values());
    this.raf = moving ? requestAnimationFrame(this.tick) : 0;
  }
  destroy() { this.dead = true; if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0; }
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
