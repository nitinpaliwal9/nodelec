export function FilterChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        active
          ? 'bg-primary/10 border-primary/30 text-primary'
          : 'bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-border-strong'
      }`}
    >
      {label}
      <span className={`tabular-nums ${active ? 'text-primary' : 'text-muted-foreground'}`}>{count}</span>
    </button>
  );
}
