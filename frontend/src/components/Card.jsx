/** White card: 16px radius, 1px border, no shadow. */
export function Card({ className = '', children, ...rest }) {
  return (
    <div className={`panel ${className}`} {...rest}>
      {children}
    </div>
  );
}

/** Yellow header block with the current status, then white details underneath. */
export function StatusCard({ eyebrow, title, updated, children, className = '' }) {
  return (
    <Card className={className}>
      <div className="flex flex-col gap-2 bg-yellow px-5 py-[18px]">
        {eyebrow && <div className="eyebrow text-ink">{eyebrow}</div>}
        <h2 className="display m-0 text-[28px] leading-none">{title}</h2>
        {updated && <div className="text-xs">{updated}</div>}
      </div>
      <div className="px-5 pb-5 pt-1">{children}</div>
    </Card>
  );
}
