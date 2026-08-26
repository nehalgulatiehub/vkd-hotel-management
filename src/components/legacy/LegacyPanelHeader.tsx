import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LegacyPanelHeaderProps {
  title: string;
  right?: ReactNode;
  className?: string;
  rounded?: boolean;
}

export function LegacyPanelHeader({ title, right, className, rounded = true }: LegacyPanelHeaderProps) {
  return (
    <div
      className={cn("flex justify-between items-center px-4 py-2", rounded && "rounded-t-md", className)}
      style={{ backgroundColor: "#1e6e99" }}
    >
      <span className="text-white font-semibold text-sm">{title}</span>
      {right ?? null}
    </div>
  );
}
