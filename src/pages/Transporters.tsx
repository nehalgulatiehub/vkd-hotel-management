import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/TablePagination";
import { Card, CardContent } from "@/components/ui/card";

export default function Transporters() {
  const navigate = useNavigate();
  const [transporters, setTransporters] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    name: "",
    email: "",
    cityId: "",
    contactNo: ""
  });

  useEffect(() => {
    fetchTransporters();
    fetchCities();
  }, []);

  const fetchTransporters = async () => {
    const { data, error } = await supabase
      .from("transporters")
      .select("*, cities(name)")
      .order("name");

    if (!error) {
      setTransporters(data || []);
    }
  };

  const fetchCities = async () => {
    const { data } = await supabase.from("cities").select("*").order("name");
    setCities(data || []);
  };

  const handleEdit = (transporter: any) => {
    navigate(`/transporters/add?edit=${transporter.id}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transporter?")) return;
    
    const { error } = await supabase.from("transporters").delete().eq("id", id);
    if (error) {
      toast.error("Error deleting transporter");
    } else {
      toast.success("Transporter deleted successfully");
      fetchTransporters();
    }
  };

  const clearFilters = () => {
    setFilters({
      name: "",
      email: "",
      cityId: "",
      contactNo: ""
    });
  };

  const filteredTransporters = transporters.filter(t => {
    const matchesName = !filters.name || 
      t.name.toLowerCase().includes(filters.name.toLowerCase()) ||
      t.company_name?.toLowerCase().includes(filters.name.toLowerCase());
    const matchesEmail = !filters.email || 
      t.email?.toLowerCase().includes(filters.email.toLowerCase());
    const matchesCity = !filters.cityId || t.city_id === filters.cityId;
    const matchesContact = !filters.contactNo || 
      t.phone?.includes(filters.contactNo);
    
    return matchesName && matchesEmail && matchesCity && matchesContact;
  });

  const {
    paginatedItems,
    currentPage,
    totalPages,
    goToPage,
    totalItems,
    startIndex,
    endIndex,
  } = usePagination(filteredTransporters, { itemsPerPage: 10 });

  return (
    <div className="min-h-screen bg-background">
      <Header title="Transporter Management" />
      <main className="p-4">
        {/* Blue Header Bar */}
        <div className="flex justify-between items-center px-4 py-2 mb-3" style={{ backgroundColor: "#1e6e99" }}>
          <span className="text-white font-semibold text-sm">View Transporter</span>
          <Button variant="link" className="text-white p-0 h-auto text-sm hover:text-white/80" onClick={clearFilters}>
            View All Records
          </Button>
        </div>

        {/* Compact Filter Section */}
        <div className="mb-3 border border-border">
              <div className="bg-[#8B1538] text-white px-3 py-1.5 text-xs font-semibold">Search</div>
              <div className="bg-muted/50">
          {/* Row 1: Transporter Name, Email */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-2 py-1.5 border-b border-border">
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">Transporter Name :</span>
              <input 
                value={filters.name} 
                onChange={(e) => setFilters({...filters, name: e.target.value})} 
                className="h-5 w-40 text-[11px] border border-input bg-background px-1 rounded-sm" 
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">Email :</span>
              <input 
                value={filters.email} 
                onChange={(e) => setFilters({...filters, email: e.target.value})} 
                className="h-5 w-48 text-[11px] border border-input bg-background px-1 rounded-sm" 
              />
            </div>
          </div>

          {/* Row 2: City Name, Contact No */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-2 py-1.5 border-b border-border">
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">City Name :</span>
              <select 
                value={filters.cityId} 
                onChange={(e) => setFilters({...filters, cityId: e.target.value})} 
                className="h-5 text-[11px] border border-input bg-background px-1 min-w-[150px] rounded-sm"
              >
                <option value="">-City-</option>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">Contact No :</span>
              <input 
                value={filters.contactNo} 
                onChange={(e) => setFilters({...filters, contactNo: e.target.value})} 
                className="h-5 w-40 text-[11px] border border-input bg-background px-1 rounded-sm" 
              />
            </div>
          </div>

          {/* Row 3: Search Button */}
          <div className="flex justify-end px-2 py-1.5">
            <button className="h-6 px-4 text-[11px] bg-foreground text-background border border-foreground/80 hover:bg-foreground/90 rounded-sm">
              Search
            </button>
          </div>
        </div>
              </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mb-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Main Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ backgroundColor: "#D4A59A" }}>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Transporter Name</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Email</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Address</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Contact Person</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">City</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="border border-[#c99] px-4 py-8 text-center text-muted-foreground">
                        No transporters found
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((transporter) => (
                      <tr key={transporter.id} style={{ backgroundColor: "#F5E6E0" }}>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          <div className="font-medium">{transporter.name}</div>
                          {transporter.company_name && (
                            <div className="text-muted-foreground">{transporter.company_name}</div>
                          )}
                        </td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          {transporter.email || "-"}
                        </td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          {transporter.address || "-"}
                        </td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          <div>{transporter.notes || "-"}</div>
                          <div className="text-muted-foreground">C-No: {transporter.phone || "-"}</div>
                        </td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          {transporter.cities?.name || "-"}
                        </td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          <div className="flex gap-2">
                            <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary" onClick={() => handleEdit(transporter)}>
                              Edit
                            </Button>
                            <span className="text-muted-foreground">/</span>
                            <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-destructive" onClick={() => handleDelete(transporter.id)}>
                              Delete
                            </Button>
                          </div>
                        </td>
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
      </main>
    </div>
  );
}
