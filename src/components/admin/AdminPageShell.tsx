import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
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

export function AdminPageShell({ title, actions, filterSection, children, pagination }: AdminPageShellProps) {
  return (
    <div className="p-4">
      {/* Blue Header */}
      <div className="bg-[#1e6e99] text-white px-4 py-2 flex items-center justify-between mb-0">
        <span className="text-sm font-medium">{title}</span>
        {actions && actions.length > 0 && (
          <div className="flex gap-2">
            {actions.map((action, i) => (
              <Button
                key={i}
                size="sm"
                variant="outline"
                className="bg-white text-[#1e6e99] hover:bg-gray-100 h-7 text-xs"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Search/Filter Section */}
      {filterSection && (
        <>
          <div className="bg-[#8B1538] text-white px-4 py-1">
            <span className="text-xs font-medium">Search</span>
          </div>
          <div className="border border-t-0 border-gray-300 bg-[#F5E6E0] p-3">
            {filterSection}
          </div>
        </>
      )}

      {/* Table */}
      <div className="border border-t-0 border-gray-300 overflow-x-auto">
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

/* Reusable themed table sub-components */
export function ThemedTable({ children }: { children: ReactNode }) {
  return <table className="w-full text-xs">{children}</table>;
}

export function ThemedTHead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="bg-[#D4A59A] text-gray-800">{children}</tr>
    </thead>
  );
}

export function ThemedTH({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <th className={`border border-gray-400 px-2 py-1.5 text-left font-medium ${className}`}>
      {children}
    </th>
  );
}

export function ThemedTD({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <td className={`border border-gray-300 px-2 py-1.5 ${className}`}>
      {children}
    </td>
  );
}

export function ThemedTR({ children, index }: { children: ReactNode; index: number }) {
  return (
    <tr className={index % 2 === 0 ? "bg-[#F5E6E0]" : "bg-white"}>
      {children}
    </tr>
  );
}

export function ThemedEmptyRow({ colSpan, message = "No records found" }: { colSpan: number; message?: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="border border-gray-300 px-2 py-8 text-center text-gray-500">
        {message}
      </td>
    </tr>
  );
}
