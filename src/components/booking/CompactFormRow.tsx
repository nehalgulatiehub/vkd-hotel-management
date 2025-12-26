import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CompactFormRowProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function CompactFormRow({ label, required, children, className }: CompactFormRowProps) {
  return (
    <div className={cn("flex items-center gap-2 py-0.5", className)}>
      <Label className="w-28 text-right text-[11px] shrink-0">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <div className="flex-1">{children}</div>
    </div>
  );
}
