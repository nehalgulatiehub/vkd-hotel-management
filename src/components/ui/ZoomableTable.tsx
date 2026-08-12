import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2;
const DEFAULT_MOBILE_ZOOM = 0.5;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

interface ZoomableTableProps {
  children: ReactNode;
  /** wrapper style applied on desktop (and as base on mobile) */
  style?: React.CSSProperties;
  className?: string;
}

/**
 * On mobile, renders the table scaled down so the whole table fits on screen,
 * with pinch-to-zoom and +/- controls. On desktop it is a plain scroll wrapper.
 */
export function ZoomableTable({ children, style, className }: ZoomableTableProps) {
  const isMobile = useIsMobile();
  const [zoom, setZoom] = useState(DEFAULT_MOBILE_ZOOM);
  const containerRef = useRef<HTMLDivElement>(null);
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStart = useRef<{ dist: number; zoom: number } | null>(null);

  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const handleWheel = useCallback((e: WheelEvent) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
    setZoom((z) => clamp(z * Math.exp(-dy * 0.002), MIN_ZOOM, MAX_ZOOM));
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => handleWheel(e);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [isMobile, handleWheel]);

  if (!isMobile) {
    return (
      <div className={className} style={{ overflowX: "auto", ...style }}>
        {children}
      </div>
    );
  }

  const distance = () => {
    const pts = Array.from(pointers.current.values());
    if (pts.length < 2) return 0;
    return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "touch") return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      pinchStart.current = { dist: distance(), zoom: zoomRef.current };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinchStart.current && pinchStart.current.dist > 0) {
      const d = distance();
      setZoom(clamp((pinchStart.current.zoom * d) / pinchStart.current.dist, MIN_ZOOM, MAX_ZOOM));
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
  };

  const btn: React.CSSProperties = {
    border: "1px solid #888",
    background: "#f5f5f5",
    fontSize: 12,
    lineHeight: "18px",
    minWidth: 26,
    padding: "0 6px",
    cursor: "pointer",
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 2px", fontSize: 10, color: "#666" }}>
        <span>Pinch or use buttons to zoom</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 4, alignItems: "center" }}>
          <button type="button" style={btn} onClick={() => setZoom((z) => clamp(z - 0.1, MIN_ZOOM, MAX_ZOOM))}>−</button>
          <span style={{ minWidth: 34, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
          <button type="button" style={btn} onClick={() => setZoom((z) => clamp(z + 0.1, MIN_ZOOM, MAX_ZOOM))}>+</button>
          <button type="button" style={btn} onClick={() => setZoom(DEFAULT_MOBILE_ZOOM)}>Fit</button>
        </div>
      </div>
      <div
        ref={containerRef}
        className={className}
        style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y", ...style }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          style={{
            width: `${100 / zoom}%`,
            transform: `scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
