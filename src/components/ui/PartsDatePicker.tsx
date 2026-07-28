import { LegacyDatePicker } from "@/components/ui/LegacyDatePicker";

interface PartsDatePickerProps {
  month: string;
  day: string;
  year: string;
  onChange: (parts: { month: string; day: string; year: string }) => void;
  className?: string;
}

/**
 * Calendar date picker that reads/writes month/day/year string parts,
 * for legacy filter panels that store dates as three separate fields.
 */
export function PartsDatePicker({ month, day, year, onChange, className = "" }: PartsDatePickerProps) {
  const iso =
    month && day && year
      ? `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      : "";

  return (
    <LegacyDatePicker
      className={className}
      value={iso}
      onChange={(e) => {
        const v = e.target.value;
        const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!m) {
          onChange({ month: "", day: "", year: "" });
          return;
        }
        onChange({ year: m[1], month: String(Number(m[2])), day: String(Number(m[3])) });
      }}
    />
  );
}
