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

export default function Hotels() {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    hotelName: "",
    cityId: "",
    contactNo: "",
    email: ""
  });

  useEffect(() => {
    fetchHotels();
    fetchCities();
  }, []);

  const fetchHotels = async () => {
    const { data, error } = await supabase
      .from("another_hotels")
      .select("*, cities(name)")
      .order("name");

    if (!error) {
      setHotels(data || []);
    }
  };

  const fetchCities = async () => {
    const { data } = await supabase.from("cities").select("*").order("name");
    setCities(data || []);
  };

  const handleEdit = (hotel: any) => {
    navigate(`/hotels/add?edit=${hotel.id}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this hotel?")) return;
    
    const { error } = await supabase.from("another_hotels").delete().eq("id", id);
    if (error) {
      toast.error("Error deleting hotel");
    } else {
      toast.success("Hotel deleted successfully");
      fetchHotels();
    }
  };

  const clearFilters = () => {
    setFilters({
      hotelName: "",
      cityId: "",
      contactNo: "",
      email: ""
    });
  };

  const filteredHotels = hotels.filter(hotel => {
    const matchesName = !filters.hotelName || 
      hotel.name.toLowerCase().includes(filters.hotelName.toLowerCase());
    const matchesCity = !filters.cityId || hotel.city_id === filters.cityId;
    const matchesContact = !filters.contactNo || 
      hotel.phone?.includes(filters.contactNo);
    const matchesEmail = !filters.email || 
      hotel.email?.toLowerCase().includes(filters.email.toLowerCase());
    
    return matchesName && matchesCity && matchesContact && matchesEmail;
  });

  const {
    paginatedItems,
    currentPage,
    totalPages,
    goToPage,
    totalItems,
    startIndex,
    endIndex,
  } = usePagination(filteredHotels, { itemsPerPage: 10 });

  return (
    <div className="min-h-screen bg-background">
      <Header title="Partner Hotel Management" />
      <main className="p-4">
        <LegacyPanelHeader
          title="View Another Hotel"
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
              <span className={legacyFilterLabelClass}>Hotel Name :</span>
              <input
                value={filters.hotelName}
                onChange={(e) => setFilters({...filters, hotelName: e.target.value})}
                className={`${legacyFilterInputClass} w-40`}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className={legacyFilterLabelClass}>City Name :</span>
              <select
                value={filters.cityId}
                onChange={(e) => setFilters({...filters, cityId: e.target.value})}
                className={`${legacyFilterInputClass} min-w-[150px]`}
              >
                <option value="">-City-</option>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <span className={legacyFilterLabelClass}>Contact No :</span>
              <input
                value={filters.contactNo}
                onChange={(e) => setFilters({...filters, contactNo: e.target.value})}
                className={`${legacyFilterInputClass} w-40`}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className={legacyFilterLabelClass}>Email-Id :</span>
              <input
                value={filters.email}
                onChange={(e) => setFilters({...filters, email: e.target.value})}
                className={`${legacyFilterInputClass} w-48`}
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
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Hotel Name</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Rooms</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Contact-Person</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Packages</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">City</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="border border-[#c99] px-4 py-8 text-center text-muted-foreground">
                        No hotels found
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((hotel) => (
                      <tr key={hotel.id} style={{ backgroundColor: "#F5E6E0" }}>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          <div className="font-medium">{hotel.name}</div>
                        </td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          {hotel.room_types || "-"}
                        </td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          <div>{hotel.contact_person || "-"}</div>
                          {hotel.phone && <div>Contact: {hotel.phone}</div>}
                          {hotel.address && <div>Address: {hotel.address}</div>}
                          {hotel.email && <div>Email: {hotel.email}</div>}
                        </td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          {hotel.packages || "-"}
                        </td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          {hotel.cities?.name || "-"}
                        </td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          <div className="flex gap-2">
                            <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary" onClick={() => handleEdit(hotel)}>
                              Edit
                            </Button>
                            <span className="text-muted-foreground">/</span>
                            <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-destructive" onClick={() => handleDelete(hotel.id)}>
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
