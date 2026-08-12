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
  return (
    <Panel
      title={title}
      serial={serial}
      className={className}
      meta={
        <>
          <Led label="SYNC" active={active} tone="blue" />
          <span>CAL / 24</span>
          {meta}
        </>
      }
    >
      <div className="crt-screen">
        <canvas ref={canvasRef} aria-label={`${title} signal display`} />
        {!active ? <span className="no-signal">NO SIGNAL</span> : null}
        {children}
      </div>
    </Panel>
  );
}
