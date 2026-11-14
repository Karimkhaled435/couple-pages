// شريط تقدم تفاعلي: الخط بيتملي بحركة زنبركية، والخطوة الحالية بتنبض، والمكتملة بتطلع علامة ✓
export default function StepProgress({ steps, current }) {
  const n = steps.length;
  const fill = n > 1 ? current / (n - 1) : 1;
  const overall = Math.round(((current + 1) / n) * 100);
  return (
    <div className="sp" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={overall} aria-label="التقدم في ملء البيانات">
      <div className="sp__head">
        <span className="sp__label" key={current}>{steps[current].icon} {steps[current].label}</span>
        <span className="sp__count">الخطوة {current + 1} من {n} · <b key={overall}>{overall}%</b></span>
      </div>
      <div className="sp__track">
        <div className="sp__line"><div className="sp__fill" style={{ transform: `scaleX(${fill})` }} /></div>
        <ol className="sp__nodes">
          {steps.map((s, i) => {
            const state = i < current ? "done" : i === current ? "active" : "todo";
            return (
              <li key={s.id} className={`sp__node sp__node--${state}`} aria-current={state === "active" ? "step" : undefined}>
                <span className="sp__icon">{state === "done" ? "✓" : s.icon}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
