import { forwardRef, useEffect, useState, ChangeEvent, InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";

type BaseProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange" | "value">;

export interface DateInputProps extends BaseProps {
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  asNative?: boolean;
}

const isoToDisplay = (iso: string) => {
  if (!iso) return "";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
};

const displayToIso = (display: string) => {
  const m = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return "";
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return "";
  return `${m[3]}-${m[2]}-${m[1]}`;
};

const maskDate = (raw: string) => {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(function DateInput(
  { value, onChange, placeholder, ...rest },
  ref,
) {
  const [text, setText] = useState(() => isoToDisplay(value || ""));

  useEffect(() => {
    setText(isoToDisplay(value || ""));
  }, [value]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const masked = maskDate(e.target.value);
    setText(masked);
    const iso = displayToIso(masked);
    if (!onChange) return;
    const original = e.target;
    const synthetic = {
      ...e,
      target: Object.assign(original, { value: iso }),
      currentTarget: Object.assign(original, { value: iso }),
    } as ChangeEvent<HTMLInputElement>;
    onChange(synthetic);
  };

  return (
    <Input
      ref={ref}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder={placeholder || "dd/mm/yyyy"}
      {...rest}
      value={text}
      onChange={handleChange}
    />
  );
});

export default DateInput;
