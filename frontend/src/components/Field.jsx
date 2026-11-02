/** A form control with its small label above and its error message below. Pass the control as children. */
export function Field({ id, label, hint, error, children }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="eyebrow flex justify-between">
        <span>{label}</span>
        {hint && <span>{hint}</span>}
      </label>
      {children}
      {error && <span className="text-sm font-semibold text-red">{error}</span>}
    </div>
  );
}

/** One radio card in a group. The selected card is yellow with an ink border. */
export function CategoryOption({ name, value, label, hint, checked, onChange }) {
  return (
    <label
      className={`flex min-h-[60px] cursor-pointer items-center gap-3.5 rounded-control border px-3.5 py-2.5 ${
        checked ? 'border-ink bg-yellow' : 'border-border bg-white'
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="m-0 h-5 w-5 shrink-0"
      />
      <span>
        <span className="heading-weight block text-base uppercase leading-tight">{label}</span>
        <span className="block text-[13px]">{hint}</span>
      </span>
    </label>
  );
}
