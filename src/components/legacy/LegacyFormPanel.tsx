import { ReactNode } from "react";
import { LegacyPanelHeader } from "./LegacyPanelHeader";

interface LegacyFormPanelProps {
  title: string;
  rightSlot?: ReactNode;
  children: ReactNode;
}

export function LegacyFormPanel({ title, rightSlot, children }: LegacyFormPanelProps) {
  return (
    <div className="rounded-md overflow-hidden" style={{ border: "1px solid #1e6e99" }}>
      <LegacyPanelHeader title={title} rounded={false} right={rightSlot} />
      <div className="px-8 py-6 space-y-4" style={{ backgroundColor: "#F5E6E0" }}>
        {children}
      </div>
      <div style={{ backgroundColor: "#1e6e99" }} className="h-3" />
    </div>
  );
}
