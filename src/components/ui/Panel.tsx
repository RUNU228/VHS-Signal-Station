import { useId, type ReactNode } from "react";

type PanelProps = {
  title: string;
  serial: string;
  className?: string;
  children: ReactNode;
  meta?: ReactNode;
};

export function Panel({ title, serial, className = "", children, meta }: PanelProps) {
  const titleId = useId();
  return (
    <section className={`equipment-panel ${className}`} aria-labelledby={titleId}>
      <span className="panel-screw panel-screw--tl" aria-hidden="true" />
      <span className="panel-screw panel-screw--tr" aria-hidden="true" />
      <span className="panel-screw panel-screw--bl" aria-hidden="true" />
      <span className="panel-screw panel-screw--br" aria-hidden="true" />
      <header className="panel-header">
        <div>
          <p className="panel-kicker">SIGNAL MODULE / {serial}</p>
          <h3 id={titleId}>{title}</h3>
        </div>
        {meta ? <div className="panel-meta">{meta}</div> : null}
      </header>
      {children}
    </section>
  );
}
