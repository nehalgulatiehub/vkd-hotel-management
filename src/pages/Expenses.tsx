import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePagination } from "@/hooks/usePagination";
import { useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { TablePagination } from "@/components/ui/TablePagination";
import { LegacyPanelHeader } from "@/components/legacy/LegacyPanelHeader";
import {
  legacyFilterContainerStyle,
  legacyFilterLabelClass,
  legacyFilterInputClass,
} from "@/components/legacy/legacyFilterStyles";

export default function Expenses() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const [expenses, setExpenses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => { fetchExpenses(); }, []);

  const fetchExpenses = async () => {
    const { data, error } = await supabase.from("group_expenses").select("*, bookings(booking_number, customer_name)").order("expense_date", { ascending: false });
    if (error) { toast.error("Failed to load expenses"); } else { setExpenses(data || []); }
  };

  const filteredExpenses = expenses.filter(expense =>
    expense.bookings?.booking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.bookings?.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filteredExpenses);

  const content = (
    <>
      <LegacyPanelHeader title="View Group Expense" className="mb-3" />

      <div className="mb-3" style={legacyFilterContainerStyle}>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <span className={legacyFilterLabelClass}>Search :</span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by booking, customer, or description..."
              className={`${legacyFilterInputClass} w-72`}
            />
          </div>
          <span className="ml-auto text-[13px] font-bold text-black">
            Total: Rs. {totalExpenses.toLocaleString("en-IN")}/-
          </span>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ backgroundColor: "#D4A59A" }}>
                  <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">S.No</th>
                  <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Date</th>
                  <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Booking No</th>
                  <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Customer</th>
                  <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Category</th>
                  <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Description</th>
                  <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="border border-[#c99] px-4 py-8 text-center text-muted-foreground">
                      No expenses found
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((expense, index) => (
                    <tr key={expense.id} style={{ backgroundColor: "#F5E6E0" }}>
                      <td className="border border-[#c99] px-3 py-2 text-xs align-top">{startIndex + index}</td>
                      <td className="border border-[#c99] px-3 py-2 text-xs align-top">{expense.expense_date ? new Date(expense.expense_date).toLocaleDateString() : "-"}</td>
                      <td className="border border-[#c99] px-3 py-2 text-xs align-top">{expense.bookings?.booking_number || "-"}</td>
                      <td className="border border-[#c99] px-3 py-2 text-xs align-top">{expense.bookings?.customer_name || "-"}</td>
                      <td className="border border-[#c99] px-3 py-2 text-xs align-top">{expense.category || "-"}</td>
                      <td className="border border-[#c99] px-3 py-2 text-xs align-top">{expense.description || "-"}</td>
                      <td className="border border-[#c99] px-3 py-2 text-xs align-top">Rs. {expense.amount?.toLocaleString() || 0}/-</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            totalItems={totalItems}
            startIndex={startIndex}
            endIndex={endIndex}
          />
        </CardContent>
      </Card>
    </>
  );

  if (!isAdminRoute) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Group Expenses" />
        <main className="p-4">{content}</main>
      </div>
    );
  }

  return content;
}
