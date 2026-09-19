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
  const today = new Date();
  const defY = String(today.getFullYear());
  const defM = String(today.getMonth() + 1);
  const defD = String(today.getDate());

  const curY = year || defY;
  const curM = month || defM;
  const curD = day || defD;

  const iso = `${curY}-${String(curM).padStart(2, "0")}-${String(curD).padStart(2, "0")}`;

  return (
    <LegacyDatePicker
      className={className}
      value={iso}
      onChange={(e) => {
        const v = e.target.value;
        const m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (!m) {
          onChange({ month: defM, day: defD, year: defY });
          return;
        }
        onChange({ year: m[1], month: String(Number(m[2])), day: String(Number(m[3])) });
      }}
    />
  );
}
