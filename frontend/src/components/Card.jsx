/** White card: 4px radius, 1px border, soft shadow. */
export function Card({ className = '', children, ...rest }) {
  return (
    <div className={`panel ${className}`} {...rest}>
      {children}
    </div>
  );
}

/** Accent header block with the current status, then white details underneath. */
export function StatusCard({ eyebrow, title, updated, children, className = '' }) {
  return (
    <Card className={className}>
      <div className="flex flex-col gap-2 bg-accent px-5 py-[18px] text-on-accent">
        {eyebrow && <div className="eyebrow text-on-accent/85">{eyebrow}</div>}
        <h2 className="display m-0 text-[26px]">{title}</h2>
        {updated && <div className="text-xs">{updated}</div>}
      </div>
      <div className="px-5 pb-5 pt-1">{children}</div>
    </Card>
  );
}
