/** Pass the control as children; the message ids are `${id}-error` and `${id}-help`, for aria-describedby. */
export function Field({ id, label, hint, error, help, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="eyebrow flex justify-between">
        <span>{label}</span>
        {hint && <span>{hint}</span>}
      </label>
      {children}
      {error ? (
        <span id={`${id}-error`} className="text-sm font-semibold text-red">
          {error}
        </span>
      ) : (
        help && (
          <span id={`${id}-help`} className="text-xs text-grey">
            {help}
          </span>
        )
      )}
    </div>
  );
}

export function CategoryOption({ name, value, label, hint, checked, onChange }) {
  return (
    <label
      className={`flex min-h-[60px] cursor-pointer items-center gap-3.5 rounded-control border px-4 py-3.5 ${
        checked ? 'border-accent bg-tint' : 'border-border bg-white'
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
        <span className="heading-weight block text-[15px] leading-tight">{label}</span>
        <span className="block text-xs text-grey">{hint}</span>
      </span>
    </label>
  );
}
