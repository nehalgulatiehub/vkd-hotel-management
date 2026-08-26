import { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface LegacyFormRowProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function LegacyFormRow({ label, htmlFor, required, children, className }: LegacyFormRowProps) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <Label htmlFor={htmlFor} className="w-44 shrink-0 text-right pt-2 text-sm font-normal">
        {label} : {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="flex-1 max-w-md">{children}</div>
    </div>
  );
}
