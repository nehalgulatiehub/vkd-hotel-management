import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePagination } from "@/hooks/usePagination";
import { useLocation } from "react-router-dom";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow, filterInputStyle } from "@/components/admin/AdminPageShell";
import { Header } from "@/components/layout/Header";

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

  if (!isAdminRoute) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Group Expenses" />
        <main className="p-6">
          <AdminPageShell title="Group Expenses" filterSection={
            <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif" }}>
              <span>Search :</span>
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ ...filterInputStyle, flex: 1 }} placeholder="Search by booking, customer, or description..." />
              <span style={{ marginLeft: "auto", fontWeight: "bold" }}>Total: Rs. {totalExpenses.toLocaleString("en-IN")}/-</span>
            </div>
          } pagination={{ currentPage, totalPages, onPageChange: goToPage, totalItems, startIndex, endIndex }}>
            <ThemedTable>
              <ThemedTHead><ThemedTH>S.No</ThemedTH><ThemedTH>Date</ThemedTH><ThemedTH>Booking No</ThemedTH><ThemedTH>Customer</ThemedTH><ThemedTH>Category</ThemedTH><ThemedTH>Description</ThemedTH><ThemedTH>Amount</ThemedTH></ThemedTHead>
              <tbody>
                {paginatedItems.length === 0 ? <ThemedEmptyRow colSpan={7} message="No expenses found" /> : paginatedItems.map((expense, index) => (
                  <ThemedTR key={expense.id} index={index}>
                    <ThemedTD>{startIndex + index + 1}</ThemedTD>
                    <ThemedTD>{expense.expense_date ? new Date(expense.expense_date).toLocaleDateString() : "-"}</ThemedTD>
                    <ThemedTD>{expense.bookings?.booking_number || "-"}</ThemedTD>
                    <ThemedTD>{expense.bookings?.customer_name || "-"}</ThemedTD>
                    <ThemedTD>{expense.category || "-"}</ThemedTD>
                    <ThemedTD>{expense.description || "-"}</ThemedTD>
                    <ThemedTD>Rs. {expense.amount?.toLocaleString() || 0}/-</ThemedTD>
                  </ThemedTR>
                ))}
              </tbody>
            </ThemedTable>
          </AdminPageShell>
        </main>
      </div>
    );
  }

  const filterSection = (
    <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif" }}>
      <span>Search :</span>
      <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ ...filterInputStyle, flex: 1 }} placeholder="Search by booking, customer, or description..." />
      <span style={{ marginLeft: "auto", fontWeight: "bold" }}>Total: Rs. {totalExpenses.toLocaleString("en-IN")}/-</span>
    </div>
  );

  return (
    <AdminPageShell title="Group Expenses" filterSection={filterSection} pagination={{ currentPage, totalPages, onPageChange: goToPage, totalItems, startIndex, endIndex }}>
      <ThemedTable>
        <ThemedTHead><ThemedTH>S.No</ThemedTH><ThemedTH>Date</ThemedTH><ThemedTH>Booking No</ThemedTH><ThemedTH>Customer</ThemedTH><ThemedTH>Category</ThemedTH><ThemedTH>Description</ThemedTH><ThemedTH>Amount</ThemedTH></ThemedTHead>
        <tbody>
          {paginatedItems.length === 0 ? <ThemedEmptyRow colSpan={7} message="No expenses found" /> : paginatedItems.map((expense, index) => (
            <ThemedTR key={expense.id} index={index}>
              <ThemedTD>{startIndex + index + 1}</ThemedTD>
              <ThemedTD>{expense.expense_date ? new Date(expense.expense_date).toLocaleDateString() : "-"}</ThemedTD>
              <ThemedTD>{expense.bookings?.booking_number || "-"}</ThemedTD>
              <ThemedTD>{expense.bookings?.customer_name || "-"}</ThemedTD>
              <ThemedTD>{expense.category || "-"}</ThemedTD>
              <ThemedTD>{expense.description || "-"}</ThemedTD>
              <ThemedTD>Rs. {expense.amount?.toLocaleString() || 0}/-</ThemedTD>
            </ThemedTR>
          ))}
        </tbody>
      </ThemedTable>
    </AdminPageShell>
  );
}
