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
import { LegacyPanelHeader } from "@/components/legacy/LegacyPanelHeader";
import {
  legacyFilterContainerStyle,
  legacyFilterLabelClass,
  legacyFilterInputClass,
  legacySearchButtonStyle,
} from "@/components/legacy/legacyFilterStyles";

export default function Cities() {
  const navigate = useNavigate();
  const [cities, setCities] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    name: "",
    state: ""
  });

  const fetchCities = async () => {
    const { data, error } = await supabase
      .from("cities")
      .select("*")
      .order("name");

    if (error) {
      toast.error("Error fetching cities");
    } else {
      setCities(data || []);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  const handleEdit = (id: string) => {
    navigate(`/cities/add?edit=${id}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this city?")) return;
    
    const { error } = await supabase.from("cities").delete().eq("id", id);
    if (error) {
      toast.error("Error deleting city");
    } else {
      toast.success("City deleted successfully");
      fetchCities();
    }
  };

  const clearFilters = () => {
    setFilters({
      name: "",
      state: ""
    });
  };

  const filteredCities = cities.filter(city => {
    const matchesName = !filters.name || 
      city.name.toLowerCase().includes(filters.name.toLowerCase());
    const matchesState = !filters.state || 
      city.state?.toLowerCase().includes(filters.state.toLowerCase());
    
    return matchesName && matchesState;
  });

  const {
    paginatedItems,
    currentPage,
    totalPages,
    goToPage,
    totalItems,
    startIndex,
    endIndex,
  } = usePagination(filteredCities, { itemsPerPage: 10 });

  return (
    <div className="min-h-screen bg-background">
      <Header title="City Management" />
      <main className="p-4">
        <LegacyPanelHeader
          title="View City"
          className="mb-3"
          right={
            <Button variant="link" className="text-white p-0 h-auto text-sm hover:text-white/80" onClick={clearFilters}>
              View All Records
            </Button>
          }
        />

        {/* Compact Filter Section */}
        <div className="mb-3" style={legacyFilterContainerStyle}>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <span className={legacyFilterLabelClass}>City Name :</span>
              <input
                value={filters.name}
                onChange={(e) => setFilters({...filters, name: e.target.value})}
                className={`${legacyFilterInputClass} w-40`}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className={legacyFilterLabelClass}>State :</span>
              <input
                value={filters.state}
                onChange={(e) => setFilters({...filters, state: e.target.value})}
                className={`${legacyFilterInputClass} w-40`}
              />
            </div>
          </div>

          <div className="flex justify-end px-3 pb-2">
            <button style={legacySearchButtonStyle}>Search</button>
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
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">City Name</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">State</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Country</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Created At</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="border border-[#c99] px-4 py-8 text-center text-muted-foreground">
                        No cities found
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((city) => (
                      <tr key={city.id} style={{ backgroundColor: "#F5E6E0" }}>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top font-medium">
                          {city.name}
                        </td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          {city.state || "-"}
                        </td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          {city.country || "-"}
                        </td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          {new Date(city.created_at).toLocaleDateString("en-IN")}
                        </td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          <div className="flex gap-2">
                            <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary" onClick={() => handleEdit(city.id)}>
                              Edit
                            </Button>
                            <span className="text-muted-foreground">/</span>
                            <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-destructive" onClick={() => handleDelete(city.id)}>
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
