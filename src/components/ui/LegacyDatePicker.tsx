import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

export interface LegacyDatePickerProps {
  value?: string; // yyyy-mm-dd
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  className?: string;
  minYear?: number;
  maxYear?: number;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function daysInMonth(year: number, month0: number) {
  return new Date(year, month0 + 1, 0).getDate();
}

function parseIso(v?: string) {
  if (!v) return null;
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return { y: +m[1], m: +m[2], d: +m[3] };
}

function toIso(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function LegacyDatePicker({
  value,
  onChange,
  name,
  className = "",
  minYear,
  maxYear,
}: LegacyDatePickerProps) {
  const today = new Date();
  const parsed = parseIso(value);
  const initY = parsed?.y ?? today.getFullYear();
  const initM = parsed?.m ?? today.getMonth() + 1;
  const initD = parsed?.d ?? today.getDate();

  const [y, setY] = useState(initY);
  const [m, setM] = useState(initM);
  const [d, setD] = useState(initD);
  const [open, setOpen] = useState(false);
  const [calY, setCalY] = useState(initY);
  const [calM, setCalM] = useState(initM);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const p = parseIso(value);
    if (p) { setY(p.y); setM(p.m); setD(p.d); setCalY(p.y); setCalM(p.m); }
  }, [value]);

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    const lo = minYear ?? now - 5;
    const hi = maxYear ?? now + 10;
    return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  }, [minYear, maxYear]);

  const emit = (ny: number, nm: number, nd: number) => {
    const maxD = daysInMonth(ny, nm - 1);
    const safeD = Math.min(nd, maxD);
    setY(ny); setM(nm); setD(safeD);
    const iso = toIso(ny, nm, safeD);
    if (onChange && inputRef.current) {
      const input = inputRef.current;
      input.value = iso;
      const ev = new Event("input", { bubbles: true }) as unknown as ChangeEvent<HTMLInputElement>;
      Object.defineProperty(ev, "target", { writable: false, value: input });
      Object.defineProperty(ev, "currentTarget", { writable: false, value: input });
      onChange(ev);
    }
  };

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const openCal = () => { setCalY(y); setCalM(m); setOpen(true); };
  const shiftMonth = (delta: number) => {
    let nm = calM + delta;
    let ny = calY;
    if (nm < 1) { nm = 12; ny -= 1; }
    if (nm > 12) { nm = 1; ny += 1; }
    setCalM(nm); setCalY(ny);
  };

  const firstDow = new Date(calY, calM - 1, 1).getDay();
  const totalDays = daysInMonth(calY, calM - 1);
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let i = 1; i <= totalDays; i++) cells.push(i);
  while (cells.length % 7 !== 0) cells.push(null);

  const selectDay = (day: number) => {
    emit(calY, calM, day);
    setOpen(false);
  };

  const selCls =
    "border border-gray-400 bg-white px-1 py-0.5 text-[12px] leading-none h-[22px]";

  return (
    <div ref={wrapRef} className={`relative inline-flex items-center gap-1 ${className}`}>
      <input ref={inputRef} type="hidden" name={name} value={toIso(y, m, d)} readOnly />
      <select className={selCls} value={m} onChange={(e) => emit(y, +e.target.value, d)}>
        {MONTHS.map((mo, i) => (
          <option key={mo} value={i + 1}>{mo}</option>
        ))}
      </select>
      <select className={selCls} value={d} onChange={(e) => emit(y, m, +e.target.value)}>
        {Array.from({ length: daysInMonth(y, m - 1) }, (_, i) => i + 1).map((dd) => (
          <option key={dd} value={dd}>{dd}</option>
        ))}
      </select>
      <select className={selCls} value={y} onChange={(e) => emit(+e.target.value, m, d)}>
        {years.map((yy) => (
          <option key={yy} value={yy}>{yy}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openCal())}
        className="border border-gray-400 bg-white h-[22px] w-[22px] flex items-center justify-center text-[12px]"
        aria-label="Open calendar"
      >
        📅
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-white border border-gray-400 shadow-md p-1 text-[12px] select-none">
          <div className="flex items-center justify-between px-1 py-0.5">
            <button type="button" onClick={() => shiftMonth(-1)} className="px-1">◀</button>
            <div className="font-semibold">{MONTHS[calM - 1]} {calY}</div>
            <button type="button" onClick={() => shiftMonth(1)} className="px-1">▶</button>
          </div>
          <table className="border-collapse">
            <thead>
              <tr>
                {WEEKDAYS.map((w, i) => (
                  <th key={i} className="w-6 h-5 font-semibold text-center">{w}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: cells.length / 7 }, (_, r) => (
                <tr key={r}>
                  {cells.slice(r * 7, r * 7 + 7).map((c, i) => {
                    const isSel = c === d && calM === m && calY === y;
                    return (
                      <td key={i} className="p-0 text-center">
                        {c ? (
                          <button
                            type="button"
                            onClick={() => selectDay(c)}
                            className={`w-6 h-5 hover:bg-gray-200 ${isSel ? "border border-gray-600 bg-gray-100" : ""}`}
                          >
                            {c}
                          </button>
                        ) : (
                          <span className="inline-block w-6 h-5" />
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
}

export default LegacyDatePicker;
