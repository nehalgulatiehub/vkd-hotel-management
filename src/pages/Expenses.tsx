import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Expenses() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    const { data, error } = await supabase
      .from("group_expenses")
      .select("*, bookings(booking_number, customer_name)")
      .order("expense_date", { ascending: false });

    if (error) {
      toast.error("Failed to load expenses");
    } else {
      setExpenses(data || []);
    }
  };

  const filteredExpenses = expenses.filter(expense =>
    expense.bookings?.booking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.bookings?.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Header title="Group Expenses" />
      <main className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Group Expenses</h2>
          <p className="text-muted-foreground mt-2">
            Total Expenses: <span className="font-bold text-lg">₹{totalExpenses.toLocaleString()}</span>
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by booking, customer, or description..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">S.No.</th>
                    <th className="text-left p-4 font-semibold">Date</th>
                    <th className="text-left p-4 font-semibold">Booking No</th>
                    <th className="text-left p-4 font-semibold">Customer</th>
                    <th className="text-left p-4 font-semibold">Category</th>
                    <th className="text-left p-4 font-semibold">Description</th>
                    <th className="text-left p-4 font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense, index) => (
                    <tr key={expense.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">{index + 1}</td>
                      <td className="p-4">
                        {expense.expense_date ? new Date(expense.expense_date).toLocaleDateString() : "-"}
                      </td>
                      <td className="p-4">{expense.bookings?.booking_number || "-"}</td>
                      <td className="p-4">{expense.bookings?.customer_name || "-"}</td>
                      <td className="p-4">{expense.category || "-"}</td>
                      <td className="p-4">{expense.description || "-"}</td>
                      <td className="p-4 font-medium">₹{expense.amount?.toLocaleString() || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredExpenses.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No expenses found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
