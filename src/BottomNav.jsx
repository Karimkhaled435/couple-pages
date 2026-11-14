// شريط تنقل سفلي عائم (يظهر على الموبايل فقط) — العنصر النشط بيتمدد ويظهر اسمه
export default function BottomNav({ items, active, onChange, ariaLabel = "التنقل" }) {
  return (
    <nav className="bnav" aria-label={ariaLabel}>
      {items.map((item) => {
        const { id, label } = item;
        const Icon = item.Icon;
        const on = id === active;
        return (
          <button
            key={id}
            type="button"
            className={`bnav__item${on ? " active" : ""}`}
            aria-current={on ? "page" : undefined}
            aria-label={label}
            onClick={() => { navigator.vibrate?.(8); onChange(id); }}
          >
            <Icon size={20} strokeWidth={2.2} />
            <span className="bnav__label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
