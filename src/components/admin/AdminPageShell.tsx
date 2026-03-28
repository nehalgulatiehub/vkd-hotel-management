import { ReactNode, cloneElement, isValidElement } from "react";
import { TablePagination } from "@/components/ui/TablePagination";

interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline";
}

interface AdminPageShellProps {
  title: string;
  actions?: ActionButton[];
  filterSection?: ReactNode;
  children: ReactNode;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    startIndex: number;
    endIndex: number;
  };
}

const MAROON = "#b44a50";
const MAROON_LIGHT = "#c47a7e";
const ROW_ALT = "#f6f0f0";

export function AdminPageShell({ title, actions, filterSection, children, pagination }: AdminPageShellProps) {
  return (
    <div style={{ padding: 12, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 }}>
      {/* Page Title */}
      <div style={{ fontSize: 13, fontWeight: "bold", marginBottom: 8, color: "#333" }}>
        📋 {title}
      </div>

      {/* Search/Filter Section */}
      {filterSection && (
        <div style={{ border: "1px solid #ccc", marginBottom: 0, width: "100%" }}>
          {/* Search header bar */}
          <div style={{
            backgroundColor: MAROON,
            color: "#fff",
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: "bold",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <span>Search</span>
            {actions && actions.length > 0 && (
              <div style={{ display: "flex", gap: 6 }}>
                {actions.map((action, i) => (
                  <span
                    key={i}
                    onClick={action.onClick}
                    style={{ color: "#fff", cursor: "pointer", textDecoration: "underline", fontSize: 11 }}
                  >
                    {action.label}
                  </span>
                ))}
              </div>
            )}
          </div>
          {/* Filter content */}
          <div style={{ padding: "8px 10px", backgroundColor: "#fff", borderTop: "1px solid #ccc", width: "100%", boxSizing: "border-box" }}>
            {isValidElement(filterSection)
              ? cloneElement(filterSection, {
                  style: {
                    ...(filterSection.props.style || {}),
                    width: "100%",
                    boxSizing: "border-box",
                  },
                })
              : filterSection}
          </div>
        </div>
      )}

      {/* If no filter, show actions in a simple bar */}
      {!filterSection && actions && actions.length > 0 && (
        <div style={{
          backgroundColor: MAROON,
          color: "#fff",
          padding: "4px 10px",
          fontSize: 11,
          fontWeight: "bold",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 6
        }}>
          {actions.map((action, i) => (
            <span
              key={i}
              onClick={action.onClick}
              style={{ color: "#fff", cursor: "pointer", textDecoration: "underline", fontSize: 11 }}
            >
              {action.label}
            </span>
          ))}
        </div>
      )}

      {/* Table */}
      <div style={{ border: "1px solid #ccc", borderTop: filterSection ? "none" : "1px solid #ccc", overflowX: "auto" }}>
        {children}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <TablePagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={pagination.onPageChange}
          totalItems={pagination.totalItems}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
        />
      )}
    </div>
  );
}

/* Reusable themed table sub-components matching screenshot exactly */
export function ThemedTable({ children }: { children: ReactNode }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif" }}>
      {children}
    </table>
  );
}

export function ThemedTHead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr style={{ backgroundColor: MAROON_LIGHT, color: "#fff", fontWeight: "bold" }}>
        {children}
      </tr>
    </thead>
  );
}

export function ThemedTH({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <th style={{
      border: "1px solid #a88",
      padding: "5px 8px",
      textAlign: "left",
      fontWeight: "bold",
      fontSize: 11,
      color: "#fff",
      backgroundColor: MAROON_LIGHT
    }}>
      {children}
    </th>
  );
}

export function ThemedTD({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <td style={{
      border: "1px solid #ddd",
      padding: "5px 8px",
      fontSize: 11,
      color: "#606060",
      verticalAlign: "top"
    }}>
      {children}
    </td>
  );
}

export function ThemedTR({ children, index }: { children: ReactNode; index: number }) {
  return (
    <tr style={{ backgroundColor: index % 2 === 0 ? "#fff" : ROW_ALT }}>
      {children}
    </tr>
  );
}

export function ThemedEmptyRow({ colSpan, message = "No records found" }: { colSpan: number; message?: string }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{
        border: "1px solid #ddd",
        padding: "20px 8px",
        textAlign: "center",
        color: "#999",
        fontSize: 11
      }}>
        {message}
      </td>
    </tr>
  );
}

/* Reusable action link for table Action columns */
export function ThemedActionLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <span
      onClick={onClick}
      style={{ color: "#c00", cursor: "pointer", fontSize: 10, display: "block" }}
      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
    >
      {children}
    </span>
  );
}

/* Reusable filter input styling */
export const filterSelectStyle: React.CSSProperties = {
  border: "1px solid #999",
  padding: "2px 4px",
  fontSize: 11,
  fontFamily: "Arial, Helvetica, sans-serif",
  minWidth: 120,
};

export const filterInputStyle: React.CSSProperties = {
  border: "1px solid #999",
  padding: "2px 4px",
  fontSize: 11,
  fontFamily: "Arial, Helvetica, sans-serif",
};

export const filterButtonStyle: React.CSSProperties = {
  border: "1px solid #888",
  padding: "2px 12px",
  fontSize: 11,
  fontFamily: "Arial, Helvetica, sans-serif",
  backgroundColor: "#f5f5f5",
  cursor: "pointer",
};
