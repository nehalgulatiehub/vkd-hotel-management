import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateInput } from "@/components/ui/DateInput";
import { Download, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProfilesMap } from "@/hooks/useProfilesMap";
import { formatDate } from "@/utils/dateFormat";
import * as XLSX from "xlsx";

export default function ExportBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const { profiles, getUserName } = useProfilesMap();

  const fetchBookings = async () => {
    setLoading(true);
    let query = supabase
      .from("bookings")
      .select("*, agent:agents(name)")
      .neq("status", "cancelled")
      .order("created_at", { ascending: false });

    if (dateFrom) query = query.gte("check_in_date", dateFrom);
    if (dateTo) query = query.lte("check_in_date", dateTo);

    const { data, error } = await query;
    if (error) toast.error("Failed to load bookings");
    else setBookings(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, [dateFrom, dateTo]);

  const filtered = bookings.filter((b) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      b.booking_number?.toLowerCase().includes(q) ||
      b.customer_name?.toLowerCase().includes(q) ||
      b.contact_no?.includes(searchTerm) ||
      b.email?.toLowerCase().includes(q) ||
      b.agent?.name?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || b.payment_status === statusFilter;
    const matchesUser = userFilter === "all" || b.created_by === userFilter;
    return matchesSearch && matchesStatus && matchesUser;
  });

  const handleExport = () => {
    if (!filtered.length) return;
    const rows = filtered.map((b) => ({
      "Booking No": b.booking_number,
      "Customer": b.customer_name || "-",
      "Contact": b.contact_no || "-",
      "Email": b.email || "-",
      "Type": b.booking_type || "-",
      "Agent": b.agent?.name || "-",
      "Check-in": b.check_in_date ? formatDate(b.check_in_date) : "-",
      "Check-out": b.check_out_date ? formatDate(b.check_out_date) : "-",
      "Adults": b.adults ?? 0,
      "Children": b.children ?? 0,
      "Total": b.total_amount ?? 0,
      "Paid": b.paid_amount ?? 0,
      "Due": b.due_amount ?? 0,
      "Payment Status": b.payment_status || "-",
      "Status": b.status || "-",
      "Created By": b.created_by ? getUserName(b.created_by) : "-",
      "Created": b.created_at ? formatDate(b.created_at) : "-",
      "Notes": b.notes || "-",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bookings");
    XLSX.writeFile(wb, `bookings_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Bookings exported successfully");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Export Bookings" />
      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Export Bookings</h2>
          <Button className="bg-gradient-primary" onClick={handleExport} disabled={!filtered.length}>
            <Download className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <Label>Check-in From</Label>
                <DateInput value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div>
                <Label>Check-in To</Label>
                <DateInput value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
              <div>
                <Label>Payment Status</Label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              <div>
                <Label>Created By</Label>
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="all">All Users</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.username || `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Unknown"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="No, customer, contact, email..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm text-muted-foreground mb-2">Total Bookings: {filtered.length}</p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">Booking No</th>
                      <th className="text-left p-3 font-semibold">Customer</th>
                      <th className="text-left p-3 font-semibold">Agent</th>
                      <th className="text-left p-3 font-semibold">Check-in</th>
                      <th className="text-left p-3 font-semibold">Check-out</th>
                      <th className="text-right p-3 font-semibold">Total</th>
                      <th className="text-right p-3 font-semibold">Paid</th>
                      <th className="text-right p-3 font-semibold">Due</th>
                      <th className="text-left p-3 font-semibold">Payment</th>
                      <th className="text-left p-3 font-semibold">Created By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td className="p-4 text-center text-muted-foreground" colSpan={10}>Loading...</td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td className="p-4 text-center text-muted-foreground" colSpan={10}>No bookings found</td></tr>
                    ) : filtered.map((b) => (
                      <tr key={b.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">{b.booking_number}</td>
                        <td className="p-3">{b.customer_name || "-"}</td>
                        <td className="p-3">{b.agent?.name || "-"}</td>
                        <td className="p-3">{b.check_in_date ? formatDate(b.check_in_date) : "-"}</td>
                        <td className="p-3">{b.check_out_date ? formatDate(b.check_out_date) : "-"}</td>
                        <td className="p-3 text-right">{b.total_amount ?? 0}</td>
                        <td className="p-3 text-right">{b.paid_amount ?? 0}</td>
                        <td className="p-3 text-right">{b.due_amount ?? 0}</td>
                        <td className="p-3 capitalize">{b.payment_status || "-"}</td>
                        <td className="p-3">{b.created_by ? getUserName(b.created_by) : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
