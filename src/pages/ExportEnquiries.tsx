import { DateInput } from "@/components/ui/DateInput";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { LegacyFormPanel } from "@/components/legacy/LegacyFormPanel";

export default function ExportEnquiries() {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    let query = supabase
      .from("enquiries")
      .select("*, agents(name)")
      .order("created_at", { ascending: false });

    if (dateFrom) {
      query = query.gte("created_at", dateFrom);
    }
    if (dateTo) {
      query = query.lte("created_at", dateTo);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Failed to load enquiries");
    } else {
      setEnquiries(data || []);
    }
  };

  const filteredEnquiries = enquiries.filter(enquiry =>
    enquiry.enquiry_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enquiry.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enquiry.agents?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    const exportData = filteredEnquiries.map(enquiry => ({
      "Enquiry Number": enquiry.enquiry_number,
      "Customer Name": enquiry.customer_name || "-",
      "Agent": enquiry.agents?.name || "-",
      "Contact": enquiry.contact_no || "-",
      "Email": enquiry.email || "-",
      "Check-in": enquiry.check_in_date || "-",
      "Check-out": enquiry.check_out_date || "-",
      "Adults": enquiry.adults,
      "Children": enquiry.children,
      "Status": enquiry.status,
      "Created": new Date(enquiry.created_at).toLocaleDateString(),
      "Notes": enquiry.notes || "-"
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Enquiries");
    XLSX.writeFile(wb, `enquiries_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Enquiries exported successfully");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Export Enquiries" />
      <main className="p-4">
        <LegacyFormPanel
          title="Export Enquiries"
          rightSlot={
            <Button
              variant="link"
              className="text-white p-0 h-auto text-sm hover:text-white/80"
              onClick={handleExport}
              disabled={filteredEnquiries.length === 0}
            >
              <Download className="h-4 w-4 mr-1" />
              Export to Excel
            </Button>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>From Date</Label>
              <DateInput
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setTimeout(fetchEnquiries, 100);
                }}
              />
            </div>
            <div>
              <Label>To Date</Label>
              <DateInput
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setTimeout(fetchEnquiries, 100);
                }}
              />
            </div>
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search enquiries..."
                  className="pl-10 bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Total Enquiries: {filteredEnquiries.length}</p>
        </LegacyFormPanel>

        <Card className="mt-4">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ backgroundColor: "#D4A59A" }}>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Enquiry No</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Customer</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Agent</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Check-in</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Check-out</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Guests</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnquiries.length === 0 ? (
                    <tr><td className="border border-[#c99] p-4 text-center text-muted-foreground" colSpan={7}>No enquiries found</td></tr>
                  ) : filteredEnquiries.map((enquiry) => (
                    <tr key={enquiry.id} style={{ backgroundColor: "#F5E6E0" }}>
                      <td className="border border-[#c99] px-3 py-2 text-xs">{enquiry.enquiry_number}</td>
                      <td className="border border-[#c99] px-3 py-2 text-xs">{enquiry.customer_name || "-"}</td>
                      <td className="border border-[#c99] px-3 py-2 text-xs">{enquiry.agents?.name || "-"}</td>
                      <td className="border border-[#c99] px-3 py-2 text-xs">
                        {enquiry.check_in_date ? new Date(enquiry.check_in_date).toLocaleDateString() : "-"}
                      </td>
                      <td className="border border-[#c99] px-3 py-2 text-xs">
                        {enquiry.check_out_date ? new Date(enquiry.check_out_date).toLocaleDateString() : "-"}
                      </td>
                      <td className="border border-[#c99] px-3 py-2 text-xs">{enquiry.adults + enquiry.children}</td>
                      <td className="border border-[#c99] px-3 py-2 text-xs capitalize">{enquiry.status.replace("_", " ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
