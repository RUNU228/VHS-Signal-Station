type LedProps = {
  label: string;
  active?: boolean;
  tone?: "red" | "amber" | "blue";
};

export function Led({ label, active = false, tone = "amber" }: LedProps) {
  return (
    <span className="led-unit" data-active={active} data-tone={tone}>
      <span className="led-dot" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
