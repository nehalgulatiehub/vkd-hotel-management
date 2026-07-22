import { forwardRef, useEffect, useRef, useState, ChangeEvent, InputHTMLAttributes } from "react";
import { CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

type BaseProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange" | "value">;

export interface DateInputProps extends BaseProps {
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  asNative?: boolean;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

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

const daysInMonth = (y: number, m0: number) => new Date(y, m0 + 1, 0).getDate();

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(function DateInput(
  { value, onChange, placeholder, className, ...rest },
  ref,
) {
  const [text, setText] = useState(() => isoToDisplay(value || ""));
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const today = new Date();
  const parsed = value ? value.match(/^(\d{4})-(\d{2})-(\d{2})/) : null;
  const selY = parsed ? +parsed[1] : today.getFullYear();
  const selM = parsed ? +parsed[2] : today.getMonth() + 1;
  const selD = parsed ? +parsed[3] : today.getDate();

  const [calY, setCalY] = useState(selY);
  const [calM, setCalM] = useState(selM);

  useEffect(() => {
    setText(isoToDisplay(value || ""));
  }, [value]);

  useEffect(() => {
    if (!open) return;
    setCalY(selY);
    setCalM(selM);
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const fireChange = (iso: string, display: string) => {
    setText(display);
    if (!onChange || !inputRef.current) return;
    const input = inputRef.current;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    setter?.call(input, iso);
    const ev = new Event("input", { bubbles: true }) as unknown as ChangeEvent<HTMLInputElement>;
    Object.defineProperty(ev, "target", { writable: false, value: Object.assign(input, { value: iso }) });
    Object.defineProperty(ev, "currentTarget", { writable: false, value: input });
    onChange(ev);
  };

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

  const shiftMonth = (delta: number) => {
    let nm = calM + delta;
    let ny = calY;
    if (nm < 1) { nm = 12; ny -= 1; }
    if (nm > 12) { nm = 1; ny += 1; }
    setCalM(nm); setCalY(ny);
  };

  const selectDay = (day: number) => {
    const iso = `${calY}-${String(calM).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    fireChange(iso, `${String(day).padStart(2, "0")}/${String(calM).padStart(2, "0")}/${calY}`);
    setOpen(false);
  };

  const firstDow = new Date(calY, calM - 1, 1).getDay();
  const totalDays = daysInMonth(calY, calM - 1);
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let i = 1; i <= totalDays; i++) cells.push(i);
  while (cells.length % 7 !== 0) cells.push(null);

  const yearNow = new Date().getFullYear();
  const years = Array.from({ length: 16 }, (_, i) => yearNow - 5 + i);

  const setRefs = (node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
  };

  return (
    <div ref={wrapRef} className="relative inline-flex items-center w-full">
      <Input
        ref={setRefs}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder || "dd/mm/yyyy"}
        className={`pr-9 ${className || ""}`}
        {...rest}
        value={text}
        onChange={handleChange}
      />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
        aria-label="Open calendar"
        tabIndex={-1}
      >
        <CalendarIcon className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute z-50 top-full right-0 mt-1 bg-white border border-gray-400 shadow-md p-2 text-[12px] select-none">
          <div className="flex items-center justify-between gap-1 px-1 py-1">
            <button type="button" onClick={() => shiftMonth(-1)} className="px-1">◀</button>
            <select
              className="border border-gray-300 bg-white text-[12px] h-6"
              value={calM}
              onChange={(e) => setCalM(+e.target.value)}
            >
              {MONTHS.map((mo, i) => (
                <option key={mo} value={i + 1}>{mo}</option>
              ))}
            </select>
            <select
              className="border border-gray-300 bg-white text-[12px] h-6"
              value={calY}
              onChange={(e) => setCalY(+e.target.value)}
            >
              {years.map((yy) => <option key={yy} value={yy}>{yy}</option>)}
            </select>
            <button type="button" onClick={() => shiftMonth(1)} className="px-1">▶</button>
          </div>
          <table className="border-collapse mt-1">
            <thead>
              <tr>
                {WEEKDAYS.map((w, i) => (
                  <th key={i} className="w-7 h-6 font-semibold text-center">{w}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: cells.length / 7 }, (_, r) => (
                <tr key={r}>
                  {cells.slice(r * 7, r * 7 + 7).map((c, i) => {
                    const isSel = c === selD && calM === selM && calY === selY;
                    return (
                      <td key={i} className="p-0 text-center">
                        {c ? (
                          <button
                            type="button"
                            onClick={() => selectDay(c)}
                            className={`w-7 h-6 hover:bg-gray-200 ${isSel ? "border border-gray-600 bg-gray-100" : ""}`}
                          >
                            {c}
                          </button>
                        ) : (
                          <span className="inline-block w-7 h-6" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

export default DateInput;
