import { ReactNode } from "react";

interface ZoomableTableProps {
  children: ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Horizontal scroll wrapper for wide tables.
 * Mobile zooming is handled globally by <MobileTableZoom /> + the
 * `table { zoom: var(--mobile-table-zoom) }` rule in index.css, so this
 * component only needs to provide the scroll container.
 */
export function ZoomableTable({ children, style, className }: ZoomableTableProps) {
  return (
    <div className={className} style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", ...style }}>
      {children}
    </div>
  );
}

export default ZoomableTable;
