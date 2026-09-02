import { useLanguage } from "@/components/LanguageProvider";
import { signalDisplayLabel } from "@/lib/i18n";
import type { ReactNode, RefObject } from "react";

import { Led } from "@/components/ui/Led";
import { Panel } from "@/components/ui/Panel";

type VisualizerFrameProps = {
  title: string;
  serial: string;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  active: boolean;
  className?: string;
  children?: ReactNode;
  meta?: ReactNode;
};

export function VisualizerFrame({
  title,
  serial,
  canvasRef,
  active,
  className,
  children,
  meta,
}: VisualizerFrameProps) {
  const { t, language } = useLanguage();
  return (
    <Panel
      title={title}
      serial={serial}
      className={className}
      reactive={active}
      meta={
        <>
          <Led label={t.visualizers.sync} active={active} tone="blue" />
          <span>{t.visualizers.cal}</span>
          {meta}
        </>
      }
    >
      <div className="crt-screen">
        <canvas ref={canvasRef} aria-label={signalDisplayLabel(title, language)} />
        {!active ? <span className="no-signal">{t.visualizers.noSignal}</span> : null}
        {children}
      </div>
    </Panel>
  );
}
