import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";

interface City {
  id: string;
  name: string;
}

interface AnotherHotel {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  rating: number | null;
  city_id: string | null;
  notes: string | null;
  room_types: string | null;
  packages: string | null;
  city?: { name: string } | null;
}

export default function AdminAnotherHotels() {
  const navigate = useNavigate();
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [hotels, setHotels] = useState<AnotherHotel[]>([]);
  const [filteredHotels, setFilteredHotels] = useState<AnotherHotel[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [hotelNameFilter, setHotelNameFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [contactNoFilter, setContactNoFilter] = useState("");
  const [selectedHotels, setSelectedHotels] = useState<string[]>([]);

  const canManage = isAdmin() || isAccount();

  useEffect(() => {
    if (!authLoading && canManage) {
      fetchHotels();
      fetchCities();
    }
  }, [authLoading, canManage]);

  useEffect(() => {
    setFilteredHotels(hotels);
  }, [hotels]);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("another_hotels")
        .select("*, city:cities(name)")
        .order("name");

      if (error) throw error;
      setHotels(data || []);
    } catch (error) {
      console.error("Error fetching hotels:", error);
      toast.error("Failed to fetch hotels");
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const { data, error } = await supabase
        .from("cities")
        .select("id, name")
        .order("name");
      if (error) throw error;
      setCities(data || []);
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  const handleSearch = () => {
    let result = [...hotels];
    
    if (hotelNameFilter) {
      result = result.filter(h => h.id === hotelNameFilter);
    }
    if (cityFilter) {
      result = result.filter(h => h.city_id === cityFilter);
    }
    if (emailFilter) {
      result = result.filter(h => h.email?.toLowerCase().includes(emailFilter.toLowerCase()));
    }
    if (contactNoFilter) {
      result = result.filter(h => h.phone?.includes(contactNoFilter));
    }
    
    setFilteredHotels(result);
  };

  const handleViewAll = () => {
    setHotelNameFilter("");
    setCityFilter("");
    setEmailFilter("");
    setContactNoFilter("");
    setFilteredHotels(hotels);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this hotel?")) return;
    
    try {
      const { error } = await supabase.from("another_hotels").delete().eq("id", id);
      if (error) throw error;
      toast.success("Hotel deleted successfully");
      fetchHotels();
    } catch (error) {
      console.error("Error deleting hotel:", error);
      toast.error("Failed to delete hotel");
    }
  };

  const toggleHotelSelection = (id: string) => {
    setSelectedHotels(prev => 
      prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedHotels.length === filteredHotels.length) {
      setSelectedHotels([]);
    } else {
      setSelectedHotels(filteredHotels.map(h => h.id));
    }
  };

  if (authLoading || loading) {
    return <div className="p-6 text-center text-muted-foreground">Loading...</div>;
  }

  if (!canManage) {
    return <div className="p-6 text-center">Access Denied</div>;
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="bg-[#b44a50] text-white px-4 py-2 flex items-center justify-between mb-0">
        <span className="text-sm font-medium">Manage Another Hotel</span>
        <Button 
          size="sm" 
          variant="outline"
          className="bg-white text-[#c00] hover:bg-gray-100 h-7 text-xs"
          onClick={() => navigate("/admin/another-hotels/add")}
        >
          Add Another Hotel
        </Button>
      </div>

      {/* Search Header */}
      <div className="bg-[#b44a50] text-white px-4 py-1">
        <span className="text-xs font-medium">Search</span>
      </div>

      {/* Search Filter Section */}
      <div className="border border-t-0 border-gray-300 bg-[#f6f0f0] p-3">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2">
          {/* Row 1 */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-700 w-20 text-right">Hotel Name :</label>
            <select
              value={hotelNameFilter}
              onChange={(e) => setHotelNameFilter(e.target.value)}
              className="flex-1 h-7 text-xs border border-gray-300 rounded px-2 bg-white"
            >
              <option value="">-- Select --</option>
              {hotels.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-700 w-16 text-right">Email :</label>
            <Input
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              className="flex-1 h-7 text-xs"
              placeholder=""
            />
          </div>

          {/* Row 2 */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-700 w-20 text-right">City Name :</label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="flex-1 h-7 text-xs border border-gray-300 rounded px-2 bg-white"
            >
              <option value="">-- Select --</option>
              {cities.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-700 w-16 text-right">Contact No :</label>
            <Input
              value={contactNoFilter}
              onChange={(e) => setContactNoFilter(e.target.value)}
              className="flex-1 h-7 text-xs"
              placeholder=""
            />
            <Button 
              size="sm" 
              onClick={handleSearch}
              className="h-7 text-xs px-4 bg-gray-200 text-gray-800 hover:bg-gray-300 border border-gray-400"
            >
              Search
            </Button>
          </div>
        </div>

        {/* View All Records Button */}
        <div className="flex justify-end mt-2">
          <Button 
            size="sm" 
            onClick={handleViewAll}
            className="h-7 text-xs px-3 bg-[#b44a50] hover:bg-[#165a80] text-white"
          >
            View All Records
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-t-0 border-gray-300 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#c47a7e] text-gray-800">
              <th className="border border-gray-400 px-2 py-1.5 text-left font-medium">Hotel Name</th>
              <th className="border border-gray-400 px-2 py-1.5 text-left font-medium">Room</th>
              <th className="border border-gray-400 px-2 py-1.5 text-left font-medium">Contact Person/Email</th>
              <th className="border border-gray-400 px-2 py-1.5 text-left font-medium">Contact No/City</th>
              <th className="border border-gray-400 px-2 py-1.5 text-left font-medium">Address</th>
              <th className="border border-gray-400 px-2 py-1.5 text-left font-medium">Package</th>
              <th className="border border-gray-400 px-2 py-1.5 text-center font-medium">Action</th>
              <th className="border border-gray-400 px-2 py-1.5 text-center font-medium w-8">
                <Checkbox 
                  checked={selectedHotels.length === filteredHotels.length && filteredHotels.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredHotels.map((hotel, index) => (
              <tr key={hotel.id} className={index % 2 === 0 ? "bg-[#f6f0f0]" : "bg-white"}>
                <td className="border border-gray-300 px-2 py-1.5">{hotel.name}</td>
                <td className="border border-gray-300 px-2 py-1.5">{hotel.room_types || ""}</td>
                <td className="border border-gray-300 px-2 py-1.5">
                  <div>{hotel.contact_person || ""}</div>
                  <div className="text-gray-600">Email : {hotel.email || ""}</div>
                </td>
                <td className="border border-gray-300 px-2 py-1.5">
                  <div>{hotel.phone || ""}</div>
                  <div className="text-gray-600">City : {hotel.city?.name || ""}</div>
                </td>
                <td className="border border-gray-300 px-2 py-1.5">{hotel.address || ""}</td>
                <td className="border border-gray-300 px-2 py-1.5">{hotel.packages || ""}</td>
                <td className="border border-gray-300 px-2 py-1.5 text-center">
                  <button
                    onClick={() => navigate(`/admin/another-hotels/add?edit=${hotel.id}`)}
                    className="text-blue-600 hover:underline text-xs"
                  >
                    Edit
                  </button>
                  <span className="text-gray-400">/</span>
                  <button
                    onClick={() => handleDelete(hotel.id)}
                    className="text-blue-600 hover:underline text-xs"
                  >
                    Delete
                  </button>
                </td>
                <td className="border border-gray-300 px-2 py-1.5 text-center">
                  <Checkbox 
                    checked={selectedHotels.includes(hotel.id)}
                    onCheckedChange={() => toggleHotelSelection(hotel.id)}
                  />
                </td>
              </tr>
            ))}
            {filteredHotels.length === 0 && (
              <tr>
                <td colSpan={8} className="border border-gray-300 px-2 py-8 text-center text-gray-500">
                  No hotels found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
