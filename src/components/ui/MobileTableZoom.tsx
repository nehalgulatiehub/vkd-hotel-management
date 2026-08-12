import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 1.5;
const DEFAULT_ZOOM = 0.55;
const STORAGE_KEY = "mobileTableZoom";

const clamp = (v: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v));

/**
 * Global mobile-only zoom control. It sets the --mobile-table-zoom CSS variable,
 * which index.css applies to every table so wide legacy tables fit the screen.
 */
export function MobileTableZoom() {
  const isMobile = useIsMobile();
  const [zoom, setZoom] = useState<number>(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEY));
    return stored >= MIN_ZOOM && stored <= MAX_ZOOM ? stored : DEFAULT_ZOOM;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (!isMobile) {
      root.style.removeProperty("--mobile-table-zoom");
      return;
    }
    root.style.setProperty("--mobile-table-zoom", String(zoom));
    localStorage.setItem(STORAGE_KEY, String(zoom));
  }, [zoom, isMobile]);

  if (!isMobile) return null;

  const btn = "border border-gray-400 bg-white/95 px-2 py-0.5 text-[12px] leading-5 rounded";

  return (
    <div className="fixed bottom-2 right-2 z-50 flex items-center gap-1 rounded border border-gray-300 bg-white/90 px-1.5 py-1 shadow-md backdrop-blur print:hidden">
      <button type="button" className={btn} onClick={() => setZoom((z) => clamp(z - 0.1))} aria-label="Zoom out tables">−</button>
      <span className="min-w-[34px] text-center text-[11px] text-gray-700">{Math.round(zoom * 100)}%</span>
      <button type="button" className={btn} onClick={() => setZoom((z) => clamp(z + 0.1))} aria-label="Zoom in tables">+</button>
      <button type="button" className={btn} onClick={() => setZoom(DEFAULT_ZOOM)}>Fit</button>
    </div>
  );
}

export default MobileTableZoom;
